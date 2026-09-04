import React from "react";
import { Pressable, StyleSheet } from "react-native";

type Props = React.ComponentProps<typeof Pressable> & {
  label?: string;
  height?: number;
  buttonColor?: string;
  fontSize?: number;
  borderRadius?: number;
  borderColor?: string;
  children?: React.ReactNode;
};

const CustomButton = ({
  label = "",
  onPress,
  buttonColor,
  borderRadius = 10,
  borderColor = "#038175",
  disabled = false,
  children,
  ...props
}: Props) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: "rgba(0, 0, 0, 0.12)" }}
      className="py-4"
      style={[
        styles.button,
        { borderColor, borderRadius, backgroundColor: buttonColor }
      ]}
      {...props}>
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});

export default CustomButton;
