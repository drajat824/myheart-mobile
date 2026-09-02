import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, View } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: '#2b2b2b',
                    borderTopWidth: 0,
                    height: 80,
                    elevation: 0,
                    paddingTop: 15
                },
                tabBarActiveTintColor: 'white',
                tabBarInactiveTintColor: '#a0a0a0',
                tabBarButton: (props: any) => (
                    <Pressable {...props} android_ripple={{ color: 'transparent' }} />
                )
            }}
        >

            {/* REKAM MEDIS */}
            <Tabs.Screen
                name="records"
                options={{
                    title: 'Records',
                    tabBarButton: ({ onPress, children, ...props }: any) => {
                        const isFocused = props.focused ?? props['aria-selected'];
                        return (
                            <Pressable
                                {...props}
                                onPress={onPress}
                                android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true }}
                                className="flex-1 justify-center items-center active:bg-white active:opacity-60 rounded-full">
                                <SymbolView
                                    name={{ ios: 'text.book.closed', android: 'library_books' }}
                                    tintColor={isFocused ? '#ffffff' : '#888'}
                                    size={35}
                                />
                            </Pressable>
                        )
                    }
                }}
            />

            {/* DASHBOARD */}
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarButton: ({ onPress, children, ...props }: any) => {
                        const isFocused = props.focused ?? props['aria-selected'];
                        return (
                            <Pressable
                                {...props}
                                onPress={onPress}
                                android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true }}
                                className="flex-1 justify-center items-center -top-10">
                                <View className={`justify-center items-center w-[70px] h-[70px] rounded-full border-2 shadow-lg shadow-black/30 ${isFocused ? 'bg-white border-black' : 'bg-black border-white'}`}>
                                    <SymbolView
                                        name={{ ios: 'house', android: 'home' }}
                                        tintColor={isFocused ? 'black' : '#a0a0a0'}
                                        size={35}
                                    />
                                </View>
                            </Pressable>
                        );
                    },
                }}
            />

            {/* JADWAL OBAT */}
            <Tabs.Screen
                name="medicine"
                options={{
                    title: 'Medicine',
                    tabBarButton: ({ onPress, children, ...props }: any) => {
                        const isFocused = props.focused ?? props['aria-selected'];
                        return (
                            <Pressable
                                {...props}
                                onPress={onPress}
                                android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true }}
                                className="flex-1 justify-center items-center active:bg-white active:opacity-60 rounded-full">
                                <SymbolView
                                    name={{ ios: 'bell', android: 'notifications' }}
                                    tintColor={isFocused ? '#ffffff' : '#888'}
                                    size={35}
                                />
                            </Pressable>
                        )
                    }
                }}
            />
        </Tabs>
    );
}