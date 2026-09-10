const { Stack } = require("expo-router");
import { BleProvider, HRProvider } from "@/context";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { Button, Cards, Modal } from "../component";
import { ModalProvider, useModal } from "../context";
import "./global.css";

function RootLayoutContent() {
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    // const timer1 = setTimeout(() => {
    //   openModal("root", true);
    // }, 5000);

    // const timer2 = setTimeout(() => {
    //   openModal("superRoot", true);
    // }, 10000);

    return () => {
      // clearTimeout(timer1);
      // clearTimeout(timer2);
    };
  }, [openModal]);

  return (
    <HRProvider>
      <BleProvider>
        <PaperProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(other)" options={{ headerShown: false }} />
          </Stack>

          {/* NOTIFIKASI OBAT - KONFORMASI ULANG */}
          <Modal id="superRoot">
            <View className="flex justify-center mx-8">
              <Cards>
                <View className="items-center">
                  <Text className="text-2xl font-bold">KONFIRMASI ULANG</Text>
                  <Text className="text-2xl font-normal">JADWAL OBAT SIANG</Text>
                </View>
                <View className="my-4 h-0 border-t border-gray-500" />
                <View className="flex flex-col gap-2">
                  <Text className="text-normal">Siang, 12:00 WIB</Text>
                  <Text className="text-normal">Setelah Makan</Text>
                  <View className="gap-2">
                    <Text className="text-normal">• ASPIRIN 81mg</Text>
                    <Text className="text-normal">• VITAMIN D3 600 IU</Text>
                    <Text className="text-normal">• PARACETAMOL 500mg</Text>
                  </View>
                </View>
                <View className="my-4 h-0 border-t border-gray-500" />
                <View className="flex flex-row justify-between gap-1">
                  <View className="flex-1">
                    <Button onPress={() => closeModal()}>SUDAH</Button>
                  </View>
                  <View className="flex-1">
                    <Button buttonColor="#DB3546" onPress={() => closeModal()}>
                      BELUM
                    </Button>
                  </View>
                </View>
              </Cards>
            </View>
          </Modal>

          {/* NOTIFIKASI OBAT */}
          <Modal id="root">
            <View className="flex justify-center mx-8">
              <Cards>
                <View className="items-center">
                  <Text className="text-2xl font-bold">JADWAL OBAT SIANG</Text>
                </View>
                <View className="my-4 h-0 border-t border-gray-500" />
                <View className="flex flex-col gap-2">
                  <Text className="text-normal">Siang, 12:00 WIB</Text>
                  <Text className="text-normal">Setelah Makan</Text>
                  <View className="gap-2">
                    <Text className="text-normal">• ASPIRIN 81mg</Text>
                    <Text className="text-normal">• VITAMIN D3 600 IU</Text>
                    <Text className="text-normal">• PARACETAMOL 500mg</Text>
                  </View>
                </View>
                <View className="my-4 h-0 border-t border-gray-500" />

                <View className="flex flex-col gap-3">
                  <Button onPress={() => closeModal()}>SUDAH</Button>
                  <Button onPress={() => closeModal()} mode="outlined" buttonColor="transparent" textColor="#DB3546" borderColor="#DB3546">
                    TUNDA 15 MENIT
                  </Button>
                </View>
              </Cards>
            </View>
          </Modal>
        </PaperProvider>
      </BleProvider>
    </HRProvider>
  );
}

export default function RootLayout() {
  return (
    <ModalProvider>
      <RootLayoutContent />
    </ModalProvider>
  );
}
