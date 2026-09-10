import { parseHeartRateValue } from "@/context";
import BackgroundService from "react-native-background-actions";
import { BleManager } from "react-native-ble-plx";

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

  if (!deviceId) {
    console.error("[BG BLE Error]: Device ID tidak ditemukan");
    return;
  }

  try {
    console.log("[BG BLE] Menghubungkan ke device:", deviceId);
    const connectedDevice = await backgroundBleManager.connectToDevice(deviceId);
    await connectedDevice.discoverAllServicesAndCharacteristics();
    console.log("[BG BLE] Berhasil terhubung!");

    // 2. Cari services dan characteristics secara otomatis
    const services = await connectedDevice.services();

    for (const service of services) {
      const characteristics = await connectedDevice.characteristicsForService(service.uuid);

      for (const characteristic of characteristics) {
        if (characteristic.isNotifiable || characteristic.isIndicatable) {
          monitorSubscription = connectedDevice.monitorCharacteristicForService(service.uuid, characteristic.uuid, async (error, monitoredCharacteristic) => {
            if (error) {
              if (isStopping || error.message?.includes("disconnected")) {
                monitorSubscription.remove();
                console.log("[BG BLE] Monitor dihentikan secara normal.");
                if (BackgroundService.isRunning()) {
                  await BackgroundService.updateNotification({
                    taskDesc: `Device terputus`,
                  });
                }
                return;
              }
              console.error("[BG BLE Error Real]:", error);
              return;
            }

            const value = monitoredCharacteristic?.value;
            if (!value) return;

            const sensorValue = parseHeartRateValue(value);
            if (sensorValue !== null) {
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

    // 3. Jaga agar background task tetap berjalan selama servis aktif
    while (BackgroundService.isRunning()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("[BG BLE Exception]:", error);
  } finally {
    isStopping = true;
    console.log("[BG BLE] Membersihkan resource background...");

    if (monitorSubscription) {
      try {
        monitorSubscription.remove();
      } catch (e) {
        // ignore
      }
    }

    try {
      await backgroundBleManager.cancelDeviceConnection(deviceId);
      console.log("[BG BLE] Koneksi berhasil diputus dari background.");
    } catch (error) {
      console.log("[BG BLE Disconnect Ignored]:", error);
    }
  }
};

// Menerima parameter deviceId
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
