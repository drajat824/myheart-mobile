import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HeaderProps = {
  children?: React.ReactNode;
};

export default function Header({ children }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-none bg-theme-black h-fit px-8 pb-4 gap-2 -mx-8" style={{ paddingTop: insets.top + 30 }}>
      {children}
    </View>
  );
}
