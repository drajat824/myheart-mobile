import React from 'react';
import { View } from 'react-native';

type WrapperProps = {
    children: React.ReactNode;
};

export default function Wrapper({ children }: WrapperProps) {
    return (
        <View className="flex-1 px-4 pb-20 bg-theme-white pt-[env(safe-area-inset-top)]">
            {children}
        </View>
    );
}