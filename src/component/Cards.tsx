import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

type CardsProps = PropsWithChildren<ViewProps & { className?: string; color?: string }>;

export default function Cards({ children, className = '', color = 'white', style, ...props }: CardsProps) {
	return (
		<View
			className={`px-8 py-8 rounded-2xl ${className} shadow-md`}
			style={[{ backgroundColor: color }, style]}
			{...props}
		>
			{children}
		</View>
	);
}
