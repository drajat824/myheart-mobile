import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Header from './Headers';

type RouterSubProps = {
    title: string;
    subTitle?: string;
};

/** Reusable header for router sub-pages. */
export default function RouterSub({ title, subTitle }: RouterSubProps) {
    const router = useRouter();

    return (
        <Header>
            <View className={`flex flex-row ${subTitle ? 'items-start' : 'items-center'} gap-2`}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={() => router.back()}
                    className="active:opacity-50">
                    <MaterialDesignIcons name="arrow-left" size={40} color="#fff" />
                </Pressable>
                <View className={subTitle && 'pt-1'}>
                    <Text className="text-header-router text-white">{title}</Text>
                    {subTitle && <Text className="text-header-router-sub">{subTitle}</Text>}
                </View>
            </View>
        </Header>
    );
}