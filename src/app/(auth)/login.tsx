// login.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { TextInput } from "react-native-paper";
import { Button, Cards, CustomTextInput, Loading, Modal, WrapperAuth } from "../../component"; // <-- Tambahkan Loading di import component
import { useModal } from "../../context";
import { apiService } from "../../utils/apiService";

export default function Login() {
  const router = useRouter();
  const { openModal, closeModal } = useModal();

  const [email, setEmail] = useState("john@mail.com");
  const [password, setPassword] = useState("john123");
  const [showPassword, setShowPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // State khusus untuk isi Modal Error
  const [alertConfig, setAlertConfig] = useState({ title: "", message: "" });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    openModal("login-alert");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("Perhatian", "Email dan kata sandi wajib diisi!");
      return;
    }

    setIsLoading(true);
    try {
      let pushToken = null;
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === "granted") {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          pushToken = tokenData.data;
        } else {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          if (newStatus === "granted") {
            const tokenData = await Notifications.getExpoPushTokenAsync();
            pushToken = tokenData.data;
          }
        }
      } catch (tokenError) {
        console.warn("Gagal mendapatkan push token:", tokenError);
      }

      // Membuat Promise timeout 10 detik
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 10000));

      // Membungkus apiService.post dengan Promise.race untuk menerapkan timeout 10 detik
      const loginPromise = apiService.post("/auth/login", {
        email,
        password,
        expo_push_token: pushToken,
      });

      const response = (await Promise.race([loginPromise, timeoutPromise])) as {
        token?: string;
        user?: Record<string, any>;
      };

      if (response?.token) {
        await AsyncStorage.setItem("userToken", response.token);
        await AsyncStorage.setItem("userData", JSON.stringify(response.user ?? {}));
        router.replace("/(tabs)/dashboard"); // Mengarah ke dashboard setelah sukses login
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.message === "Request timeout") {
        showAlert("Waktu Habis", "Koneksi ke server terlalu lama. Silakan coba lagi.");
      } else {
        showAlert("Gagal Masuk", "Email atau kata sandi yang Anda masukkan salah.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WrapperAuth>
      {/* Komponen Loading dari component */}
      <Loading visible={isLoading} />

      <View className="flex-1 justify-between">
        <View className="flex-1 items-center justify-center">
          <MaterialDesignIcons name="account-circle" size={200} color="#333333" />
          <Text className="mt-2 text-2xl font-bold text-title">MASUK</Text>
        </View>

        <View className="my-6 flex-1 justify-start gap-4">
          <View className="gap-2">
            <Text className="text-label">EMAIL</Text>
            <CustomTextInput placeholder="Masukan email.." value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View className="gap-2">
            <Text className="text-label">KATA SANDI</Text>
            <CustomTextInput placeholder="Masukan kata sandi.." value={password} onChangeText={setPassword} secureTextEntry={!showPassword} right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />} />
          </View>
        </View>

        <View className="flex-none gap-3">
          <Button onPress={handleLogin} mode="contained" buttonColor="#038175" disabled={isLoading}>
            MASUK
          </Button>
        </View>
      </View>

      {/* MODAL NOTIFIKASI ERROR LOGIN */}
      <Modal id="login-alert">
        <View className="mx-8 flex justify-center">
          <Cards>
            <Text className="mb-2 text-xl font-bold text-red-600">{alertConfig.title}</Text>
            <Text className="mb-6 text-gray-700">{alertConfig.message}</Text>
            <Button onPress={() => closeModal("login-alert")} mode="contained" buttonColor="#038175">
              TUTUP
            </Button>
          </Cards>
        </View>
      </Modal>
    </WrapperAuth>
  );
}
