import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Switch } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Cards, CustomButton, Header, WrapperMain } from "../../component";

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  return (
    <WrapperMain>
      <View className="flex-col">
        {/* FLEX 1: HEADER PAGES */}
        <Header>
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-4xl font-light">
              Hallo, <Text className="font-semibold">John Doe</Text>
            </Text>
            <Pressable className="active:opacity-40" onPress={() => router.navigate("/dashboard_profile")}>
              <MaterialDesignIcons name="cog-outline" size={35} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text className="text-normal text-white font-light">john_doe@gmail.com</Text>
          <CustomButton onPress={() => router.navigate("/dashboard_smartwatch")} buttonColor="#DB3546" borderRadius={10}>
            <View className="flex flex-row items-center gap-2">
              <MaterialDesignIcons name="watch-import" size={40} color="#FFFFFF" />
              <Text className="text-3xl text-white font-normal">HUBUNGKAN{"\n"}SMARTWATCH</Text>
            </View>
          </CustomButton>
          <Text className="text-normal text-white font-light">
            DEVICE: <Text className="font-semibold">HUAWEI BAND 10</Text>
          </Text>
        </Header>

        {/* FLEX 2: CARDS CONTENT  */}
        <View className="flex flex-col gap-2 mt-4">
          {/* CARDS HR  */}
          <Cards className="flex flex-col gap-2">
            <Text className="text-label">HR SMARTWATCH</Text>

            {/* Info BPM  */}
            <View className="flex flex-row items-end justify-between">
              <Text className="text-8xl text-theme-green">
                91<Text className="text-normal font-normal text-black">bpm</Text>
              </Text>
              <Text className="text-4xl pb-[4] text-theme-green font-semibold">NORMAL</Text>
            </View>

            <View className="border border-gray-400 " />

            {/* Riwayat HR  */}
            <View className="flex flex-col gap-2">
              <Text className="text-normal font-normal">
                RIWAYAT GANGGUAN: <Text className="text-theme-red font-bold">3</Text> KALI
              </Text>

              {/* Data 1 */}
              <View className="flex-row items-center gap-2 justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-theme-red" />
                  <Text className="text-xl">26/08/2026</Text>
                </View>
                <Text className="text-xl">10:00 WIB</Text>
              </View>

              {/* Data 2 */}
              <View className="flex-row items-center gap-2 justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-theme-red" />
                  <Text className="text-xl">26/08/2026</Text>
                </View>
                <Text className="text-xl">10:00 WIB</Text>
              </View>

              {/* Data 3 */}
              <View className="flex-row items-center gap-2 justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-theme-red" />
                  <Text className="text-xl">26/08/2026</Text>
                </View>
                <Text className="text-xl">10:00 WIB</Text>
              </View>

              <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_hr")}>
                <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
              </Pressable>
            </View>
          </Cards>

          {/* CARDS 3D */}
          <View className="flex flex-col gap-4 mt-4">
            <Cards className="flex flex-col gap-2">
              <Text className="text-label">MODEL JANTUNG</Text>

              {/* CONTENT  */}
              <View className="flex flex-col">
                <View className="flex-1 justify-center items-center h-40">
                  <Text className="font-italic">GAMBAR JANTUNG 3D</Text>
                </View>
                <View className="flex-1 flex flex-row justify-between items-center">
                  <Text className="text-normal font-semibold">Rotasi Otomatis</Text>
                  <Switch color="#017BFE" value={isSwitchOn} onValueChange={onToggleSwitch} />
                </View>
              </View>
            </Cards>
          </View>
        </View>
      </View>
    </WrapperMain>
  );
}
