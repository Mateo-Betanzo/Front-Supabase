import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormMessageProps = {
  /** error = algo salió mal, success = la acción se completó */
  type: 'error' | 'success';
  message: string | null;
};

/** Aviso destacado debajo de un formulario. No muestra nada si no hay mensaje. */
export function FormMessage({ type, message }: FormMessageProps) {
  const theme = useTheme();
  if (!message) return null;

  const color = type === 'error' ? theme.danger : theme.accent;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.box, { borderColor: color, backgroundColor: theme.surface }]}>
      <AppText variant="small" color={type === 'error' ? 'danger' : 'text'}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
  },
});
