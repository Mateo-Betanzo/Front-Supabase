// Funciones de autenticación que necesitan enlaces (deep links):
// login con Google y recuperación de contraseña.
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

// Cierra la ventana del navegador si la app se abrió desde ella (necesario en web).
WebBrowser.maybeCompleteAuthSession();

/**
 * URL a la que Supabase devuelve al usuario.
 * En Expo Go se ve como exp://192.168.x.x:8081/--/<ruta>;
 * en una build propia, como mychat://<ruta>.
 */
export function getRedirectUrl(path?: string) {
  return makeRedirectUri({ path });
}

/** ¿Este enlace trae datos de Supabase (tokens o error)? */
export function isAuthUrl(url: string) {
  return url.includes('access_token=') || url.includes('error_code=');
}

/**
 * Lee los tokens que Supabase pone en el enlace y crea la sesión.
 * Lanza un error si el enlace trae un error (por ejemplo, expirado).
 */
export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode || params.error_code) {
    throw new Error(params.error_code ?? errorCode ?? 'unknown');
  }

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return null;

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
  return data.session;
}

/**
 * Login con Google:
 * 1) Supabase nos da la URL de Google,
 * 2) la abrimos en un navegador dentro de la app,
 * 3) Google → Supabase → vuelve a la app con los tokens en el enlace.
 * Devuelve false si el usuario cerró el navegador sin terminar.
 */
export async function signInWithGoogle() {
  const redirectTo = getRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  await createSessionFromUrl(result.url);
  return true;
}

/** Envía el email con el enlace para restablecer la contraseña. */
export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getRedirectUrl('reset-password'),
  });
  if (error) throw error;
}
