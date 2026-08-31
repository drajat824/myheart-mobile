import { SymbolView } from "expo-symbols";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  return (
    <SafeAreaView>
      <View className="h-full w-full flex-1 flex-col items-center justify-center bg-theme-black">

        {/* FLEX 1*/}
        <View>
          <SymbolView name={{ android: 'account_circle' }} size={180} tintColor="#000000" weight="regular" />
          <Text className="text-xl font-bold">MASUK</Text>
        </View>

        {/* FLEX 2 */}
        <View>

        </View>

      </View>
    </SafeAreaView>
  );
}
