import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// Dónde se guarda la sesión: SQLite en el teléfono, localStorage en web
// (Metro elige auth-storage.ts o auth-storage.web.ts según la plataforma).
import { authStorage } from '@/lib/auth-storage';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copia .env.example como .env y complétalo.'
  );
}

// Cliente único de Supabase para toda la app.
// Solo usa la clave PUBLICABLE: la seguridad real la ponen las políticas RLS.
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // en móvil leemos los enlaces nosotros (ver auth-provider)
  },
});

// Renueva el token solo mientras la app está en primer plano (ahorra batería).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
