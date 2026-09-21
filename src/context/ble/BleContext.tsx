import { startBackgroundTask, stopBackgroundTask } from "@/utils/backgroundTask"; // Sesuaikan path jika berbeda
import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { BleManager, Device, State, Subscription } from "react-native-ble-plx";
import { useHR } from "../hr";
import { BleContextType } from "./ble.types";
import { requestBlePermissions } from "./blePermissions";
import { parseHeartRateValue } from "./bleUtils";

export const BleContext = createContext<BleContextType | null>(null);

export const BleProvider = ({ children }: { children: ReactNode }) => {
  const manager = useRef(new BleManager()).current;
  const { addHR } = useHR();

  const subscriptions = useRef<Subscription[]>([]);
  const isIntentionalDisconnect = useRef(false);
  const connectedDeviceIdRef = useRef<string | null>(null);

  // Referensi untuk timer timeout HR
  const hrTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingConnected, setIsLoadingConnected] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);

  // Sync state ke ref untuk mencegah stale closures
  const updateConnectedDeviceId = (id: string | null) => {
    connectedDeviceIdRef.current = id;
    setConnectedDeviceId(id);
  };

  const clearSubscriptions = () => {
    subscriptions.current.forEach((sub) => sub.remove());
    subscriptions.current = [];
  };

  const stopScan = useCallback(() => {
    manager.stopDeviceScan();
    setIsScanning(false);
  }, [manager]);

  const requestPermissions = async (): Promise<boolean> => {
    return await requestBlePermissions();
  };

  // Fungsi untuk mereset timer setiap kali data masuk
  const resetHrTimeout = useCallback(() => {
    if (hrTimeoutRef.current) {
      clearTimeout(hrTimeoutRef.current);
    }
    // Jika selama 5 detik tidak ada paket BLE baru, paksa HR jadi 0
    hrTimeoutRef.current = setTimeout(() => {
      console.log("[BLE] Tidak ada data HR masuk selama 5 detik. Jam dilepas?");
      addHR(0);
    }, 2500);
  }, [addHR]);

  const startScan = async () => {
    // 1. Cek Izin Bluetooth & Lokasi
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw new Error("Izin Bluetooth/Lokasi tidak diberikan");
    }

    // 2. Cek apakah Hardware Bluetooth Aktif
    const bleState = await manager.state();
    if (bleState !== State.PoweredOn) {
      setDevices([]);
      throw new Error("Bluetooth tidak aktif");
    }

    setDevices([]);
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("BLE Scan Error:", error);
        stopScan();
        return;
      }

      if (device && device.name) {
        setDevices((prevDevices) => {
          if (!prevDevices.some((d) => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });

    setTimeout(() => {
      stopScan();
    }, 10000);
  };

  const connectToDevice = useCallback(
    async (device: Device | string | null, isReconnect = false) => {
      if (!device) return;

      // Cek apakah Bluetooth Aktif sebelum konek
      const bleState = await manager.state();
      if (bleState !== State.PoweredOn) {
        throw new Error("Bluetooth tidak aktif");
      }

      stopScan();

      const targetDeviceId = typeof device === "string" ? device : device.id;
      if (connectedDeviceIdRef.current === targetDeviceId && !isReconnect) return;

      if (!isLoadingConnected) setIsLoadingConnected(true);

      try {
        clearSubscriptions();
        setIsLoadingConnected(true);

        // 1. Proses Koneksi
        const connectedDevice = await manager.connectToDevice(targetDeviceId);
        await connectedDevice.discoverAllServicesAndCharacteristics();
        setConnectedDeviceName(connectedDevice.name);
        updateConnectedDeviceId(connectedDevice.id);

        const disconnectSub = manager.onDeviceDisconnected(targetDeviceId, () => {
          if (isIntentionalDisconnect.current) {
            console.log("[BLE] Intentional disconnect untuk background operation.");
            return;
          }
          console.log("[BLE] Terputus secara tak terduga. Resetting connection state.");
          updateConnectedDeviceId(null);
          setConnectedDeviceName(null);
          setIsLoadingConnected(false); // Pastikan mati saat terputus

          if (hrTimeoutRef.current) {
            clearTimeout(hrTimeoutRef.current);
          }
          addHR(0);
        });

        subscriptions.current.push(disconnectSub);

        // 2. Registrasi Sensor (Subscribing)
        const services = await connectedDevice.services();

        for (const service of services) {
          const characteristics = await connectedDevice.characteristicsForService(service.uuid);

          for (const characteristic of characteristics) {
            if (characteristic.isNotifiable || characteristic.isIndicatable) {
              const sub = connectedDevice.monitorCharacteristicForService(service.uuid, characteristic.uuid, (error, monitoredCharacteristic) => {
                if (error) {
                  console.log("[BLE] Sensor error/tidak dapat membaca data:", error.message);
                  addHR(0);
                  return;
                }

                const value = monitoredCharacteristic?.value;

                if (!value) {
                  addHR(0);
                  return;
                }

                const sensorValue = parseHeartRateValue(value);

                if (sensorValue !== null && sensorValue > 0) {
                  addHR(sensorValue);
                  resetHrTimeout(); // Reset timer karena data berhasil masuk
                } else {
                  addHR(0);
                }
              });

              subscriptions.current.push(sub);
            }
          }
        }

        // 3. MATIKAN LOADING DI SINI
        // Koneksi BLE dan setup listener sudah selesai sepenuhnya
        setIsLoadingConnected(false);
      } catch (error) {
        console.error("Gagal terhubung ke device:", error);
        setDevices([]);
        setIsLoadingConnected(false);
        if (!isReconnect) {
          updateConnectedDeviceId(null);
          setConnectedDeviceName(null);
        }
        throw error;
      }
    },
    [addHR, manager, stopScan, isLoadingConnected, resetHrTimeout],
  );

  const disconnectDevice = async () => {
    isIntentionalDisconnect.current = false;
    clearSubscriptions();
    setDevices([]);

    if (hrTimeoutRef.current) {
      clearTimeout(hrTimeoutRef.current);
    }

    if (connectedDeviceIdRef.current) {
      try {
        await manager.cancelDeviceConnection(connectedDeviceIdRef.current);
      } catch (error) {
        console.error("Disconnect Error:", error);
      }
      updateConnectedDeviceId(null);
      setConnectedDeviceName(null);
      addHR(0); // Paksa 0 saat disconnect manual
    }
  };

  // Manajemen AppState untuk transisi UI <-> Background Service
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const activeId = connectedDeviceIdRef.current;

      if (nextAppState.match(/inactive|background/) && activeId) {
        console.log("[AppState] Masuk background: Menghentikan koneksi UI & menjalankan service");
        isIntentionalDisconnect.current = true;
        clearSubscriptions();

        if (hrTimeoutRef.current) {
          clearTimeout(hrTimeoutRef.current);
        }

        try {
          await manager.cancelDeviceConnection(activeId);
        } catch (error) {
          console.log("Cleanup UI connection info:", error);
        }

        await startBackgroundTask(activeId);
      } else if (nextAppState === "active" && activeId) {
        console.log("[AppState] Masuk foreground: Memeriksa status BLE...");

        try {
          await stopBackgroundTask();
          const isConnected = await manager.isDeviceConnected(activeId);

          if (isConnected) {
            console.log("[AppState] Device masih aktif, mereconnect UI...");
            isIntentionalDisconnect.current = false;
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await connectToDevice(activeId, true);
          } else {
            console.log("[AppState] Device terputus. Resetting state UI.");
            isIntentionalDisconnect.current = false;
            clearSubscriptions();
            updateConnectedDeviceId(null);
            setConnectedDeviceName(null);
            setIsLoadingConnected(false);
          }
        } catch (error) {
          console.error("Gagal mengecek status/reconnect saat foreground:", error);
          updateConnectedDeviceId(null);
          setConnectedDeviceName(null);
          setIsLoadingConnected(false);
          setDevices([]);
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [connectToDevice, manager]);

  // Clean up BleManager saat unmount
  useEffect(() => {
    return () => {
      if (hrTimeoutRef.current) {
        clearTimeout(hrTimeoutRef.current);
      }
      clearSubscriptions();
      manager.destroy();
      setDevices([]);
    };
  }, [manager]);

  return (
    <BleContext.Provider
      value={{
        devices,
        isScanning,
        connectedDeviceId,
        isLoadingConnected,
        connectedDeviceName,
        requestPermissions,
        startScan,
        stopScan,
        connectToDevice,
        disconnectDevice,
      }}
    >
      {children}
    </BleContext.Provider>
  );
};
