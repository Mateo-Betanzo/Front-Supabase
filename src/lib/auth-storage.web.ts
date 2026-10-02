// Dónde guarda Supabase la sesión en web.
// - En el navegador: su propio `localStorage` (persiste al recargar la página).
// - Durante el render estático (corre en Node, donde no existe `localStorage`):
//   `undefined`, y supabase-js guarda la sesión en memoria.
export const authStorage = typeof window === 'undefined' ? undefined : window.localStorage;
