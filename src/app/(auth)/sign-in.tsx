import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { FormMessage } from '@/components/form-message';
import { FormScreen } from '@/components/form-screen';
import { TextField } from '@/components/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signInWithGoogle } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { validateEmail } from '@/lib/validation';

export default function SignInScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'email' | 'google' | null>(null);

  async function handleSignIn() {
    const emailProblem = validateEmail(email);
    const passwordProblem = password ? null : 'Escribe tu contraseña.';
    setEmailError(emailProblem);
    setPasswordError(passwordProblem);
    setFormError(null);
    if (emailProblem || passwordProblem) return;

    setLoading('email');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(null);
    // Si sale bien no hace falta navegar: el layout detecta la sesión y abre Home.
    if (error) setFormError(getErrorMessage(error));
  }

  async function handleGoogle() {
    setFormError(null);
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(null);
    }
  }

  return (
    <FormScreen title="myChat" subtitle="Inicia sesión para hablar con tus contactos.">
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSignIn}
      />

      <Link href="/forgot-password" style={styles.forgot}>
        <AppText variant="small" color="accent">
          ¿Olvidaste tu contraseña?
        </AppText>
      </Link>

      <FormMessage type="error" message={formError} />

      <Button
        title="Iniciar sesión"
        onPress={handleSignIn}
        loading={loading === 'email'}
        disabled={loading !== null}
      />

      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
        <AppText variant="small" color="textMuted">
          o
        </AppText>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
      </View>

      <Button
        title="Continuar con Google"
        variant="secondary"
        onPress={handleGoogle}
        loading={loading === 'google'}
        disabled={loading !== null}
      />

      <View style={styles.footer}>
        <AppText variant="small" color="textMuted">
          ¿No tienes cuenta?
        </AppText>
        <Link href="/sign-up">
          <AppText variant="small" color="accent">
            Crear cuenta
          </AppText>
        </Link>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
});
