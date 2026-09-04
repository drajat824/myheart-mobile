import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Cards, RouterSub, WrapperMain } from "../../component";

export default function RecordsHR() {
  const router = useRouter();

  return (
    <WrapperMain>
      <View className="flex-col">
        {/* HEADER PAGES */}
                <RouterSub title="REKAM MEDIS" subTitle="RIWAYAT HEART RATE" />

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
          </Cards>

          {/* CARDS DATA LALU */}
          <Cards className="flex flex-col gap-2" color="#FFDD78">
            <Text className="text-normal font-bold">SELASA</Text>
            <Text className="text-normal text-gray-500">25 Agustus 2026</Text>

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
          </Cards>
        </View>
      </View>
    </WrapperMain>
  );
}
