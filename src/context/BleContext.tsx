import { Buffer } from "buffer";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device, Subscription } from "react-native-ble-plx";

// 1. Definisikan tipe untuk Context
interface BleContextType {
  devices: Device[];
  isScanning: boolean;
  connectedDeviceId: string | null;
  connectedDeviceName: string | null;
  requestPermissions: () => Promise<boolean>;
  startScan: () => Promise<void>;
  stopScan: () => void;
  connectToDevice: (device: Device, onHeartRateUpdate: (hr: number) => void) => Promise<void>;
  disconnectDevice: () => Promise<void>;
}

// 2. Buat Context
const BleContext = createContext<BleContextType | null>(null);

// 3. Buat Provider Component
export const BleProvider = ({ children }: { children: ReactNode }) => {
  // Gunakan useRef agar BleManager tidak dibuat ulang saat re-render
  const manager = useRef(new BleManager()).current;
  const subscriptions = useRef<Subscription[]>([]);

  // State yang akan langsung memicu perubahan UI (re-render)
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);

  console.log(connectedDeviceName, "connectedDeviceName");

  useEffect(() => {
    // Cleanup BleManager saat aplikasi ditutup
    return () => {
      manager.destroy();
    };
  }, [manager]);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]);
        return granted["android.permission.BLUETOOTH_SCAN"] === PermissionsAndroid.RESULTS.GRANTED && granted["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  };

  const startScan = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setDevices([]); // Reset daftar device setiap kali mulai scan baru
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

    // Auto-stop scan setelah 10 detik
    setTimeout(() => {
      stopScan();
    }, 10000);
  };

  const stopScan = () => {
    manager.stopDeviceScan();
    setIsScanning(false);
  };

  const connectToDevice = async (device: Device, onHeartRateUpdate: (hr: number) => void) => {
    stopScan();
    if (connectedDeviceId === device.id) return;

    try {
      const connectedDevice = await manager.connectToDevice(device.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();

      setConnectedDeviceName(connectedDevice.name);
      setConnectedDeviceId(connectedDevice.id);

      manager.onDeviceDisconnected(device.id, (error, disconnectedDevice) => {
        setConnectedDeviceId(null);
        setConnectedDeviceName(null);
        startScan();
      });

      const services = await connectedDevice.services();

      for (const service of services) {
        const characteristics = await connectedDevice.characteristicsForService(service.uuid);

        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable || characteristic.isIndicatable) {
            const subscription = connectedDevice.monitorCharacteristicForService(service.uuid, characteristic.uuid, (error, monitoredCharacteristic) => {
              if (error) {
                console.error("Failed to monitor characteristic:", error);
                return;
              }

              const value = monitoredCharacteristic?.value;
              if (!value) return;

              const buffer = Buffer.from(value, "base64");
              const bytes = Array.from(buffer);

              if (bytes.length > 1) {
                const sensorValue = bytes[1];
                onHeartRateUpdate(sensorValue);
              }
            });

            subscriptions.current.push(subscription);
          }
        }
      }
    } catch (error) {
      console.error("Failed to connect:", error);
      setConnectedDeviceId(null);
      setConnectedDeviceName(null);
      throw error;
    }
  };

  const disconnectDevice = async () => {
    // Bersihkan semua listener sensor
    subscriptions.current.forEach((sub) => sub.remove());
    subscriptions.current = [];

    if (connectedDeviceId) {
      try {
        await manager.cancelDeviceConnection(connectedDeviceId);
        console.log("Disconnected from device");
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

// 4. Custom Hook untuk mempermudah pemanggilan di komponen lain
export const useBle = () => {
  const context = useContext(BleContext);
  if (!context) {
    throw new Error("useBle must be used within a BleProvider");
  }
  return context;
};
