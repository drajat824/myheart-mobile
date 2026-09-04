import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type WrapperProps = {
  children: React.ReactNode;
};

export default function WrapperMain({ children }: WrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <ScrollView
        className="flex-1 bg-theme-white px-8"
        overScrollMode="never"
        bounces={false}
        contentContainerStyle={{
          flexGrow: 1
        }}
      >
        {children}
      </ScrollView>
    </>
  );
}
