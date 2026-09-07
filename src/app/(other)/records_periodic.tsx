import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";

export default function RecordsPeriodic() {
  const router = useRouter();

  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        {/* HEADER PAGES */}
        <RouterSub title="REKAM MEDIS" subTitle="PEMERIKSAAN BERKALA" />

        <View className="flex flex-col gap-4 flex-1 mt-4">
          {/* Dates Picker */}
          <DatePicker onDateChange={(date) => console.log(date, "date")} onRangeChange={(prev, next) => console.log(prev, next, "range")} />

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
    </WrapperMain>
  );
}
