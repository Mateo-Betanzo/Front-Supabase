import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { FormMessage } from '@/components/form-message';
import { FriendCodeCard } from '@/components/friend-code-card';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const userId = session!.user.id; // esta pantalla solo existe con sesión (Stack.Protected)
  const { profile, error, reload } = useProfile(userId);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function signOut() {
    const { error: signOutFailure } = await supabase.auth.signOut();
    // Si sale bien, el layout detecta que no hay sesión y muestra el login.
    if (signOutFailure) setSignOutError(getErrorMessage(signOutFailure));
  }

  // Pedimos confirmación para evitar cerrar la sesión por un toque accidental.
  function confirmSignOut() {
    const title = '¿Cerrar sesión?';
    const message = 'Tendrás que volver a iniciar sesión para ver tus chats.';

    // En web, Alert.alert de React Native no hace nada (react-native-web lo deja vacío):
    // usamos el diálogo de confirmación del navegador.
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) signOut();
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
    ]);
  }

  if (!profile) {
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="small" color="textMuted">
            Tu nombre de usuario
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {profile.username}
          </AppText>
        </View>

        <FriendCodeCard code={profile.friendCode} />

        <View style={styles.actions}>
          <Button
            title="Cambiar contraseña"
            variant="secondary"
            onPress={() => router.push({ pathname: '/reset-password', params: { mode: 'change' } })}
          />
          <Button title="Cerrar sesión" variant="ghost" onPress={confirmSignOut} />
          <FormMessage type="error" message={signOutError} />
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    gap: Spacing.xs,
  },
  actions: {
    gap: Spacing.sm,
  },
});
