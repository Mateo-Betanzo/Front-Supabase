import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

// Mantenemos la pantalla de carga hasta saber si hay sesión guardada.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const scheme = useColorScheme();
  const theme = useTheme();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  const isLoggedIn = session !== null;

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}>
        {/* Solo con sesión iniciada */}
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(app)/(tabs)" />
          <Stack.Screen name="(app)/chat/[id]" />
        </Stack.Protected>

        {/* Solo sin sesión: si inicias sesión, expo-router te saca de aquí solo */}
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="(auth)/sign-in" />
          <Stack.Screen name="(auth)/sign-up" />
          <Stack.Screen name="(auth)/forgot-password" />
        </Stack.Protected>

        {/* Disponible siempre: la abre el enlace del email y el botón "Cambiar contraseña" */}
        <Stack.Screen name="reset-password" />
      </Stack>
    </ThemeProvider>
  );
}
