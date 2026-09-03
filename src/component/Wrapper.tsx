import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type WrapperProps = {
  children: React.ReactNode;
};

export default function Wrapper({ children }: WrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-theme-white px-8"
      contentContainerStyle={{
        flexGrow: 1,
        // paddingHorizontal: 32,
        paddingTop: insets.top,
        paddingBottom: 80,
      }}
    >
      {children}
    </ScrollView>
  );
}
