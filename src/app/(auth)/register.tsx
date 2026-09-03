import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { TextInput } from "react-native-paper";
import { Button, CustomTextInput, Wrapper } from "../../component";

export default function Register() {
  const router = useRouter();

  return (
    <Wrapper>
      <View className="flex-1 justify-between">
        {/* FLEX 1 */}
        <View className="items-center justify-center flex-1">
          <MaterialDesignIcons name="account-circle" size={200} color="#333333" />
          <Text className="text-title text-2xl font-bold mt-2">DAFTAR AKUN</Text>
        </View>

        {/* FLEX 2 */}
        <View className="flex-1 items-left justify-center gap-4 flex-1">
          <View className="gap-2">
            <Text className="text-label">EMAIL</Text>
            <CustomTextInput placeholder="Masukan email.." />
          </View>
          <View className="gap-2">
            <Text className="text-label">KATA SANDI</Text>
            <CustomTextInput placeholder="Masukan kata sandi.." right={<TextInput.Icon icon="eye" />} />
          </View>

          <View className="gap-2">
            <Text className="text-label">KETIK ULANG KATA SANDI</Text>
            <CustomTextInput placeholder="Masukan kata sandi.." right={<TextInput.Icon icon="eye" />} />
          </View>
        </View>

        {/* FLEX 3 */}
        <View className="flex-none gap-2 pt-4 justify-center flex-none">
          <Button onPress={() => console.log("Button pressed")} mode="contained" buttonColor="#038175">
            DAFTAR
          </Button>
          <View className="flex flex-row gap-2 justify-center items-center">
            <Text className="text-label">Sudah punya akun?</Text>
            <Pressable className="active:opacity-40" onPress={() => router.push("/login")}>
              <Text className="text-2xl text-theme-green font-bold">MASUK</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Wrapper>
  );
}
