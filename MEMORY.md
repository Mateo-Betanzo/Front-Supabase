# MEMORY.md — myChat
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v1 implementada (2026-10-01):
  - Registro, login y cierre de sesión; la sesión persiste.
  - Recuperar, restablecer y cambiar contraseña.
  - Login con Google (código listo).
  - Barra inferior con 2 pestañas: **Chats** (agregar contacto, solicitudes y contactos) y **Perfil** (código, cambiar contraseña y cerrar sesión con confirmación).
  - Chat 1 a 1 en tiempo real.
- La app también abre en web (2026-10-01). La sesión de web va en el `localStorage` del navegador.
- Build Android preparado (2026-10-02): `android.package` = `com.mateobetanzo.mychat` y `eas.json` → `preview` con `"environment": "preview"` (APK). Falta que el usuario cree las variables en EAS y corra el build.
- Backend: 6 migraciones aplicadas y 2 Edge Functions (`add-friend-by-code`, `respond-friend-request`).
- Probado:
  - RLS con SQL simulando usuarios.
  - Edge Functions con `curl` (13 casos).
  - Realtime con 2 cuentas desde Node.
  - tsc, lint y bundle de Android.
- Falta probarlo en un teléfono real: Google y el enlace de recuperación por email.
- Datos de prueba borrados el 2026-10-02 (solo filas, sin cambios de esquema): 0 mensajes y sin las cuentas `prueba_a`/`prueba_b`. Quedan las cuentas del usuario `mateo` y `mateo1`, ya contactos y con el chat vacío.

## Decisiones (y por qué)
- Agregar por código crea una **solicitud** que el otro acepta (tipo Steam) — lo pidió el usuario.
- La conversación se crea al **aceptar** la solicitud — así un chat solo existe entre contactos confirmados.
- Todas las escrituras de amistad pasan por Edge Functions — el cliente no puede buscar perfiles ajenos ni falsear relaciones.
- Perfil = solo `username` — lo pidió el usuario. Para Google se genera `parteDelEmail_1234`.
- Sin confirmación de email — el SMTP gratuito de Supabase envía pocos emails por hora.
- La sesión se guarda con `expo-sqlite/localStorage` en vez de AsyncStorage — es lo que indica la guía actual de Expo.
- Header propio en el chat (sin header nativo) — evita calcular el offset del teclado en `KeyboardAvoidingView`.
- Límite de 2000 caracteres por mensaje, contraseña mínima de 8 en el cliente y carga de los últimos 200 mensajes (sin paginación) — elegidos por el agente, pendientes de que el usuario los revise.
- Barra inferior propia (Tabs JS + `tab-bar.tsx`) en vez de NativeTabs — control total del diseño y API estable. Íconos con `expo-symbols`, que ya estaba instalado (sin dependencias nuevas). Sin badge de solicitudes ni saludo — lo eligió el usuario.
- Índice `messages (conversation_id, id)` — el chat ordena por `id` (lo marcó el advisor).

## Aprendizajes y errores a evitar
- Un username duplicado en `signUp` devuelve `code: "23505"`, no "Database error saving new user".
- Realtime puede tardar unos segundos en el primer arranque del proyecto: el primer evento puede perderse (la app recarga el historial al abrir el chat).
- Web fallaba con `wa-sqlite.wasm`: `expo-sqlite/localStorage/install` tiene un `require` dentro de `if (EXPO_OS !== 'web')`, pero Metro lo resuelve igual. Además, el render estático corre en Node, sin `localStorage`. Solución: `auth-storage.ts` / `.web.ts`.
- "Cerrar sesión" no hacía nada en web: `Alert.alert` está vacío en react-native-web. Ahora se usa `window.confirm` en web.
- La regla de lint `react-hooks/set-state-in-effect` prohíbe `setState` directo dentro de `useEffect`: hay que llamarlo desde callbacks o promesas.

## Próximos pasos
- El usuario debe configurar Redirect URLs (`exp://**`, `mychat://**`, y `http://localhost:8081/**` para probar Google y la recuperación en web), revisar Google y activar "Leaked password protection".
- El usuario debe correr `eas env:create` (URL + clave publicable, entorno `preview`) y después `npx eas-cli build -p android --profile preview`.
- Probar en Expo Go el flujo completo con 2 dispositivos, incluidas las pestañas (teclado en Android y volver desde el chat).
