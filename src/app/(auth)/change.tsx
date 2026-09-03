import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { TextInput } from "react-native-paper";
import { Button, CustomTextInput, Wrapper } from "../../component";

export default function Forgot() {
  const router = useRouter();

  return (
    <Wrapper>
      <View className="flex-1 justify-between">
        {/* FLEX 1: Header / Logo */}
        <View className="items-center justify-start">
          <MaterialDesignIcons name="account-circle" size={200} color="#333333" />
          <Text className="text-title text-2xl font-bold mt-2">LUPA KATA SANDI</Text>
        </View>

        {/* FLEX 2: Form Input */}
        <View className="justify-center gap-4 my-6">
          <View className="gap-2">
            <Text className="text-label">EMAIL</Text>
            <CustomTextInput placeholder="Masukan email.." />
          </View>

          <View className="gap-2">
            <Text className="text-label">KATA SANDI</Text>
            <CustomTextInput placeholder="Masukan kata sandi.." right={<TextInput.Icon icon="eye" />} />
          </View>

          <Pressable className="active:opacity-40 self-end" onPress={() => console.log("Lupa kata sandi pressed")}>
            <Text className="text-xl font-semibold text-right text-theme-green">Lupa kata sandi?</Text>
          </Pressable>
        </View>

        {/* FLEX 3: Action Buttons */}
        <View className="gap-3">
          <Button onPress={() => router.push("/dashboard")} mode="contained" buttonColor="#038175">
            MASUK
          </Button>
          <Button onPress={() => router.push("/register")} mode="outlined" buttonColor="transparent" textColor="#038175" borderColor="#038175">
            DAFTAR
          </Button>
        </View>
      </View>
    </Wrapper>
  );
}
