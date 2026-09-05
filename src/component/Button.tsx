import React from "react";
import { Button as PaperButton } from "react-native-paper";

type Props = React.ComponentProps<typeof PaperButton> & {
  label?: string;
  height?: number;
  fontSize?: number;
  borderColor?: string;
  children?: React.ReactNode;
};

const Button = ({ label = "", onPress, buttonColor = "#038175", height = 56, fontSize = 20, borderColor = "#038175", disabled = false, style, children, ...props }: Props) => {
  return (
    <PaperButton
      mode="contained"
      dark={true}
      buttonColor={buttonColor}
      onPress={onPress}
      disabled={disabled}
      rippleColor="rgba(0, 0, 0, 0.12)"
      style={[
        {
          borderRadius: 10,
          borderColor,
        },
        style,
      ]}
      contentStyle={{
        height,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
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
