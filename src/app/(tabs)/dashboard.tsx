import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Wrapper } from '../../component';
// import { Button } from 'react-native-paper'

export default function Dashboard() {
  const router = useRouter();

  return (
    <Wrapper>
      <View className="flex-1 flex-col">

        <View className="flex-none justify-center bg-theme-black h-fit w-screen -mx-8 p-8 gap-2">

          <View className="flex-row items-center justify-between">
            <Text className="text-white text-4xl font-light">
              Hallo, <Text className="font-semibold">John Doe</Text>
            </Text>
            <Pressable className="active:opacity-40" onPress={() => console.log('Settings pressed')}>
              <MaterialDesignIcons name="cog-outline" size={35} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text className="text-normal text-white font-light">
            john_doe@gmail.com
          </Text>
          <Button style={{ borderRadius: 5 }} onPress={() => console.log('Button pressed')} mode="contained" buttonColor="#017BFE" height={100} fontSize={16}>
            <View className="flex-row items-center w-[100%] gap-2 justify-center">
              <MaterialDesignIcons name="watch-import" size={55} color="#FFFFFF" />
              <Text className='text-title-sub text-white font-medium'>SMARTWATCH{'\n'}TERHUBUNG</Text>
            </View>
          </Button>
          <Text className="text-normal text-white font-light">
            DEVICE: <Text className='font-semibold'>HUAWEI BAND 10</Text>
          </Text>
        </View>

      </View>
    </Wrapper>
  );
}