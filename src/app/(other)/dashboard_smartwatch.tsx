import { useBle, useModal } from "@/context";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { Device } from "react-native-ble-plx";
import { Button, Cards, Loading, Modal, RouterSub, WrapperMain } from "../../component";

export default function DashboardSmartwatch() {
  const { devices, isScanning, connectedDeviceId, startScan, stopScan, connectToDevice, disconnectDevice, isLoadingConnected } = useBle();
  const { openModal, closeModal } = useModal();

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

  const handleStartScan = async () => {
    try {
      await startScan();
    } catch (error) {
      console.error("[BLE Scan Error]:", error);
      openModal("bluetooth");
    }
  };

  const handleToggleScan = () => {
    if (isScanning) {
      stopScan();
    } else {
      handleStartScan();
    }
  };

  const handleConnect = async (device: Device) => {
    try {
      await connectToDevice(device);
    } catch (error) {
      console.error("[BLE Connect Error]:", error);
      openModal("bluetooth");
    }
  };

  useEffect(() => {
    if (!connectedDeviceId) {
      handleStartScan();
    }
    return () => {
      stopScan();
    };
  }, []);

  return (
    <WrapperMain>
      <View className="flex-1 flex-col justify-between">
        <RouterSub title="SMARTWATCH" />

        <View className="flex-1 flex-col gap-3 mt-4">
          <View className="flex flex-row justify-start items-center">
            <Pressable className="flex flex-row gap-2 items-center active:opacity-50" onPress={handleToggleScan}>
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

            {connectedDeviceId && (
              <Pressable className="ml-6 flex justify-center active:opacity-50" onPress={disconnectDevice}>
                <Text className="text-red-500 font-bold">DISCONNECT</Text>
              </Pressable>
            )}
          </View>

          <View className="flex-col gap-4">
            {devices?.map((device) => {
              const isConnected = connectedDeviceId === device.id;
              const connectable = isConnected || Boolean((device as any).isConnectable ?? true);
              const deviceDisplayName = device.name || device.localName || (isConnected ? "Smartwatch" : "Unknown Device");

              return (
                <Cards key={device.id} pressable={connectable} color={isConnected ? "#017BFE80" : "#fff"} onPress={() => handleConnect(device)} className="flex flex-row justify-between items-center">
                  <View className="gap-2">
                    <Text className="text-normal font-bold">{deviceDisplayName}</Text>
                    <Text className="text-normal font-light">{device.id}</Text>
                    <Text className="text-xs text-black">{isConnected ? "Connected" : connectable ? "Connectable" : "Not connectable"}</Text>
                  </View>
                  <MaterialDesignIcons name={connectable ? "bluetooth-connect" : "bluetooth-off"} size={36} color={connectable ? "#017BFE" : "#9CA3AF"} />
                </Cards>
              );
            })}
          </View>
        </View>
      </View>

      <Loading visible={isLoadingConnected} />

      <Modal id="bluetooth">
        <Cards className="mx-8">
          <View className="flex flex-col items-center gap-4 p-2">
            <MaterialDesignIcons name="bluetooth-off" size={60} color="#DB3546" />
            <Text className="text-2xl font-bold text-center">Bluetooth Tidak Aktif</Text>
            <Text className="text-base text-center text-gray-600">Pastikan Bluetooth dan Izin Lokasi/Bluetooth pada perangkat Anda sudah diaktifkan untuk memindai smartwatch.</Text>
            <Button buttonColor="#017BFE" onPress={() => closeModal("bluetooth")}>
              TUTUP
            </Button>
          </View>
        </Cards>
      </Modal>
    </WrapperMain>
  );
}
