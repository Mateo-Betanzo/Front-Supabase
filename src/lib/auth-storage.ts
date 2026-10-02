// Dónde guarda Supabase la sesión en iOS y Android.
// (En web se usa auth-storage.web.ts: Metro elige el archivo según la plataforma.)
//
// Esta línea crea un `localStorage` en el teléfono (usando SQLite), así
// seguimos logueados aunque se cierre la app.
// No la importes en código que corre en web: arrastra el SQLite para web (.wasm).
import 'expo-sqlite/localStorage/install';

export const authStorage = localStorage;
