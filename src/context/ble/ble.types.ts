import { Device } from "react-native-ble-plx";

export interface BleContextType {
  devices: Device[];
  isScanning: boolean;
  connectedDeviceId: string | null;
  connectedDeviceName: string | null;
  isLoadingConnected: boolean;
  requestPermissions: () => Promise<boolean>;
  startScan: () => Promise<void>;
  stopScan: () => void;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectDevice: () => Promise<void>;
}
