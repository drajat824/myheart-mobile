import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { TextInput } from "react-native-paper";
import { Button, CustomTextInput, RouterSub, WrapperMain } from "../../component";

export default function DashboardProfile() {
  const router = useRouter();

  return (
    <WrapperMain>
      <View className="flex-1 flex-col justify-between ">
        {/* HEADER PAGES */}
        <RouterSub title="PROFILE" />

        {/* FLEX 2: CARDS CONTENT  */}
        <View className="flex-1 flex-col justify-between">
          <View className="flex flex-col gap-4 mt-6">
            <View className="flex-1 items-left justify-center gap-4">
              <View className="gap-2">
                <Text className="text-label">NAMA</Text>
                <CustomTextInput placeholder="Masukan nama.." />
              </View>
              <View className="gap-2">
                <Text className="text-label">EMAIL</Text>
                <CustomTextInput placeholder="Masukan email.." />
              </View>
              <Button style={{ alignSelf: "flex-end" }} buttonColor="#017BFE" onPress={() => console.log("TES")}>
                <Text>VERIFIKASI EMAIL</Text>
              </Button>

              <View className="gap-2">
                <Text className="text-label">KATA SANDI</Text>
                <CustomTextInput placeholder="Masukan kata sandi.." right={<TextInput.Icon icon="eye" />} />
              </View>
              <View className="gap-2">
                <Text className="text-label">KETIK ULANG KATA SANDI</Text>
                <CustomTextInput placeholder="Masukan kata sandi.." right={<TextInput.Icon icon="eye" />} />
              </View>
            </View>
          </View>

          {/* FLEX 3 */}
          <View className="flex-none gap-2 pt-4 justify-end">
            <Button onPress={() => console.log("Button pressed")} mode="contained" buttonColor="#038175">
              UBAH
            </Button>
          </View>
        </View>
      </View>
    </WrapperMain>
  );
}
