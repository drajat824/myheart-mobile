import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Cards, Wrapper } from '../../component';
// import { Button } from 'react-native-paper'

export default function Dashboard() {
  const router = useRouter();

  return (
    <Wrapper>
      <View className="flex-col">

        {/* FLEX 1: HEADER PAGES */}
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
          <Button style={{ borderRadius: 5 }} onPress={() => console.log('Button pressed')} mode="contained" buttonColor="#DB3546" height={100} fontSize={16}>
            <View className="flex flex-row items-center gap-2">
              <MaterialDesignIcons name="watch-import" size={55} color="#FFFFFF" />
              <Text className='text-4xl text-white font-normal'>HUBUNGKAN{'\n'}SMARTWATCH</Text>
            </View>
          </Button>
          <Text className="text-normal text-white font-light">
            DEVICE: <Text className='font-semibold'>HUAWEI BAND 10</Text>
          </Text>
        </View>

        {/* FLEX 2: CARDS CONTENT  */}
        <View className='flex flex-col gap-2 mt-4'>

          {/* CARDS HR  */}
          <Cards className='flex flex-col gap-2'>
            <Text className='text-label'>HR SMARTWATCH</Text>

            {/* Info BPM  */}
            <View className='flex flex-row items-end justify-between'>
              <Text className='text-8xl text-theme-green'>90<Text className='text-normal font-normal text-black'>bpm</Text></Text>
              <Text className='text-4xl pb-[4] text-theme-green font-semibold'>NORMAL</Text>
            </View>

            <View className="border border-gray-400 " />

            {/* Riwayat HR  */}
            <View className='flex flex-col gap-2'>
              <Text className='text-normal font-normal'>RIWAYAT GANGGUAN: <Text className='text-theme-red font-bold'>3</Text> KALI</Text>

              {/* Data 1 */}
              <View className='flex-row items-center gap-2 justify-between'>
                <View className='flex-row items-center gap-2'>
                  <View className='w-2 h-2 rounded-full bg-theme-red' />
                  <Text className='text-xl'>26/08/2026</Text>
                </View>
                <Text className='text-xl'>10:00 WIB</Text>
              </View>

              {/* Data 2 */}
              <View className='flex-row items-center gap-2 justify-between'>
                <View className='flex-row items-center gap-2'>
                  <View className='w-2 h-2 rounded-full bg-theme-red' />
                  <Text className='text-xl'>26/08/2026</Text>
                </View>
                <Text className='text-xl'>10:00 WIB</Text>
              </View>

              {/* Data 3 */}
              <View className='flex-row items-center gap-2 justify-between'>
                <View className='flex-row items-center gap-2'>
                  <View className='w-2 h-2 rounded-full bg-theme-red' />
                  <Text className='text-xl'>26/08/2026</Text>
                </View>
                <Text className='text-xl'>10:00 WIB</Text>
              </View>

              <Pressable className='flex flex-row items-center justify-end active:opacity-40 pt-2' onPress={() => router.push('/records')}>
                <Text className='text-theme-red text-xl'>Lihat Selengkapnya</Text>
                <MaterialDesignIcons className='ml-[-2]' name="chevron-right" size={30} color="#DB3546" />
              </Pressable>
            </View>
          </Cards>

          {/* CARDS 3D */}
          <View className='flex flex-col gap-4 mt-4'>
            <Cards className='flex flex-col gap-2'>
              <Text className='text-label'>HR SMARTWATCH</Text>

              {/* Info BPM  */}
              <View className='flex flex-row items-end justify-between'>
                <Text className='text-8xl text-theme-green'>90<Text className='text-normal font-normal text-black'>bpm</Text></Text>
                <Text className='text-4xl pb-[4] text-theme-green font-semibold'>NORMAL</Text>
              </View>

              <View className="border border-gray-400 " />

              {/* Riwayat HR  */}
              <View className='flex flex-col gap-2'>
                <Text className='text-normal font-normal'>RIWAYAT GANGGUAN: <Text className='text-theme-red font-bold'>3</Text> KALI</Text>

                {/* Data 1 */}
                <View className='flex-row items-center gap-2 justify-between'>
                  <View className='flex-row items-center gap-2'>
                    <View className='w-2 h-2 rounded-full bg-theme-red' />
                    <Text className='text-xl'>26/08/2026</Text>
                  </View>
                  <Text className='text-xl'>10:00 WIB</Text>
                </View>

                {/* Data 2 */}
                <View className='flex-row items-center gap-2 justify-between'>
                  <View className='flex-row items-center gap-2'>
                    <View className='w-2 h-2 rounded-full bg-theme-red' />
                    <Text className='text-xl'>26/08/2026</Text>
                  </View>
                  <Text className='text-xl'>10:00 WIB</Text>
                </View>

                {/* Data 3 */}
                <View className='flex-row items-center gap-2 justify-between'>
                  <View className='flex-row items-center gap-2'>
                    <View className='w-2 h-2 rounded-full bg-theme-red' />
                    <Text className='text-xl'>26/08/2026</Text>
                  </View>
                  <Text className='text-xl'>10:00 WIB</Text>
                </View>

                <Pressable className='flex flex-row items-center justify-end active:opacity-40 pt-2' onPress={() => router.push('/records')}>
                  <Text className='text-theme-red text-xl'>Lihat Selengkapnya</Text>
                  <MaterialDesignIcons className='ml-[-2]' name="chevron-right" size={30} color="#DB3546" />
                </Pressable>
              </View>
            </Cards>

          </View>
        </View>
      </View>
    </Wrapper>
  );
}