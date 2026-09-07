import { Text, View } from "react-native";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";

export default function RecordsHR() {
  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        {/* HEADER PAGES */}
        <RouterSub title="REKAM MEDIS" subTitle="RIWAYAT HEART RATE" />

        {/* FLEX 2: CARDS CONTENT  */}
        <View className="flex flex-col gap-4 flex-1 mt-4">
          {/* Dates Picker */}
          <DatePicker onDateChange={(date) => console.log(date, "date")} onRangeChange={(prev, next) => console.log(prev, next, "range")} />

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
