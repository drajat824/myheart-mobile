import { useHR } from "@/context";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { Buffer } from "buffer";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, PermissionsAndroid, Platform, Pressable, Text, View } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { Cards, RouterSub, WrapperMain } from "../../component";

const bleManager = new BleManager();

export default function DashboardSmartwatch() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const subscriptions: any[] = [];
  const connectedDevice = useRef<string | null>(null);
  const [sensorValue, setSensorValue] = useState<number | null>(null);
  const { dispatch } = useHR();

  const refreshAnimation = useRef(new Animated.Value(0)).current;
  const AnimatedMaterialIcon = Animated.createAnimatedComponent(MaterialDesignIcons);

  useEffect(() => {
    if (!isScanning) {
      refreshAnimation.stopAnimation();
      refreshAnimation.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(refreshAnimation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => animation.stop();
  }, [isScanning, refreshAnimation]);

  const requestAndroidPermissions = async () => {
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

  const connectToDevice = async (device: Device) => {
    stopScan();
    if (device?.id == connectedDevice.current) return;

    try {
      await bleManager.connectToDevice(device.id);
      await device.discoverAllServicesAndCharacteristics();
      connectedDevice.current = device.id;
      console.log("Connected to device:", device.id);

      const services = await device.services();

      for (const service of services) {
        const characteristics = await device.characteristicsForService(service.uuid);

        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable || characteristic.isIndicatable) {
            const subscription = device.monitorCharacteristicForService(service.uuid, characteristic.uuid, (error, monitoredCharacteristic) => {
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
                dispatch({ type: "ADD_HR", payload: sensorValue });
              }
            });

            subscriptions.push(subscription);
          }
        }
      }

      return { device };
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const stopScan = async () => {
    bleManager.stopDeviceScan();
    setIsScanning(false);
  };

  const startScan = async () => {
    const hasPermission = await requestAndroidPermissions();
    if (!hasPermission) return;

    setDevices([]);
    setIsScanning(true);

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        setIsScanning(false);
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
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  useEffect(() => {
    return () => {
      stopScan();
      subscriptions.forEach((sub) => sub.remove());
      subscriptions.length = 0;

      // Disconnect device
      if (connectedDevice.current) {
        bleManager.cancelDeviceConnection(connectedDevice.current).catch(console.error);
        connectedDevice.current = null;
      }
    };
  }, []);

  return (
    <WrapperMain>
      <View className="flex-1 flex-col justify-between">
        {/* HEADER PAGES */}
        <RouterSub title="SMARTWATCH" />

        {/* FLEX 2: CARDS CONTENT  */}
        <View className="flex-1 flex-col gap-3 mt-4">
          <View className="flex flex-row justify-start">
            {/* <View className="flex flex-col gap-2 items-start">
              <Switch className="ml-[-10]" color="#017BFE" value={isBlePoweredOn} onValueChange={onToggleSwitch} />
              <Text className="text-label">BLUETOOTH AKTIF</Text>
            </View> */}
            <Pressable className="flex flex-row gap-2 items-center active:opacity-50" onPress={() => (isScanning ? stopScan() : startScan())}>
              <AnimatedMaterialIcon
                name="refresh"
                size={45}
                color="#017BFE"
                style={{
                  transform: [
                    {
                      rotate: refreshAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              />
              <Text className="text-normal text-theme-blue font-semibold">SCAN</Text>
            </Pressable>
          </View>

          {/* LIST DEVICES SMARTWATCH  */}
          <View className="flex-col gap-4">
            {devices?.map((device) => {
              const connectable = Boolean((device as any).isConnectable);
              const isConnected = connectedDevice.current === device.id;

              return (
                <Cards key={device.id} pressable={connectable} color={isConnected ? "#017BFE80" : "#fff"} onPress={() => connectToDevice(device)} className={`flex flex-row justify-between items-center`}>
                  <View className="gap-2">
                    <Text className="text-normal font-bold">{device.localName}</Text>
                    <Text className="text-normal font-light">{device.id}</Text>
                    <Text className="text-xs text-black">{connectable ? (isConnected ? "Connected" : "Connectable") : "Not connectable"}</Text>
                  </View>
                  <MaterialDesignIcons name={connectable ? "bluetooth-connect" : "bluetooth-off"} size={36} color={connectable ? "#017BFE" : "#9CA3AF"} />
                </Cards>
              );
            })}
          </View>
          {sensorValue !== null && (
            <View className="px-4 py-2 bg-white rounded-md">
              <Text className="text-normal">
                Detak Jantung: <Text className="font-bold">{sensorValue}</Text> BPM
              </Text>
            </View>
          )}
        </View>
      </View>
    </WrapperMain>
  );
}
