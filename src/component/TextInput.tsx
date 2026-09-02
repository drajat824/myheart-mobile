import React from 'react';
import { TextInput } from 'react-native-paper';

type Props = React.ComponentProps<typeof TextInput>;

const CustomTextInput = ({
  style,
  outlineStyle,
  contentStyle,
  
  cursorColor = 'rgba(0, 0, 0, 0.5)',
  underlineColor = 'rgba(0, 0, 0, 0.5)',
  activeUnderlineColor = 'rgba(0, 0, 0, 0.5)',
  selectionColor = 'rgba(0, 0, 0, 0.5)',

  ...props
}: Props) => {
  return (
    <TextInput
      mode="outlined"
      defaultValue=""
      textColor="#000"
      placeholderTextColor="#666"
      cursorColor={cursorColor}
      underlineColor={underlineColor}
      activeUnderlineColor={activeUnderlineColor}
      selectionColor={selectionColor}
      style={[{ height: 60, backgroundColor: '#fff', borderRadius: 5 }, style]}
      outlineStyle={[{ borderWidth: 1, borderColor: 'grey', borderRadius: 5 }, outlineStyle]}
      contentStyle={[{ fontSize: 16 }, contentStyle]}
      {...props}
    />
  );
};

export default CustomTextInput;