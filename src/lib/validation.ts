// Validaciones del lado del cliente.
// Cada función devuelve un mensaje de error en español, o null si todo está bien.
// (El servidor vuelve a validar lo mismo: nunca confiamos solo en el cliente.)

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const FRIEND_CODE_PATTERN = /^[A-HJKMNP-Z2-9]{8}$/;
export const PASSWORD_MIN_LENGTH = 8;
export const MESSAGE_MAX_LENGTH = 2000;

export function validateEmail(email: string) {
  if (!email.trim()) return 'Escribe tu email.';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Ese email no parece válido.';
  return null;
}

export function validatePassword(password: string) {
  if (!password) return 'Escribe una contraseña.';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  return null;
}

export function validateUsername(username: string) {
  if (!username) return 'Elige un nombre de usuario.';
  if (!USERNAME_PATTERN.test(username)) {
    return 'Usa de 3 a 20 caracteres: letras minúsculas, números o guion bajo (_).';
  }
  return null;
}

export function validateMessage(text: string) {
  if (!text.trim()) return 'El mensaje está vacío.';
  if (text.length > MESSAGE_MAX_LENGTH) {
    return `El mensaje es demasiado largo (máximo ${MESSAGE_MAX_LENGTH} caracteres).`;
  }
  return null;
}

/** "abcd-efgh " → "ABCDEFGH" */
export function normalizeFriendCode(code: string) {
  return code.toUpperCase().replace(/[\s-]/g, '');
}

export function validateFriendCode(code: string) {
  const normalized = normalizeFriendCode(code);
  if (!normalized) return 'Escribe el código de la otra persona.';
  if (!FRIEND_CODE_PATTERN.test(normalized)) {
    return 'El código tiene 8 letras o números, por ejemplo ABCD-EFGH.';
  }
  return null;
}

/** "ABCDEFGH" → "ABCD-EFGH" (más fácil de leer y dictar) */
export function formatFriendCode(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
