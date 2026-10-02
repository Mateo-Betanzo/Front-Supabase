import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListRowProps = {
  title: string;
  /** texto secundario a la derecha (por ejemplo, "Pendiente") */
  detail?: string;
  /** botones a la derecha (por ejemplo, Aceptar / Rechazar) */
  actions?: ReactNode;
  /** si se pasa, toda la fila se puede tocar */
  onPress?: () => void;
};

/** Fila de una lista: contactos y solicitudes. */
export function ListRow({ title, detail, actions, onPress }: ListRowProps) {
  const theme = useTheme();

  const content = (
    <>
      <AppText variant="heading" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      {detail ? (
        <AppText variant="small" color="textMuted">
          {detail}
        </AppText>
      ) : null}
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </>
  );

  const rowStyle = [styles.row, { borderBottomColor: theme.border }];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [rowStyle, pressed && { backgroundColor: theme.surface }]}>
        {content}
      </Pressable>
    );
  }
  return <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    minHeight: TouchTarget + Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
});
