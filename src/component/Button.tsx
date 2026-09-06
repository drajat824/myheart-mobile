import React from "react";
import { Button as PaperButton } from "react-native-paper";

type Props = React.ComponentProps<typeof PaperButton> & {
  label?: string;
  height?: number;
  fontSize?: number;
  borderColor?: string;
  children?: React.ReactNode;
  mode?: string;
  activeOpacity?: any;
};

const Button = ({ label = "", onPress, buttonColor = "#038175", height = 56, fontSize = 20, borderColor = "#038175", disabled = false, style, mode = "contained", children, ...props }: Props) => {
  const isOutlined = mode === "outlined";

  return (
    <PaperButton
      mode={mode}
      dark={true}
      buttonColor={isOutlined ? "transparent" : buttonColor}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={isOutlined ? 0.85 : undefined}
      rippleColor={isOutlined ? `${borderColor}26` : "rgba(0, 0, 0, 0.12)"}
      style={[
        {
          borderRadius: 10,
          borderColor,
          borderWidth: isOutlined ? 1 : 0,
        },
        style,
      ]}
      contentStyle={{
        height,
        justifyContent: "center",
        alignItems: "center",
        elevation: isOutlined ? 0 : 4,
      }}
      labelStyle={{
        fontSize,
        textAlign: "center",
      }}
      {...props}
    >
      {children || label}
    </PaperButton>
  );
};

export default Button;
