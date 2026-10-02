// Traduce los errores de Supabase a mensajes claros en español.
import { FunctionsHttpError, isAuthError } from '@supabase/supabase-js';

const GENERIC_ERROR = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

// Errores de autenticación, según su código.
const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: 'El email o la contraseña no son correctos.',
  user_already_exists: 'Ya existe una cuenta con ese email.',
  email_exists: 'Ya existe una cuenta con ese email.',
  weak_password: 'La contraseña es demasiado débil. Usa una más larga o más variada.',
  same_password: 'La nueva contraseña debe ser distinta de la actual.',
  email_address_invalid: 'Ese email no es válido.',
  email_not_confirmed: 'Todavía no confirmaste tu email.',
  over_email_send_rate_limit: 'Se enviaron demasiados emails. Espera unos minutos y vuelve a intentarlo.',
  over_request_rate_limit: 'Demasiados intentos seguidos. Espera un momento y vuelve a intentarlo.',
  otp_expired: 'El enlace expiró o ya se usó. Pide uno nuevo.',
  session_not_found: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  refresh_token_not_found: 'Tu sesión expiró. Vuelve a iniciar sesión.',
};

/** Convierte cualquier error en un texto para mostrar al usuario. */
export function getErrorMessage(error: unknown): string {
  if (!error) return GENERIC_ERROR;

  if (isAuthError(error)) {
    if (error.code && AUTH_ERRORS[error.code]) return AUTH_ERRORS[error.code];
    // El trigger que crea el perfil falla si el username ya está ocupado
    // (Supabase devuelve el error 23505 de "valor duplicado" de Postgres).
    if (
      error.code === '23505' ||
      error.message.includes('profiles_username_key') ||
      error.message.includes('Database error saving new user')
    ) {
      return 'Ese nombre de usuario ya está en uso. Prueba con otro.';
    }
    if (error.name === 'AuthRetryableFetchError') return 'No hay conexión a internet. Revisa tu red.';
  }

  // Errores de la base de datos (PostgREST)
  if (typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: string }).code;
    if (code === '23514') return 'El mensaje no puede estar vacío ni superar los 2000 caracteres.';
    if (code === '42501') return 'No tienes permiso para hacer esto.';
  }

  if (error instanceof Error) {
    if (error.message.includes('Network request failed')) {
      return 'No hay conexión a internet. Revisa tu red.';
    }
    if (AUTH_ERRORS[error.message]) return AUTH_ERRORS[error.message];
  }

  return GENERIC_ERROR;
}

/**
 * Las Edge Functions responden { error: "mensaje en español" }.
 * Este helper extrae ese mensaje (o usa la traducción genérica).
 */
export async function getFunctionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === 'string') return body.error;
    } catch {
      // la respuesta no era JSON: usamos el mensaje genérico
    }
  }
  return getErrorMessage(error);
}
