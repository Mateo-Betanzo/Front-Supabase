import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Radius, Spacing, TouchTarget, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MESSAGE_MAX_LENGTH } from '@/lib/validation';

type MessageComposerProps = {
  /** devuelve un mensaje de error, o null si se envió bien */
  onSend: (text: string) => Promise<string | null>;
};

/** Campo para escribir + botón Enviar. */
export function MessageComposer({ onSend }: MessageComposerProps) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = text.trim().length === 0;
  // Mostramos el contador solo cuando falta poco para el límite.
  const showCounter = text.length > MESSAGE_MAX_LENGTH - 200;

  async function handleSend() {
    if (isEmpty || sending) return;
    setSending(true);
    const problem = await onSend(text);
    setSending(false);
    setError(problem);
    if (!problem) setText('');
  }

  return (
    <View style={[styles.container, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
      {error ? (
        <AppText variant="small" color="danger">
          {error}
        </AppText>
      ) : null}
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escribe un mensaje"
          placeholderTextColor={theme.textMuted}
          accessibilityLabel="Mensaje"
          multiline
          maxLength={MESSAGE_MAX_LENGTH}
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
        />
        <Button title="Enviar" onPress={handleSend} loading={sending} disabled={isEmpty} />
      </View>
      {showCounter ? (
        <AppText variant="small" color="textMuted" style={styles.counter}>
          {text.length}/{MESSAGE_MAX_LENGTH}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  input: {
    ...Type.body,
    flex: 1,
    minHeight: TouchTarget,
    maxHeight: 140,
    paddingHorizontal: Spacing.md,
    paddingTop: 13,
    paddingBottom: 13,
    borderRadius: Radius.bubble,
  },
  counter: {
    alignSelf: 'flex-end',
  },
});
