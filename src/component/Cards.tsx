import type { PropsWithChildren } from "react";
import { Pressable, View, type PressableProps, type ViewProps } from "react-native";

type CardsProps = PropsWithChildren<ViewProps & PressableProps & { className?: string; color?: string; pressable?: boolean }>;

export default function Cards({ children, className = "", color = "white", pressable = false, style, onPress, ...props }: CardsProps) {
  if (pressable) {
    return (
      <Pressable onPress={onPress} className={`px-8 py-8 rounded-2xl ${className} shadow-md active:opacity-50`} style={[{ backgroundColor: color }, style]} {...props}>
        {children}
      </Pressable>
    );
  } else {
    return (
      <View className={`px-8 py-8 rounded-2xl ${className} shadow-md`} style={[{ backgroundColor: color }, style]} {...props}>
        {children}
      </View>
    );
  }
}
