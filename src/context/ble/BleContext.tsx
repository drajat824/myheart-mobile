import { startBackgroundTask, stopBackgroundTask } from "@/utils/backgroundTask";
import { createContext, ReactNode, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { BleManager, Device, Subscription } from "react-native-ble-plx";
import { useHR } from "../hr";
import { BleContextType } from "./ble.types";
import { requestBlePermissions } from "./blePermissions";
import { parseHeartRateValue } from "./bleUtils";

export const BleContext = createContext<BleContextType | null>(null);

export const BleProvider = ({ children }: { children: ReactNode }) => {
  const manager = useRef(new BleManager()).current;
  const { dispatch } = useHR();
  const subscriptions = useRef<Subscription[]>([]);
  const isIntentionalDisconnect = useRef(false);

  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingConnected, setIsLoadingConnected] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);

  const clearSubscriptions = () => {
    subscriptions.current.forEach((sub) => sub.remove());
    subscriptions.current = [];
  };

  useEffect(() => {
    const conditionApp = AppState.addEventListener("change", async (nextAppState) => {
      // 1. KETIKA MASUK BACKGROUND
      if (nextAppState.match(/inactive|background/) && connectedDeviceId !== null) {
        console.log("[AppState] → background: Melepas UI & Memulai Service");
        isIntentionalDisconnect.current = true;

        clearSubscriptions();
        try {
          await manager.cancelDeviceConnection(connectedDeviceId);
        } catch (error) {
          console.log("Cleanup UI connection error (diketahui):", error);
        }

        await startBackgroundTask(connectedDeviceId);
      }
      // 2. KETIKA KEMBALI KE FOREGROUND
      else if (nextAppState === "active" && connectedDeviceId !== null) {
        console.log("[AppState] → foreground: Mematikan Service & Reconnect UI");
        await stopBackgroundTask();
        setIsLoadingConnected(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          await connectToDevice(connectedDeviceId, true);
          console.log("Berhasil reconnect ke UI!");
        } catch (error) {
          console.error("Gagal reconnect ke UI saat foreground:", error);
        } finally {
          isIntentionalDisconnect.current = false;
        }
      }
    });

    return () => {
      conditionApp.remove();
    };
  }, [connectedDeviceId, manager]);

  useEffect(() => {
    return () => {
      manager.destroy();
    };
  }, [manager]);

  const requestPermissions = async (): Promise<boolean> => {
    return await requestBlePermissions();
  };

  const stopScan = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  const startScan = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

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

  const connectToDevice = async (device: Device | string | null, isReconnect = false) => {
    if (!isLoadingConnected) {
      setIsLoadingConnected(true);
    }

    if (!device) return;
    stopScan();
    const targetDeviceId = typeof device === "string" ? device : device.id;

    if (connectedDeviceId === targetDeviceId && !isReconnect) return;

    try {
      clearSubscriptions();

      const connectedDevice = await manager.connectToDevice(targetDeviceId);
      await connectedDevice.discoverAllServicesAndCharacteristics();

      setConnectedDeviceName(connectedDevice.name);
      setConnectedDeviceId(connectedDevice.id);

      manager.onDeviceDisconnected(targetDeviceId, () => {
        if (isIntentionalDisconnect.current) {
          console.log("[BLE] Disconnect sengaja untuk background. State ID dipertahankan.");
          return;
        }
        console.log("[BLE] Disconnect tak terduga. Resetting state.");
        setConnectedDeviceId(null);
        setConnectedDeviceName(null);
        startScan();
      });

      const services = await connectedDevice.services();

      for (const service of services) {
        const characteristics = await connectedDevice.characteristicsForService(service.uuid);

        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable || characteristic.isIndicatable) {
            const conditionApp = connectedDevice.monitorCharacteristicForService(service.uuid, characteristic.uuid, (error, monitoredCharacteristic) => {
              if (error) {
                console.error("Failed to monitor characteristic:", error);
                return;
              }

              const value = monitoredCharacteristic?.value;
              if (!value) return;

              const sensorValue = parseHeartRateValue(value);
              setIsLoadingConnected(false);
              if (sensorValue !== null) {
                dispatch({ type: "ADD_HR", payload: sensorValue });
              }
            });

            subscriptions.current.push(conditionApp);
          }
        }
      }
    } catch (error) {
      console.error("Failed to connect:", error);
      setIsLoadingConnected(false);
      setConnectedDeviceId(null);
      setConnectedDeviceName(null);
      throw error;
    }
  };

  const disconnectDevice = async () => {
    isIntentionalDisconnect.current = false; // Disconnect manual oleh user
    clearSubscriptions();

    if (connectedDeviceId) {
      try {
        await manager.cancelDeviceConnection(connectedDeviceId);
      } catch (error) {
        console.error("Disconnect Error:", error);
      }
      setConnectedDeviceId(null);
      setConnectedDeviceName(null);
    }
  };

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
