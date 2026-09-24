import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { TextInput } from "react-native-paper";
import { Button, Cards, CustomTextInput, Modal, WrapperAuth } from "../../component"; // Import Cards & Modal
import { useModal } from "../../context"; // Import context modal
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

      const response = (await apiService.post("/auth/login", {
        email,
        password,
        expo_push_token: pushToken,
      })) as {
        token?: string;
        user?: Record<string, any>;
      };

      if (response?.token) {
        await AsyncStorage.setItem("userToken", response.token);
        await AsyncStorage.setItem("userData", JSON.stringify(response.user ?? {}));
        router.replace("/dashboard");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      showAlert("Gagal Masuk", "Email atau kata sandi yang Anda masukkan salah.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WrapperAuth>
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
            {isLoading ? <ActivityIndicator color="#ffffff" /> : "MASUK"}
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
