import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Cards, Header, WrapperMain } from "../../component";

export default function Medicine() {
  const router = useRouter();

  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  return (
    <WrapperMain>
      <View className="flex-col">
        {/* FLEX 1: HEADER PAGES */}
        <Header>
          <Text className="text-title text-white">JADWAL OBAT</Text>
          <Text className="text-normal text-white font-light">Periksa jadwal pembarian obat, pastikan tidak ada yang terlewat.</Text>
        </Header>

        {/* FLEX 2: CARDS CONTENT  */}
        <View className="flex flex-col gap-4">
          {/* Dates Picker */}
          <Pressable className="active:opacity-50" onPress={() => console.log("tes")}>
            <Cards className="flex flex-row mt-4 items-center py-[15] gap-4">
              <MaterialDesignIcons className="ml-[-2]" name="calendar-range" size={30} color="#DB3546" />
              <Text className="text-normal">25/08/2025</Text>
            </Cards>
          </Pressable>

          {/* CARDS OBAT - HARI INI */}
          <Cards className="flex flex-col gap-2">
            <Text className="text-normal font-bold">HARI INI</Text>
            <Text className="text-normal">Malam, 21:00 WIB - Setelah Makan</Text>
            <Text className="text-normal">Minggu, 23 Agustus 2026</Text>

            {/* DAFTAR OBAT */}
            <View className="flex-col gap-3 mt-2">
              <View className="flex-row items-center gap-4 border-1 p-2 rounded-xl">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="flex-row items-center gap-4 border-1 p-2 rounded-xl">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="flex-row items-center gap-4 border-1 p-2 rounded-xl">
                <View className="w-2 h-2 rounded-full bg-black" />
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
            <View className="flex-col gap-3 mt-2">
              <View className="flex-row items-center gap-4 border-1 p-2 rounded-xl bg-white">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="flex-row items-center gap-4 border-1 p-2 rounded-xl bg-white">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="flex-row items-center gap-4 border-1 p-2 rounded-xl bg-white">
                <View className="w-2 h-2 rounded-full bg-black" />
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
            <View className="flex-col gap-3 mt-2">
              <View className="flex-row items-center gap-4 border-1 p-2 rounded-xl bg-white">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="flex-row items-center gap-4 border-1 p-2 rounded-xl bg-white">
                <View className="w-2 h-2 rounded-full bg-black" />
                <Text className="text-xl">Paracetamol 500mg</Text>
              </View>
              <View className="flex-row items-center gap-4 border-1 p-2 rounded-xl bg-white">
                <View className="w-2 h-2 rounded-full bg-black" />
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
