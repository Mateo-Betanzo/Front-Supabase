import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { FormMessage } from '@/components/form-message';
import { ListRow } from '@/components/list-row';
import { TextField } from '@/components/text-field';
import { Spacing, Type } from '@/constants/theme';
import { useHomeData } from '@/hooks/use-home-data';
import { useTheme } from '@/hooks/use-theme';
import { getFunctionErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { normalizeFriendCode, validateFriendCode } from '@/lib/validation';
import { useAuth } from '@/providers/auth-provider';

export default function ChatsScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const userId = session!.user.id; // esta pantalla solo existe con sesión (Stack.Protected)
  const { data, error, refreshing, refresh, reload } = useHomeData(userId);

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function handleAddFriend() {
    const problem = validateFriendCode(code);
    setCodeError(problem);
    setNotice(null);
    if (problem) return;

    setAdding(true);
    const { data: result, error: fnError } = await supabase.functions.invoke('add-friend-by-code', {
      body: { code: normalizeFriendCode(code) },
    });
    setAdding(false);

    if (fnError) {
      setNotice({ type: 'error', text: await getFunctionErrorMessage(fnError) });
      return;
    }
    setCode('');
    setNotice({
      type: 'success',
      text:
        result.status === 'accepted'
          ? `${result.username} ya te había enviado una solicitud: ahora son contactos.`
          : `Solicitud enviada a ${result.username}.`,
    });
    reload();
  }

  async function handleRespond(requestId: string, action: 'accept' | 'reject') {
    setRespondingId(requestId);
    setNotice(null);
    const { error: fnError } = await supabase.functions.invoke('respond-friend-request', {
      body: { request_id: requestId, action },
    });
    setRespondingId(null);
    if (fnError) {
      setNotice({ type: 'error', text: await getFunctionErrorMessage(fnError) });
    }
    reload();
  }

  if (!data) {
    return (
      <SafeAreaView edges={['top']} style={[styles.center, { backgroundColor: theme.background }]}>
        {error ? (
          <>
            <FormMessage type="error" message={error} />
            <Button title="Reintentar" onPress={reload} />
          </>
        ) : (
          <ActivityIndicator color={theme.accent} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} />
        }>
        <AppText variant="title" accessibilityRole="header">
          Chats
        </AppText>

        <Section title="Agregar contacto">
          <View style={styles.addRow}>
            <View style={styles.flex}>
              <TextField
                label=" "
                value={code}
                onChangeText={setCode}
                error={codeError}
                placeholder="ABCD-EFGH"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={9}
                returnKeyType="send"
                onSubmitEditing={handleAddFriend}
              />
            </View>
            <Button title="Enviar" onPress={handleAddFriend} loading={adding} style={styles.addButton} />
          </View>
          {notice ? <FormMessage type={notice.type} message={notice.text} /> : null}
        </Section>

        {data.incoming.length > 0 ? (
          <Section title={`Solicitudes recibidas (${data.incoming.length})`}>
            {data.incoming.map((request) => (
              <ListRow
                key={request.id}
                title={request.username}
                actions={
                  <>
                    <Button
                      title="Rechazar"
                      variant="ghost"
                      disabled={respondingId !== null}
                      onPress={() => handleRespond(request.id, 'reject')}
                    />
                    <Button
                      title="Aceptar"
                      loading={respondingId === request.id}
                      disabled={respondingId !== null}
                      onPress={() => handleRespond(request.id, 'accept')}
                    />
                  </>
                }
              />
            ))}
          </Section>
        ) : null}

        {data.outgoing.length > 0 ? (
          <Section title="Solicitudes enviadas">
            {data.outgoing.map((request) => (
              <ListRow key={request.id} title={request.username} detail="Esperando respuesta" />
            ))}
          </Section>
        ) : null}

        <Section title="Contactos">
          {data.contacts.length === 0 ? (
            <AppText color="textMuted">
              Todavía no tienes contactos. Escribe arriba el código de otra persona o comparte el tuyo
              desde Perfil.
            </AppText>
          ) : (
            data.contacts.map((contact) => (
              <ListRow
                key={contact.conversationId}
                title={contact.username}
                detail="Abrir chat"
                onPress={() =>
                  router.push({
                    pathname: '/chat/[id]',
                    params: { id: contact.conversationId, username: contact.username },
                  })
                }
              />
            ))
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Bloque con un título pequeño y su contenido. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="small" color="textMuted" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  addButton: {
    // alinea el botón con el campo (debajo de la etiqueta)
    marginTop: Type.small.lineHeight + Spacing.xs,
  },
});
