import { BleProvider, HRProvider } from "@/context";
import { Stack } from "expo-router";
import { Text, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { Cards, Modal } from "../component";
import { ModalProvider, useModal } from "../context";
import "./global.css";

function RootLayoutContent() {
  const { closeModal } = useModal();

  return (
    <HRProvider>
      <BleProvider>
        {/* Navigasi Utama */}
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(other)" options={{ headerShown: false }} />
        </Stack>

        {/* Modal Global (Otomatis Melayang di Atas Seluruh Page) */}
        <Modal id="superRoot">
          <View className="flex justify-center mx-8">
            <Cards>
              <View className="items-center">
                <Text className="text-2xl font-bold">KONFIRMASI ULANG</Text>
                <Text className="text-2xl font-normal">JADWAL OBAT SIANG</Text>
              </View>
              {/* ... isi modal ... */}
            </Cards>
          </View>
        </Modal>

        <Modal id="root">
          <View className="flex justify-center mx-8">
            <Cards>
              <View className="items-center">
                <Text className="text-2xl font-bold">JADWAL OBAT SIANG</Text>
              </View>
              {/* ... isi modal ... */}
            </Cards>
          </View>
        </Modal>
      </BleProvider>
    </HRProvider>
  );
}

export default function RootLayout() {
  return (
    <ModalProvider>
      <PaperProvider>
        <RootLayoutContent />
      </PaperProvider>
    </ModalProvider>
  );
}
