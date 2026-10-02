/**
 * Colores, espaciados y tipografía de la app.
 * Estilo minimal: grises neutros, un solo color de acento (azul cobalto)
 * y modo claro/oscuro según el sistema.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F2F3F5', // tarjetas, campos y burbujas del otro
    border: '#E2E4E8',
    text: '#15171C',
    textMuted: '#6B7079',
    accent: '#2B50E6', // botones principales y mis burbujas
    accentText: '#FFFFFF', // texto sobre el acento
    danger: '#C62D2D',
  },
  dark: {
    background: '#0F1013',
    surface: '#1B1D22',
    border: '#2C2F36',
    text: '#ECEDEF',
    textMuted: '#9A9FA8',
    accent: '#7D93FF',
    accentText: '#0F1013',
    danger: '#FF7A7A',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  bubble: 18,
} as const;

// Escala tipográfica (tamaño / alto de línea)
export const Type = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  small: { fontSize: 14, lineHeight: 19, fontWeight: '400' },
} as const;

// Fuente monoespaciada: la usamos para el código de amigo,
// así no se confunden caracteres parecidos.
export const MonoFont = Platform.select({ ios: 'Menlo', default: 'monospace' });

// Alto mínimo de cualquier elemento que se pueda tocar.
export const TouchTarget = 48;
