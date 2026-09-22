import { startBackgroundTask, stopBackgroundTask } from "@/utils/backgroundTask";
import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { BleManager, Device, State, Subscription } from "react-native-ble-plx";
import { useHR } from "../hr";
import { BleContextType } from "./ble.types";
import { requestBlePermissions } from "./blePermissions";
import { parseHeartRateValue } from "./bleUtils";

export const BleContext = createContext<BleContextType | null>(null);

// UUID Standard Heart Rate Service & Characteristic
const HEART_RATE_SERVICE_UUID = "180d";
const HEART_RATE_CHARACTERISTIC_UUID = "2a37";

export const BleProvider = ({ children }: { children: ReactNode }) => {
  const manager = useRef(new BleManager()).current;
  const { addHR } = useHR();

  // 1. STABILKAN addHR DENGAN REF
  const addHRRef = useRef(addHR);
  useEffect(() => {
    addHRRef.current = addHR;
  }, [addHR]);

  const subscriptions = useRef<Subscription[]>([]);
  const isIntentionalDisconnect = useRef(false);

  const connectedDeviceIdRef = useRef<string | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const hrTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingConnected, setIsLoadingConnected] = useState(false);

  const setConnectedDeviceState = (device: Device | null) => {
    setConnectedDevice(device);
    connectedDeviceIdRef.current = device ? device.id : null;
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

  // 2. BEBASKAN DEPENDENCY DARI addHR
  const resetHrTimeout = useCallback(() => {
    if (hrTimeoutRef.current) {
      clearTimeout(hrTimeoutRef.current);
    }
    hrTimeoutRef.current = setTimeout(() => {
      console.log("[BLE] Tidak ada data HR masuk selama 2.5 detik.");
      addHRRef.current(0);
    }, 2500);
  }, []);

  const startScan = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw new Error("Izin Bluetooth/Lokasi tidak diberikan");
    }

    const bleState = await manager.state();
    if (bleState !== State.PoweredOn) {
      setDevices([]);
      throw new Error("Bluetooth tidak aktif");
    }

    setDevices(connectedDevice ? [connectedDevice] : []);
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("BLE Scan Error:", error);
        stopScan();
        return;
      }

      if (device && (device.name || device.localName)) {
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

      const bleState = await manager.state();
      if (bleState !== State.PoweredOn) {
        throw new Error("Bluetooth tidak aktif");
      }

      stopScan();

      const targetDeviceId = typeof device === "string" ? device : device.id;
      if (connectedDeviceIdRef.current === targetDeviceId && !isReconnect) return;

      try {
        clearSubscriptions();
        setIsLoadingConnected(true);

        const connDevice = await manager.connectToDevice(targetDeviceId);
        await connDevice.discoverAllServicesAndCharacteristics();

        setConnectedDeviceState(connDevice);

        const disconnectSub = manager.onDeviceDisconnected(targetDeviceId, () => {
          if (isIntentionalDisconnect.current) {
            console.log("[BLE] Intentional disconnect untuk background operation.");
            return;
          }
          console.log("[BLE] Terputus secara tak terduga.");
          setConnectedDeviceState(null);
          setIsLoadingConnected(false);

          if (hrTimeoutRef.current) {
            clearTimeout(hrTimeoutRef.current);
          }
          addHRRef.current(0);
        });

        subscriptions.current.push(disconnectSub);

        // 3. HANYA SUBSCRIBE PADA CHARACTERISTIC HEART RATE (ATAU ABAIKAN NON-HR)
        const services = await connDevice.services();
        for (const service of services) {
          const characteristics = await connDevice.characteristicsForService(service.uuid);
          for (const characteristic of characteristics) {
            const isHrService = service.uuid.toLowerCase().includes(HEART_RATE_SERVICE_UUID);
            const isHrChar = characteristic.uuid.toLowerCase().includes(HEART_RATE_CHARACTERISTIC_UUID);

            // Filter hanya characteristic yang mendukung Notifiable / Indicatable
            if (characteristic.isNotifiable || characteristic.isIndicatable) {
              // Jika ini service/characteristic HR khusus atau fallback universal
              if (isHrService || isHrChar || services.length === 1) {
                const sub = connDevice.monitorCharacteristicForService(service.uuid, characteristic.uuid, (error, monitoredCharacteristic) => {
                  if (error || !monitoredCharacteristic?.value) {
                    return; // ⚠️ JANGAN panggil addHR(0) di sini agar tidak spamming error
                  }

                  const sensorValue = parseHeartRateValue(monitoredCharacteristic.value);
                  if (sensorValue !== null && sensorValue > 0) {
                    addHRRef.current(sensorValue);
                    resetHrTimeout();
                  }
                  // ⚠️ Hapus pemanggilan else { addHR(0) } dari characteristic non-HR!
                });
                subscriptions.current.push(sub);
              }
            }
          }
        }

        setIsLoadingConnected(false);
      } catch (error) {
        console.error("Gagal terhubung ke device:", error);
        setIsLoadingConnected(false);
        if (!isReconnect) {
          setConnectedDeviceState(null);
        }
        throw error;
      }
    },
    [manager, stopScan, resetHrTimeout], // ⚠️ addHR SUDAH DIHAPUS DARI DEPENDENCY ARRAY
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
      setConnectedDeviceState(null);
      addHRRef.current(0);
    }
  };

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const activeId = connectedDeviceIdRef.current;

      if (nextAppState.match(/inactive|background/) && activeId) {
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
        try {
          await stopBackgroundTask();
          const isConnected = await manager.isDeviceConnected(activeId);

          if (isConnected) {
            isIntentionalDisconnect.current = false;
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await connectToDevice(activeId, true);
          } else {
            isIntentionalDisconnect.current = false;
            clearSubscriptions();
            setConnectedDeviceState(null);
            setIsLoadingConnected(false);
          }
        } catch (error) {
          console.error("Gagal reconnect saat foreground:", error);
          setConnectedDeviceState(null);
          setIsLoadingConnected(false);
          setDevices([]);
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [connectToDevice, manager]);

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
        connectedDeviceId: connectedDevice?.id ?? null,
        connectedDeviceName: connectedDevice?.name || connectedDevice?.localName || null,
        isLoadingConnected,
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
