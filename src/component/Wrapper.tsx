import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type WrapperProps = {
  children: React.ReactNode;
};

export default function Wrapper({ children }: WrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <View className="bg-black" style={{ height: insets.top }} />
      <ScrollView
        className="flex-1 bg-theme-white px-8"
        overScrollMode="never"
        bounces={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 80,
        }}
      >
        {children}
      </ScrollView>
    </>
  );
}
