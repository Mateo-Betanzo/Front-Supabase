import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/button';
import { FormMessage } from '@/components/form-message';
import { FormScreen } from '@/components/form-screen';
import { TextField } from '@/components/text-field';
import { sendPasswordResetEmail } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { validateEmail } from '@/lib/validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const problem = validateEmail(email);
    setEmailError(problem);
    setFormError(null);
    if (problem) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSent(true);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormScreen
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una contraseña nueva.">
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={handleSend}
      />

      <FormMessage type="error" message={formError} />
      <FormMessage
        type="success"
        message={
          sent
            ? 'Si existe una cuenta con ese email, te llegará un enlace en unos minutos. Ábrelo desde este teléfono.'
            : null
        }
      />

      <Button title={sent ? 'Enviar de nuevo' : 'Enviar enlace'} onPress={handleSend} loading={loading} />
      <Button title="Volver a iniciar sesión" variant="ghost" onPress={() => router.back()} />
    </FormScreen>
  );
}
