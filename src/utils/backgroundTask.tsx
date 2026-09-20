import { parseHeartRateValue } from "@/context";
import BackgroundService from "react-native-background-actions";
import { BleManager } from "react-native-ble-plx";
import { apiService } from "./apiService"; // Sesuaikan path jika berbeda
import { formatTimestamp6 } from "./time";

// Buat instance manager khusus untuk latar belakang
const backgroundBleManager = new BleManager();

export const backgroundOptions = {
  taskName: "SmartwatchHR",
  taskTitle: "Memantau Detak Jantung",
  taskDesc: "Terhubung di latar belakang...",
  taskIcon: {
    name: "ic_launcher",
    type: "mipmap",
  },
  color: "#017BFE",
  parameters: {
    deviceId: "", // Nilai ini akan diisi saat start
  },
};

export const backgroundTask = async (taskDataArguments: any) => {
  const { deviceId } = taskDataArguments;
  let monitorSubscription: any = null;
  let isStopping = false;

  // 1. Inisialisasi buffer lokal untuk background task
  let hrBuffer: { value: number; timestamp: number }[] = [];
  let lastPostTime = Date.now();

  if (!deviceId) {
    console.error("[BG BLE Error]: Device ID tidak ditemukan");
    return;
  }

  try {
    console.log("[BG BLE] Menghubungkan ke device:", deviceId);
    const connectedDevice = await backgroundBleManager.connectToDevice(deviceId);
    await connectedDevice.discoverAllServicesAndCharacteristics();
    console.log("[BG BLE] Berhasil terhubung!");

    const services = await connectedDevice.services();

    for (const service of services) {
      const characteristics = await connectedDevice.characteristicsForService(service.uuid);

      for (const characteristic of characteristics) {
        if (characteristic.isNotifiable || characteristic.isIndicatable) {
          monitorSubscription = connectedDevice.monitorCharacteristicForService(service.uuid, characteristic.uuid, async (error, monitoredCharacteristic) => {
            if (error) {
              if (isStopping || error.message?.includes("disconnected")) {
                monitorSubscription?.remove();
                if (BackgroundService.isRunning()) {
                  await BackgroundService.updateNotification({
                    taskDesc: `Device terputus`,
                  });
                }
                return;
              }
              return;
            }

            const value = monitoredCharacteristic?.value;
            if (!value) return;

            const sensorValue = parseHeartRateValue(value);
            if (sensorValue !== null) {
              // 2. Simpan nilai ke buffer lokal
              hrBuffer.push({ value: sensorValue, timestamp: Date.now() });

              if (BackgroundService.isRunning()) {
                await BackgroundService.updateNotification({
                  taskDesc: `Detak Jantung: ${sensorValue} BPM`,
                });
              }
            }
          });
        }
      }
    }

    // 3. Loop untuk menjaga task hidup SEKALIGUS melakukan agregasi 10 detik
    while (BackgroundService.isRunning()) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay 1 detik untuk optimasi CPU

      const now = Date.now();

      // Jika selisih waktu sudah mencapai 10 detik (10.000 ms)
      if (now - lastPostTime >= 10000) {
        if (hrBuffer.length > 0) {
          // Kloning dan reset buffer agar tidak bentrok dengan data BLE yang masuk
          const bufferCopy = [...hrBuffer];
          hrBuffer = [];

          // Hitung rata-rata
          const sum = bufferCopy.reduce((acc, curr) => acc + curr.value, 0);
          const averageHR = Math.round(sum / bufferCopy.length);

          const payload = {
            user_id: 1,
            bpm: averageHR,
            start_time: formatTimestamp6(bufferCopy[0].timestamp),
            end_time: formatTimestamp6(bufferCopy[bufferCopy.length - 1].timestamp),
          };
          try {
            // POST agregasi ke API
            await apiService.post("/hr", payload); // Sesuaikan endpoint
            console.log("[BG BLE] Agregasi berhasil diposting ke API:", payload);
          } catch (error) {
            console.error("[BG BLE Error] Gagal post agregasi:", error);
          }
        }

        lastPostTime = now; // Reset timer
      }
    }
  } catch (error) {
    console.error("[BG BLE Exception]:", error);
  } finally {
    isStopping = true;
    console.log("[BG BLE] Membersihkan resource background...");

    monitorSubscription?.remove();

    try {
      await backgroundBleManager.cancelDeviceConnection(deviceId);
      console.log("[BG BLE] Koneksi berhasil diputus dari background.");
    } catch (error) {
      console.log("[BG BLE Disconnect Ignored]:", error);
    }
  }
};

export const startBackgroundTask = async (deviceId: string) => {
  try {
    if (!BackgroundService.isRunning()) {
      backgroundOptions.parameters.deviceId = deviceId;
      await BackgroundService.start(backgroundTask, backgroundOptions);
      console.log("Background task started dengan deviceId:", deviceId);
    }
  } catch (e) {
    console.error("Gagal start background service:", e);
  }
};

export const stopBackgroundTask = async () => {
  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
      console.log("Background task stopped");
    }
  } catch (e) {
    console.error("Gagal stop background service:", e);
  }
};
