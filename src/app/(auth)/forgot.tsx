import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Button, CustomTextInput, Wrapper } from "../../component";

export default function Forgot() {
  const router = useRouter();

  return (
    <Wrapper>
      <View className="flex-1 justify-between">
        {/* FLEX 1: Header / Logo */}
        <View className="items-center justify-center flex-1">
          <MaterialDesignIcons name="account-circle" size={200} color="#333333" />
          <Text className="text-title text-2xl font-bold mt-2">LUPA KATA SANDI</Text>
        </View>

        {/* FLEX 2: Form Input */}
        <View className="flex-1 flex-col justify-start my-12 flex-1">
          <View className="gap-2">
            <Text className="text-label">EMAIL</Text>
            <CustomTextInput placeholder="Masukan email.." />
          </View>
        </View>

        {/* FLEX 3: Action Buttons */}
        <View className="flex flex-col gap-3 items-center w-full flex-1 justify-end">
          <Button onPress={() => console.log("TES")} mode="contained" buttonColor="#038175" style={{ width: "100%" }}>
            KIRIM
          </Button>
          <Pressable className="active:opacity-40" onPress={() => router.push("/login")}>
            <Text className="text-2xl text-theme-green font-bold">KEMBALI MASUK</Text>
          </Pressable>
        </View>
      </View>
    </Wrapper>
  );
}
