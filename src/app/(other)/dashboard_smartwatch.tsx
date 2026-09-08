import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, PermissionsAndroid, Platform, Pressable, Text, View } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import { Cards, RouterSub, WrapperMain } from "../../component";

const bleManager = new BleManager();

export default function DashboardSmartwatch() {
  const [isBlePoweredOn, setIsBlePoweredOn] = useState(true);
  const onToggleSwitch = () => setIsBlePoweredOn(!isBlePoweredOn);

  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);

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

  return (
    <WrapperMain>
      <View className="flex-1 flex-col justify-between">
        {/* HEADER PAGES */}
        <RouterSub title="SMARTWATCH" />

        {/* FLEX 2: CARDS CONTENT  */}
        <View className="flex-1 flex-col gap-6 mt-4">
          <View className="flex flex-row justify-start">
            {/* <View className="flex flex-col gap-2 items-start">
              <Switch className="ml-[-10]" color="#017BFE" value={isBlePoweredOn} onValueChange={onToggleSwitch} />
              <Text className="text-label">BLUETOOTH AKTIF</Text>
            </View> */}
            <Pressable className="flex flex-row gap-2 items-center active:opacity-50" onPress={startScan}>
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
            <Cards pressable onPress={() => console.log("TES")} color="#017BFE80" className="flex flex-row justify-between items-center">
              <View className="gap-2">
                <Text className="text-normal font-bold">HUAWEI BAND 10</Text>
                <Text className="text-normal font-light">C4:16:88:88:F7:87</Text>
              </View>
              <MaterialDesignIcons name="checkbox-marked-circle-outline" size={45} color="#fff" />
            </Cards>
            <Cards pressable onPress={() => console.log("TES")} className="flex flex-row justify-between items-center">
              <View className="gap-2">
                <Text className="text-normal font-bold">HUAWEI BAND 11</Text>
                <Text className="text-normal font-light">C4:16:88:88:F7:87</Text>
              </View>
              <MaterialDesignIcons name="checkbox-marked-circle-outline" size={45} color="#fff" />
            </Cards>
            <Cards pressable onPress={() => console.log("TES")} className="flex flex-row justify-between items-center">
              <View className="gap-2">
                <Text className="text-normal font-bold">HUAWEI GT</Text>
                <Text className="text-normal font-light">C4:16:88:88:F7:87</Text>
              </View>
              <MaterialDesignIcons name="checkbox-marked-circle-outline" size={45} color="#fff" />
            </Cards>
          </View>
        </View>
      </View>
    </WrapperMain>
  );
}
