import { startBackgroundTask, stopBackgroundTask } from "@/utils/backgroundTask";
import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
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
  const connectedDeviceIdRef = useRef<string | null>(null);

  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingConnected, setIsLoadingConnected] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);

  // Sync state to ref to avoid stale closures in listeners
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

  const connectToDevice = useCallback(
    async (device: Device | string | null, isReconnect = false) => {
      if (!device) return;
      stopScan();

      const targetDeviceId = typeof device === "string" ? device : device.id;
      if (connectedDeviceIdRef.current === targetDeviceId && !isReconnect) return;

      if (!isLoadingConnected) setIsLoadingConnected(true);

      try {
        clearSubscriptions();
        setIsLoadingConnected(true);

        const connectedDevice = await manager.connectToDevice(targetDeviceId);
        await connectedDevice.discoverAllServicesAndCharacteristics();
        setConnectedDeviceName(connectedDevice.name);
        updateConnectedDeviceId(connectedDevice.id);

        // Remove old disconnect listener before setting a new one
        const disconnectSub = manager.onDeviceDisconnected(targetDeviceId, () => {
          if (isIntentionalDisconnect.current) {
            console.log("[BLE] Intentional disconnect for background operation.");
            return;
          }
          console.log("[BLE] Unexpected disconnect. Resetting connection state.");
          updateConnectedDeviceId(null);
          setConnectedDeviceName(null);
          setIsLoadingConnected(false);
        });

        subscriptions.current.push(disconnectSub);

        const services = await connectedDevice.services();

        for (const service of services) {
          const characteristics = await connectedDevice.characteristicsForService(service.uuid);

          for (const characteristic of characteristics) {
            if (characteristic.isNotifiable || characteristic.isIndicatable) {
              const sub = connectedDevice.monitorCharacteristicForService(service.uuid, characteristic.uuid, (error, monitoredCharacteristic) => {
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

              subscriptions.current.push(sub);
            }
          }
        }
      } catch (error) {
        console.error("Failed to connect:", error);
        setIsLoadingConnected(false);
        if (!isReconnect) {
          updateConnectedDeviceId(null);
          setConnectedDeviceName(null);
        }
        throw error;
      }
    },
    [dispatch, manager, stopScan],
  );

  const disconnectDevice = async () => {
    isIntentionalDisconnect.current = false;
    clearSubscriptions();

    if (connectedDeviceIdRef.current) {
      try {
        await manager.cancelDeviceConnection(connectedDeviceIdRef.current);
      } catch (error) {
        console.error("Disconnect Error:", error);
      }
      updateConnectedDeviceId(null);
      setConnectedDeviceName(null);
    }
  };

  // AppState management for seamless UI <-> Background handoff
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const activeId = connectedDeviceIdRef.current;

      if (nextAppState.match(/inactive|background/) && activeId) {
        console.log("[AppState] Background transition: Tearing down UI connection & starting service");
        isIntentionalDisconnect.current = true;
        clearSubscriptions();

        try {
          await manager.cancelDeviceConnection(activeId);
        } catch (error) {
          console.log("Cleanup UI connection info:", error);
        }

        await startBackgroundTask(activeId);
      } else if (nextAppState === "active" && activeId) {
        console.log("[AppState] Foreground transition: Checking BLE status...");

        try {
          await stopBackgroundTask();
          const isConnected = await manager.isDeviceConnected(activeId);

          if (isConnected) {
            console.log("[AppState] Device masih aktif, melakukan reconnect UI...");
            isIntentionalDisconnect.current = false;
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await connectToDevice(activeId, true);
          } else {
            console.log("[AppState] Device sudah tidak aktif/terputus. Resetting state UI.");
            isIntentionalDisconnect.current = false;
            clearSubscriptions();
            updateConnectedDeviceId(null);
            setConnectedDeviceName(null);
            setIsLoadingConnected(false);
          }
        } catch (error) {
          console.error("Gagal memeriksa status/reconnect saat foreground:", error);
          updateConnectedDeviceId(null);
          setConnectedDeviceName(null);
          setIsLoadingConnected(false);
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [connectToDevice, manager]);

  // Clean up BleManager on unmount
  useEffect(() => {
    return () => {
      clearSubscriptions();
      manager.destroy();
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
