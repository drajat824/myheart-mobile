import { Text, View } from "react-native";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";

export default function RecordsDisorder() {
  // const { openModal, closeModal } = useModal();

  // useEffect(() => {
  //   const timer1 = setTimeout(() => {
  //     openModal("root", true);
  //   }, 3000);

  //   return () => {
  //     clearTimeout(timer1);
  //   };
  // }, [openModal]);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        {/* HEADER PAGES */}
        <RouterSub title="REKAM MEDIS" subTitle="RIWAYAT GANGGUAN" />

        {/* FLEX 2: CARDS CONTENT  */}
        <View className="flex flex-col gap-4 flex-1 mt-4">
          {/* Dates Picker */}
          <DatePicker onDateChange={(date) => console.log(date, "date")} onRangeChange={(prev, next) => console.log(prev, next, "range")} />

          {/* CARDS DATA */}
          <Cards className="flex flex-col gap-2">
            <Text className="text-normal font-bold">HARI INI</Text>
            <Text className="text-normal text-gray-500">25 Agustus 2026</Text>

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
          </Cards>

          {/* CARDS DATA LALU */}
          <Cards className="flex flex-col gap-2" color="#FFDD78">
            <Text className="text-normal font-bold">SELASA</Text>
            <Text className="text-normal text-gray-500">25 Agustus 2026</Text>

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
          </Cards>
        </View>
      </View>
    </WrapperMain>
  );
}
