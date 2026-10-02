import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { MonoFont, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatFriendCode } from '@/lib/validation';

/** Tarjeta con mi código de amigo y un botón para copiarlo. */
export function FriendCodeCard({ code }: { code: string }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const formatted = formatFriendCode(code);

  // El botón vuelve a decir "Copiar" a los 2 segundos.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    await Clipboard.setStringAsync(formatted);
    setCopied(true);
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      <AppText variant="small" color="textMuted">
        Tu código
      </AppText>
      <View style={styles.row}>
        <AppText
          selectable
          style={[styles.code, { color: theme.text }]}
          accessibilityLabel={`Tu código: ${code.split('').join(' ')}`}>
          {formatted}
        </AppText>
        <Button
          title={copied ? 'Copiado' : 'Copiar'}
          variant={copied ? 'secondary' : 'primary'}
          onPress={handleCopy}
        />
      </View>
      <AppText variant="small" color="textMuted">
        Compártelo para que otras personas te envíen una solicitud.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  code: {
    flexShrink: 1,
    fontFamily: MonoFont,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: 3,
  },
});
