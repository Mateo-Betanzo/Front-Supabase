import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { FormMessage } from '@/components/form-message';
import { FormScreen } from '@/components/form-screen';
import { TextField } from '@/components/text-field';
import { Spacing } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { validateEmail, validatePassword, validateUsername } from '@/lib/validation';

type FieldErrors = { username?: string | null; email?: string | null; password?: string | null };

export default function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    const newErrors: FieldErrors = {
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(newErrors);
    setFormError(null);
    if (newErrors.username || newErrors.email || newErrors.password) return;

    setLoading(true);
    // El username viaja en los metadatos; el trigger de la base de datos
    // lo usa para crear el perfil (y le asigna el código de amigo).
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username } },
    });
    setLoading(false);
    // Sin confirmación de email, signUp ya inicia la sesión y el layout abre Home.
    if (error) setFormError(getErrorMessage(error));
  }

  return (
    <FormScreen title="Crear cuenta" subtitle="Elige cómo te verán tus contactos.">
      <TextField
        label="Nombre de usuario"
        value={username}
        // forzamos minúsculas mientras escribe, que es el formato permitido
        onChangeText={(text) => setUsername(text.toLowerCase().trim())}
        error={errors.username}
        placeholder="por ejemplo, ana_garcia"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        maxLength={20}
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        placeholder="Mínimo 8 caracteres"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSignUp}
      />

      <FormMessage type="error" message={formError} />

      <Button title="Crear cuenta" onPress={handleSignUp} loading={loading} />

      <View style={styles.footer}>
        <AppText variant="small" color="textMuted">
          ¿Ya tienes cuenta?
        </AppText>
        {/* dismissTo: vuelve a la pantalla de login que ya está abierta, sin apilar otra */}
        <Link href="/sign-in" dismissTo>
          <AppText variant="small" color="accent">
            Iniciar sesión
          </AppText>
        </Link>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
});
