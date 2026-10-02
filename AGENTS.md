# AGENTS.md — myChat
App móvil de chat 1 a 1 por texto (Expo + Supabase) para un proyecto de taller. La gente se agrega con un código de amigo de 8 caracteres, y la otra persona acepta la solicitud. El objetivo es una base simple, segura y fácil de entender para alguien que está aprendiendo.

## Stack y estructura
- Expo SDK 57 (React Native 0.86, React 19.2, TypeScript estricto) con React Compiler y typed routes activados (`app.json`). Se prueba en **Expo Go**.
- Expo Router 57 para la navegación.
- `@supabase/supabase-js` 2: Auth, Postgres con RLS, Realtime y Edge Functions. Proyecto `mjjkfufthravqfvaypyb`.
- La sesión se guarda según la plataforma: `src/lib/auth-storage.ts` (iOS/Android, `expo-sqlite/localStorage`) y `src/lib/auth-storage.web.ts` (web, `localStorage` del navegador). OAuth y enlaces usan `expo-auth-session` + `expo-web-browser`. El portapapeles usa `expo-clipboard`.
- `src/app/`: solo pantallas.
  - `_layout.tsx` decide qué se ve con `Stack.Protected`: `(app)/` requiere sesión y `(auth)/` exige no tenerla.
  - `(app)/(tabs)/`: barra inferior con dos pestañas, `index` (Chats: agregar contacto, solicitudes y contactos) y `profile` (Perfil: código, cambiar contraseña y cerrar sesión). Usa `Tabs` de `expo-router/js-tabs` con la barra propia `src/components/tab-bar.tsx`.
  - `(app)/chat/[id].tsx` está **fuera** de `(tabs)`, en el Stack raíz, para que el chat se abra sin la barra.
  - `reset-password.tsx` está fuera de los grupos a propósito: la abre el enlace del email antes de que exista la sesión.
- `src/providers/auth-provider.tsx`: sesión global (`useAuth`). También procesa los deep links de Supabase (tokens en la URL).
- `src/lib/`:
  - `supabase.ts`: cliente único.
  - `auth.ts`: Google, enlaces y recuperación.
  - `errors.ts`: traducción de errores al español.
  - `validation.ts`: reglas compartidas, como `MESSAGE_MAX_LENGTH`.
  - `database.types.ts`: **generado**, no se edita.
- `src/hooks/`: `use-home-data.ts` (solicitudes y contactos), `use-profile.ts` (username y código) y `use-messages.ts` (carga + Realtime + envío).
- `src/constants/theme.ts`: paleta claro/oscuro, espaciados, tipografía y `TouchTarget`.
- `supabase/migrations/`: copia de cada migración aplicada. El nombre lleva la misma `version` que muestra `list_migrations`.
- `supabase/functions/`:
  - `add-friend-by-code`: envía la solicitud, o la acepta si había una cruzada.
  - `respond-friend-request`: acepta o rechaza.
  - `_shared/http.ts`: helpers comunes.

## Comandos
```bash
npx expo install <paquete>   # SIEMPRE en lugar de npm install (versiones compatibles con el SDK)
npx expo start               # servidor de desarrollo → escanear el QR con Expo Go
npx expo start --web         # abrir la app en el navegador (http://localhost:8081)
npx tsc --noEmit             # typecheck (excluye supabase/, que es Deno)
npx expo lint                # lint
npx expo export --platform android --output-dir /tmp/export   # comprobar que el bundle compila (repetir con ios y web)
npx expo-doctor              # diagnosticar dependencias
npx eas-cli build -p android --profile preview   # APK instalable (production genera AAB para Play Store)
```
- El backend se administra con el **MCP de Supabase**: `apply_migration`, `deploy_edge_function`, `generate_typescript_types` y `get_advisors`.
- El Supabase CLI no está instalado.

## Convenciones
- Los textos de la interfaz y los comentarios del código van **en español**, y la interfaz trata de "tú".
- Los nombres de código van en inglés (`useHomeData`, `sendMessage`) y los archivos en kebab-case.
- Los errores al usuario siempre pasan por `getErrorMessage` / `getFunctionErrorMessage` (`src/lib/errors.ts`). No se muestran mensajes crudos de Supabase.
- Se valida en el cliente con `src/lib/validation.ts` **y** en el servidor (CHECK en Postgres o en la Edge Function), y las dos reglas tienen que coincidir.
- Para la UI se usan los componentes base (`AppText`, `Button`, `TextField`, `FormScreen`, `FormMessage`, `ListRow`, `TabBar`) y los colores de `useTheme()`, nunca hex sueltos. Referencia: `src/app/(auth)/sign-in.tsx`.
- Para los datos de una pantalla se crea un hook en `src/hooks/`. Referencia: `use-home-data.ts`.
- SQL:
  - Una migración por cambio, con nombre descriptivo en snake_case.
  - `(select auth.uid())` en las políticas.
  - `security definer` solo con `set search_path = ''`.
  - Permisos explícitos: `revoke all` + `grant` mínimo.

## Reglas de dominio / trampas conocidas
- **Expo cambia en cada SDK.** No confíes en tu memoria: consulta `https://docs.expo.dev/versions/v57.0.0/` y https://docs.expo.dev/llms.txt antes de usar una API de Expo o React Native.
- **Solo Expo Go**: nada que requiera código nativo o un development build. Google se hace con `signInWithOAuth` + navegador, **no** con `@react-native-google-signin`.
- **No importes `expo-sqlite` en código que corre en web.** Metro sigue todos los `require` aunque estén dentro de un `if` que no se cumple, y arrastra el SQLite para web, que necesita un `.wasm`. Usa archivos por plataforma (`archivo.web.ts`), como `auth-storage`.
- Web usa render estático (`"output": "static"` en `app.json`): las pantallas también se ejecutan en **Node**, donde no existen `window` ni `localStorage`. Protege ese acceso con `typeof window === 'undefined'`. Por eso existe `use-color-scheme.web.ts`.
- En web, `Alert.alert` **no hace nada** (react-native-web lo deja vacío). Para confirmar algo en web usa `window.confirm` con `Platform.OS === 'web'`. Referencia: `confirmSignOut` en `(tabs)/profile.tsx`.
- **EAS Build no sube `.env`** (está en `.gitignore`). Las variables `EXPO_PUBLIC_*` del build salen de EAS (`eas env:create --environment preview`) y el perfil `preview` de `eas.json` las toma con `"environment": "preview"`. Si falta alguna, `supabase.ts` lanza un error y la app se cierra al abrir.
- El paquete de Android es `com.mateobetanzo.mychat` y **no se cambia**: es la identidad permanente de la app. En la APK los enlaces de Supabase vuelven a `mychat://...`, así que Redirect URLs necesita `mychat://**`.
- `ios/` y `android/` se generan solos (CNG). No se crean ni se editan a mano.
- Los perfiles los crea el trigger `handle_new_user` al registrarse.
  - El username viene en `options.data.username`. Si falta, como en Google, se genera desde el email.
  - Un username duplicado hace fallar el `signUp` con el código `23505`.
- `friendships`, `conversations` y `profiles` **no tienen permisos de escritura** para el cliente. Todo cambio pasa por las Edge Functions, que usan service role.
  - El cliente solo puede insertar en `messages` las columnas `conversation_id`, `sender_id` y `content`.
- Una conversación guarda la pareja ordenada (`user_a < user_b`). Hay una sola amistad por pareja: índice único con `least`/`greatest`. Rechazar una solicitud **borra** la fila.
- Pantallas que no deben mostrar la barra inferior (como el chat) van en el Stack raíz, fuera de `(tabs)`.
  - Con `tabBar` propio, `tabBarHideOnKeyboard` no se aplica solo: `TabBar` oculta la barra con el teclado abierto en Android.
  - Importa `Tabs` desde `expo-router/js-tabs`: el import desde `expo-router` está obsoleto en SDK 57.
  - Íconos con `SymbolView` de `expo-symbols` (`{ ios, android }`). Comprueba que el nombre de Android exista en `node_modules/expo-symbols/build/android/symbols.json`.
- El chat usa una `FlatList` **invertida**: los mensajes van del más nuevo al más viejo y se deduplican por `id`, porque llegan por el insert y por Realtime.
- En Expo Go, los enlaces de Supabase apuntan a `exp://<IP>:8081/--/...`. Por eso Redirect URLs necesita `exp://**`. Si cambia la IP de la PC, los emails viejos dejan de servir.
- Después de cada migración: volver a generar `src/lib/database.types.ts`, guardar la copia en `supabase/migrations/` y ejecutar los advisors.

## Forma de trabajar
- Planifica antes de tocar código si el cambio afecta la base de datos, la autenticación, la navegación o más de 2-3 archivos.
- Haz cambios pequeños y verificables, en el orden backend → tipos → frontend.
- Al terminar, explica en lenguaje sencillo qué cambió y por qué, cómo probarlo y qué decisiones tomaste por tu cuenta.

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Límites
- ✅ Siempre:
  - Ejecutar `npx tsc --noEmit` y `npx expo lint` antes de dar algo por terminado.
  - Usar `npx expo install`.
  - Mantener RLS activado en todas las tablas.
  - Ejecutar los advisors después de cambiar el esquema.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes de:
  - Agregar dependencias nuevas.
  - Crear pantallas o archivos nuevos.
  - Cambiar el esquema o el formato de datos.
  - Agregar funciones fuera del alcance acordado (imágenes, grupos, notificaciones…).
  - Borrar datos o usuarios de Supabase.
- 🚫 Nunca:
  - Poner la service_role key (o cualquier secreto) en la app o en el repo.
  - Commitear `.env`.
  - Editar `database.types.ts` a mano.
  - Desactivar RLS.
  - Borrar tablas sin permiso.
  - Crear `ios/` o `android/` a mano.

## Verificación
1. `npx tsc --noEmit` y `npx expo lint` sin errores.
2. Si se tocó la base de datos: advisors de seguridad y rendimiento con `get_advisors` y una prueba de RLS con `execute_sql`, simulando el rol `authenticated` dentro de una transacción que se revierte.
3. Si se tocó una Edge Function: probarla con `curl` usando el token de una cuenta de prueba (casos buenos y malos).
4. En Expo Go con dos cuentas (dos dispositivos, o uno + emulador): registro, agregar por código, aceptar, chatear (los mensajes aparecen al instante) y cerrar y reabrir la app (la sesión se mantiene).
