import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';

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
            }}
        >
            {/* REKAM MEDIS */}
            <Tabs.Screen
                name="records"
                options={{
                    title: 'Records',
                    tabBarIcon: ({ color }) => (
                        <SymbolView
                            name={{ ios: 'text.book.closed', android: 'library_books' }}
                            tintColor={color}
                            size={35}
                        />
                    ),
                }}
            />

            {/* DASHBOARD */}
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ focused, color }) => (
                        <View
                            className={`justify-center items-center w-[70px] h-[70px] rounded-full border-2 -top-5 shadow-lg shadow-black/30 ${
                                focused ? 'bg-black border-white' : 'bg-white border-black'
                            }`}
                        >
                            <SymbolView
                                name={{ ios: 'house', android: 'home' }}
                                tintColor={focused ? 'white' : color}
                                size={35}
                            />
                        </View>
                    ),
                }}
            />

            {/* JADWAL OBAT */}
            <Tabs.Screen
                name="medicine"
                options={{
                    title: 'Medicine',
                    tabBarIcon: ({ color }) => (
                        <SymbolView
                            name={{ ios: 'bell', android: 'notifications' }}
                            tintColor={color}
                            size={35}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}