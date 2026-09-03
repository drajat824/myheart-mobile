import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Cards, Wrapper } from "../../component";

export default function RecordsPeriodic() {
  const router = useRouter();

  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  return (
    <Wrapper>
      <View className="flex-col">
        {/* FLEX 1: HEADER PAGES */}
        <View className="flex-none flex flex-row bg-theme-black h-fit w-screen -mx-8 p-8 gap-4">
          <Pressable onPress={() => router.back()} className="active:opacity-50">
            <MaterialDesignIcons name="arrow-left" size={45} color="#fff" />
          </Pressable>
          <View className="flex-col gap-2 pt-1">
            <Text className="text-title text-white">REKAM MEDIS</Text>
            <Text className="text-2xl font-bold text-white">PEMERIKSAAN BERKALA</Text>
          </View>
        </View>

        {/* FLEX 2: CARDS CONTENT  */}
        <View className="flex flex-col gap-4">
          {/* Dates Picker */}
          <Pressable className="active:opacity-50" onPress={() => console.log("tes")}>
            <Cards className="flex flex-row mt-4 items-center py-[15] gap-4">
              <MaterialDesignIcons className="ml-[-2]" name="calendar-range" size={30} color="#DB3546" />
              <Text className="text-normal">25/08/2025</Text>
            </Cards>
          </Pressable>
          {/* CARDS DATA */}
          <Cards className="flex flex-col gap-2">
            <Text className="text-normal font-bold">HARI INI</Text>
            <Text className="text-normal text-gray-500">25 Agustus 2026</Text>

            {/* DAFTAR PEMERIKSAAN */}
            <View className="flex-col gap-3 mt-2">
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Berat/Tinggi Badan:</Text>
                <Text className="text-xl font-semibold">89 kg/170 cm</Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Kolestrol:</Text>
                <Text className="text-xl font-semibold">200 mg/dL</Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Gula Darah:</Text>
                <Text className="text-xl font-semibold">100 mg/dL</Text>
              </View>
            </View>
          </Cards>

          {/* DATA LALU */}
          <Cards className="flex flex-col gap-2" color="#FFDD78">
            <Text className="text-normal font-bold">SELASA</Text>
            <Text className="text-normal text-gray-500">25 Agustus 2026</Text>

            {/* DAFTAR PEMERIKSAAN */}
            <View className="flex-col gap-3 mt-2">
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Berat/Tinggi Badan:</Text>
                <Text className="text-xl font-semibold">89 kg/170 cm</Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Kolestrol:</Text>
                <Text className="text-xl font-semibold">200 mg/dL</Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Gula Darah:</Text>
                <Text className="text-xl font-semibold">100 mg/dL</Text>
              </View>
            </View>
          </Cards>

          {/* DATA LALU */}
          <Cards className="flex flex-col gap-2" color="#FFDD78">
            <Text className="text-normal font-bold">RABU</Text>
            <Text className="text-normal text-gray-500">25 Agustus 2026</Text>

            {/* DAFTAR PEMERIKSAAN */}
            <View className="flex-col gap-3 mt-2">
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Berat/Tinggi Badan:</Text>
                <Text className="text-xl font-semibold">89 kg/170 cm</Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Kolestrol:</Text>
                <Text className="text-xl font-semibold">200 mg/dL</Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Gula Darah:</Text>
                <Text className="text-xl font-semibold">100 mg/dL</Text>
              </View>
            </View>
          </Cards>
        </View>
      </View>
    </Wrapper>
  );
}
