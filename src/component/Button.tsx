import React from 'react';
import { Button as PaperButton } from 'react-native-paper';

type Props = React.ComponentProps<typeof PaperButton> & {
    label?: string;
    height?: number;
    fontSize?: number;
    borderColor?: string;
};

const Button = ({
    label = '',
    onPress,
    buttonColor = '#038175',
    height = 56,
    fontSize = 20,
    borderColor = '#038175',
    disabled = false,
    style,
    ...props
}: Props) => {
    return (
        <PaperButton
            mode="contained"
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
                justifyContent: 'center',
                alignItems: 'center',
            }}
            labelStyle={{
                fontSize,
                textAlign: 'center',
            }}
            {...props}
        >
            {props.children || label}
        </PaperButton>
    );
};

export default Button;