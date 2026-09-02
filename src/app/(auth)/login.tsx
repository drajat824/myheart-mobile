import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Button, CustomTextInput, Wrapper } from '../../component';

export default function Login() {
  const router = useRouter();

  return (
    <Wrapper>
      <View className="flex-1 flex-col">

        {/* FLEX 1 */}
        <View className="flex-1 items-center justify-center">
          <MaterialDesignIcons name="account-circle" size={240} color="#333333" />
          <Text className="text-title">
            MASUK
          </Text>
        </View>

        {/* FLEX 2 */}
        <View className="flex-1 items-left justify-center gap-4">
          <View className="gap-2">
            <Text className="text-label">
              EMAIL
            </Text>
            <CustomTextInput placeholder='Masukan email..' />
          </View>
          <View className="gap-2">
            <Text className="text-label">
              KATA SANDI
            </Text>
            <CustomTextInput placeholder='Masukan kata sandi..' right={<TextInput.Icon icon="eye" />} />
          </View>

          <Pressable className="active:opacity-40 self-end" onPress={() => console.log('Lupa kata sandi pressed')}>
            <Text className="text-label text-right text-theme-green mt-[-5]">
              Lupa kata sandi?
            </Text>
          </Pressable>
        </View>

        {/* FLEX 3 */}
        <View className="flex-none items-left gap-4 justify-center h-[16%]">
          <Button onPress={() => router.push('/dashboard')} mode="contained" buttonColor="#038175">
            MASUK
          </Button>
          <Button onPress={() => router.push('/register')} mode="outlined" buttonColor="transparent" textColor="#038175" borderColor="#038175">
            DAFTAR
          </Button>
        </View>
      </View>
    </Wrapper>
  );
}