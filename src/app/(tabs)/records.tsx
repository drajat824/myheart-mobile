import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Cards, Wrapper } from "../../component";

export default function Records() {
  const router = useRouter();

  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  return (
    <Wrapper>
      <View className="flex-col">
        {/* FLEX 1: HEADER PAGES */}
        <View className="flex-none justify-center bg-theme-black h-fit w-screen -mx-8 p-8  gap-2">
          <Text className="text-title text-white">REKAM MEDIS</Text>
          <Text className="text-normal text-white font-light">Riwayat pemeriksaan, grafik detak jantung, dan riwayat kesehatan harian.</Text>
        </View>

        {/* FLEX 2: CARDS CONTENT  */}
        <View className="flex flex-col gap-4 mt-4">
          {/* CARDS PEMERIKSAAN */}
          <Cards className="flex flex-col gap-2">
            <Text className="text-normal font-bold">PEMERIKSAAN BERKALA</Text>
            <Text className="text-normal text-gray-500">Rabu, 25 Agustus 2026</Text>

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

            <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_periodic")}>
              <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
              <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
            </Pressable>
          </Cards>
          {/* CARDS RIWAYAT GANGGUAN */}
          <Cards className="flex flex-col gap-2">
            <Text className="text-normal font-bold">RIWAYAT GANGGUAN JANTUNG</Text>
            <Text className="text-normal text-gray-500">Rabu, 25 Agustus 2026</Text>

            {/* DAFTAR GANGGUAN */}
            <View className="flex-col gap-3 mt-2">
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Takikardia:</Text>
                <Text className="text-xl font-semibold">08:00 WIB</Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Baradikardia:</Text>
                <Text className="text-xl font-semibold">10:00 WIB</Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Aritmia:</Text>
                <Text className="text-xl font-semibold">14:00 WIB</Text>
              </View>
            </View>

            <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_disorder")}>
              <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
              <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
            </Pressable>
          </Cards>
          {/* CARDS RIWAYAT HR */}
          <Cards className="flex flex-col gap-2">
            <Text className="text-normal font-bold">RIWAYAT HEART-RATE</Text>
            <Text className="text-normal text-gray-500">Rabu, 25 Agustus 2026</Text>

            {/* DAFTAR HR */}
            <View className="flex-col gap-3 mt-2">
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">08:00 WIB:</Text>
                <Text className="text-xl font-semibold">100 BPM</Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">10:00 WIB:</Text>
                <Text className="text-xl font-semibold">120 BPM</Text>
              </View>
              <View className="flex-row items-center gap-4">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">17:00 WIB:</Text>
                <Text className="text-xl font-semibold">89 BPM</Text>
              </View>
            </View>

            <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_hr")}>
              <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
              <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
            </Pressable>
          </Cards>
        </View>
      </View>
    </Wrapper>
  );
}
