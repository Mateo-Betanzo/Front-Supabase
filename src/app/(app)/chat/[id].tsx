import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { FormMessage } from '@/components/form-message';
import { MessageBubble } from '@/components/message-bubble';
import { MessageComposer } from '@/components/message-composer';
import { Spacing, TouchTarget } from '@/constants/theme';
import { useMessages } from '@/hooks/use-messages';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/auth-provider';

export default function ChatScreen() {
  const theme = useTheme();
  const { id, username } = useLocalSearchParams<{ id: string; username?: string }>();
  const { session } = useAuth();
  const userId = session!.user.id; // esta pantalla solo existe con sesión
  const { messages, loading, error, sendMessage } = useMessages(id, userId);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Cabecera propia: botón volver + nombre del contacto */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          style={styles.back}>
          <AppText variant="heading" color="accent">
            ‹ Volver
          </AppText>
        </Pressable>
        <AppText variant="heading" numberOfLines={1} style={styles.title} accessibilityRole="header">
          {username ?? 'Chat'}
        </AppText>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <FormMessage type="error" message={error} />
          </View>
        ) : (
          // Lista "invertida": el primer elemento se dibuja abajo del todo.
          // Como los mensajes van del más nuevo al más viejo, el último mensaje
          // siempre queda visible abajo, sin calcular el scroll a mano.
          <FlatList
            inverted
            data={messages}
            keyExtractor={(message) => String(message.id)}
            renderItem={({ item }) => (
              <MessageBubble
                content={item.content}
                createdAt={item.created_at}
                mine={item.sender_id === userId}
              />
            )}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.empty}>
                <AppText color="textMuted">Escribe el primer mensaje a {username ?? 'tu contacto'}.</AppText>
              </View>
            }
          />
        )}

        <MessageComposer onSend={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    minHeight: TouchTarget + Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  list: {
    flexGrow: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
