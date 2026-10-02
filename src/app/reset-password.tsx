// Pantalla para elegir una contraseña nueva. Se usa en dos casos:
// 1) Desde el enlace del email "Recuperar contraseña" (la app inicia sesión con ese enlace).
// 2) Desde Home → "Cambiar contraseña" (con la sesión ya iniciada, ?mode=change).
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { Button } from '@/components/button';
import { FormMessage } from '@/components/form-message';
import { FormScreen } from '@/components/form-screen';
import { TextField } from '@/components/text-field';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { validatePassword } from '@/lib/validation';
import { useAuth } from '@/providers/auth-provider';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { session, linkStatus, linkError } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const isChange = mode === 'change';

  function goHome() {
    // Si venimos de Home, volvemos atrás. Si llegamos por el enlace del email,
    // no hay pantalla anterior: abrimos "/" (Home con sesión, o el login sin sesión).
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function handleSave() {
    const problem = validatePassword(password);
    const mismatch = password === confirm ? null : 'Las contraseñas no coinciden.';
    setPasswordError(problem);
    setConfirmError(problem ? null : mismatch);
    setFormError(null);
    if (problem || mismatch) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setFormError(getErrorMessage(error));
      return;
    }
    setDone(true);
  }

  // Estamos leyendo el enlace del email
  if (!session && linkStatus === 'processing') {
    return (
      <FormScreen title="Verificando enlace…">
        <ActivityIndicator color={theme.accent} />
      </FormScreen>
    );
  }

  // Sin sesión: el enlace falló, expiró o se abrió esta pantalla sin enlace
  if (!session) {
    return (
      <FormScreen
        title="Enlace no válido"
        subtitle={linkError ?? 'Abre el enlace que te enviamos por email desde este teléfono.'}>
        <Button title="Pedir un enlace nuevo" onPress={() => router.replace('/forgot-password')} />
        <Button title="Volver a iniciar sesión" variant="ghost" onPress={goHome} />
      </FormScreen>
    );
  }

  if (done) {
    return (
      <FormScreen title="Contraseña actualizada" subtitle="Ya puedes usar tu nueva contraseña.">
        <Button title="Ir al inicio" onPress={goHome} />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title={isChange ? 'Cambiar contraseña' : 'Crea una contraseña nueva'}
      subtitle="Usa al menos 8 caracteres.">
      <TextField
        label="Nueva contraseña"
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <TextField
        label="Repite la contraseña"
        value={confirm}
        onChangeText={setConfirm}
        error={confirmError}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSave}
      />

      <FormMessage type="error" message={formError} />

      <Button title="Guardar contraseña" onPress={handleSave} loading={loading} />
      <Button title="Cancelar" variant="ghost" onPress={goHome} />
    </FormScreen>
  );
}
