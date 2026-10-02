import { Text, type TextProps } from 'react-native';

import { Type, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppTextProps = TextProps & {
  variant?: keyof typeof Type;
  color?: keyof ThemeColors;
};

/** Texto con la tipografía y los colores de la app. */
export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return <Text style={[Type[variant], { color: theme[color] }, style]} {...rest} />;
}
