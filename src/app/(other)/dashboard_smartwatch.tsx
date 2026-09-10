import { useBle } from "@/context/BleContext"; // Import custom hook-nya
import { useHR } from "@/context/HRContext";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { Device } from "react-native-ble-plx";
import { Cards, RouterSub, WrapperMain } from "../../component";

export default function DashboardSmartwatch() {
  const { dispatch } = useHR();

  const { devices, isScanning, connectedDeviceId, startScan, stopScan, connectToDevice, disconnectDevice } = useBle();

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

  const handleConnect = async (device: Device) => {
    try {
      await connectToDevice(device, (hrValue) => {
        dispatch({ type: "ADD_HR", payload: hrValue });
      });
    } catch (error) {
      console.log("Failed to connect");
    }
  };

  // CleanUp Scanning
  useEffect(() => {
    startScan();
    return () => {
      stopScan();
    };
  }, []);

  return (
    <WrapperMain>
      <View className="flex-1 flex-col justify-between">
        <RouterSub title="SMARTWATCH" />

        <View className="flex-1 flex-col gap-3 mt-4">
          <View className="flex flex-row justify-start">
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

            {/* Tombol Disconnect Muncul Jika Ada Device Konek */}
            {connectedDeviceId && (
              <Pressable className="ml-4 flex justify-center" onPress={disconnectDevice}>
                <Text className="text-red-500 font-bold">DISCONNECT</Text>
              </Pressable>
            )}
          </View>

          <View className="flex-col gap-4">
            {devices?.map((device) => {
              const connectable = Boolean((device as any).isConnectable);
              const isConnected = connectedDeviceId === device.id;

              return (
                <Cards key={device.id} pressable={connectable} color={isConnected ? "#017BFE80" : "#fff"} onPress={() => handleConnect(device)} className={`flex flex-row justify-between items-center`}>
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
        </View>
      </View>
    </WrapperMain>
  );
}
