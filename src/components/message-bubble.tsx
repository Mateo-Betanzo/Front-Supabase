import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MessageBubbleProps = {
  content: string;
  createdAt: string;
  /** true si lo envié yo: va a la derecha y con el color de acento */
  mine: boolean;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ content, createdAt, mine }: MessageBubbleProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.bubble,
        mine
          ? [styles.mine, { backgroundColor: theme.accent }]
          : [styles.theirs, { backgroundColor: theme.surface }],
      ]}>
      <AppText color={mine ? 'accentText' : 'text'} selectable>
        {content}
      </AppText>
      <AppText variant="small" color={mine ? 'accentText' : 'textMuted'} style={styles.time}>
        {formatTime(createdAt)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.bubble,
    gap: 2,
  },
  // la esquina "recortada" indica de qué lado viene el mensaje
  mine: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: Radius.sm / 2,
  },
  theirs: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: Radius.sm / 2,
  },
  time: {
    alignSelf: 'flex-end',
    fontSize: 11,
    lineHeight: 14,
    opacity: 0.8,
  },
});
