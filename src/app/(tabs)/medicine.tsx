import { Text, View } from "react-native";
import { Button, Cards, Header, WrapperMain } from "../../component";
import DatePicker from "../../component/DatePicker";

export default function Medicine() {
  return (
    <WrapperMain>
      <View className="flex-col">
        {/* FLEX 1: HEADER PAGES */}
        <Header>
          <Text className="text-title text-white">JADWAL OBAT</Text>
          <Text className="text-normal font-light text-white">Periksa jadwal pembarian obat, pastikan tidak ada yang terlewat.</Text>
        </Header>

        {/* FLEX 2: CARDS CONTENT  */}
        <View className="mt-4 flex flex-col gap-4">
          <DatePicker onDateChange={(date) => console.log(date, "date")} onRangeChange={(prev, next) => console.log(prev, next, "range")} />

          {/* CARDS OBAT - HARI INI */}
          <Cards className="flex flex-col gap-2">
            <Text className="text-normal font-bold">HARI INI</Text>
            <Text className="text-normal">Malam, 21:00 WIB - Setelah Makan</Text>
            <Text className="text-normal">Minggu, 23 Agustus 2026</Text>

            {/* DAFTAR OBAT */}
            <View className="mt-2 flex-col gap-3">
              <View className="border-1 flex-row items-center gap-4 rounded-xl p-2">
                <View className="h-2 w-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="border-1 flex-row items-center gap-4 rounded-xl p-2">
                <View className="h-2 w-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="border-1 flex-row items-center gap-4 rounded-xl p-2">
                <View className="h-2 w-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
            </View>
          </Cards>

          {/* CARDS OBAT - LEWAT SUDAH */}
          <Cards className="flex flex-col gap-2" color="#38C172">
            <Text className="text-normal font-bold text-white">SUDAH MINUM</Text>
            <Text className="text-normal text-white">Malam, 21:00 WIB - Setelah Makan</Text>
            <Text className="text-normal text-white">Minggu, 23 Agustus 2026</Text>

            {/* DAFTAR OBAT */}
            <View className="mt-2 flex-col gap-3">
              <View className="border-1 flex-row items-center gap-4 rounded-xl bg-white p-2">
                <View className="h-2 w-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="border-1 flex-row items-center gap-4 rounded-xl bg-white p-2">
                <View className="h-2 w-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="border-1 flex-row items-center gap-4 rounded-xl bg-white p-2">
                <View className="h-2 w-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
            </View>
            <View className="flex flex-row items-center justify-between pt-5">
              <Text className="text-normal font-semibold text-white">UBAH STATUS</Text>
              <Button style={{ borderWidth: 1.5 }} buttonColor="#DB3546" borderColor="#ffff" onPress={() => console.log("Tes")}>
                <Text>BELUM</Text>
              </Button>
            </View>
          </Cards>

          {/* CARDS OBAT - LEWAT BELUM */}
          <Cards className="flex flex-col gap-2" color="#DB3546">
            <Text className="text-normal font-bold text-white">BELUM MINUM</Text>
            <Text className="text-normal text-white">Malam, 21:00 WIB - Setelah Makan</Text>
            <Text className="text-normal text-white">Minggu, 23 Agustus 2026</Text>

            {/* DAFTAR OBAT */}
            <View className="mt-2 flex-col gap-3">
              <View className="border-1 flex-row items-center gap-4 rounded-xl bg-white p-2">
                <View className="h-2 w-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="border-1 flex-row items-center gap-4 rounded-xl bg-white p-2">
                <View className="h-2 w-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="border-1 flex-row items-center gap-4 rounded-xl bg-white p-2">
                <View className="h-2 w-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
            </View>
            <View className="flex flex-row items-center justify-between pt-5">
              <Text className="text-normal font-semibold text-white">UBAH STATUS</Text>
              <Button style={{ borderWidth: 1.5 }} buttonColor="#38C172" borderColor="#ffff" onPress={() => console.log("Tes")}>
                <Text>SUDAH</Text>
              </Button>
            </View>
          </Cards>
        </View>
      </View>
    </WrapperMain>
  );
}
