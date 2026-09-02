import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Button, CustomTextInput, Wrapper } from '../../component';

export default function Register() {
  const router = useRouter();

  return (
    <Wrapper>
      <View className="flex-1 flex-col">

        {/* FLEX 1 */}
        <View className="flex-1 items-center justify-center">
          <MaterialDesignIcons name="account-circle" size={240} color="#333333" />
          <Text className="text-title">
            DAFTAR AKUN
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

          <View className="gap-2">
            <Text className="text-label">
              KETIK ULANG KATA SANDI
            </Text>
            <CustomTextInput placeholder='Masukan kata sandi..' right={<TextInput.Icon icon="eye" />} />
          </View>

        </View>

        {/* FLEX 3 */}
        <View className="flex-none items-left gap-4 h-[16%] justify-center">
          <Button onPress={() => console.log('Button pressed')} mode="contained" buttonColor="#038175">
            DAFTAR
          </Button>
          <Text className="text-label text-center items-center justify-center">
            Sudah punya akun?{' '}
            <Pressable className="active:opacity-40 pt-[7]" onPress={() => router.push('/login')}>
              <Text className="text-2xl text-theme-green font-bold">
                MASUK
              </Text>
            </Pressable>
          </Text>

        </View>

      </View>
    </Wrapper>
  );
}