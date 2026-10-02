// Edge Function: add-friend-by-code
// Recibe { code } y envía una solicitud de amistad al dueño de ese código.
// Si esa persona ya me había enviado una solicitud, se acepta automáticamente.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import {
  acceptFriendship,
  corsHeaders,
  createAdminClient,
  errorResponse,
  getCallerId,
  jsonResponse,
} from '../_shared/http.ts';

// 8 caracteres del alfabeto sin confusiones (sin 0, O, 1, I, L)
const CODE_PATTERN = /^[A-HJKMNP-Z2-9]{8}$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Método no permitido.', 405);

  const admin = createAdminClient();

  // 1) ¿Quién llama?
  const userId = await getCallerId(req, admin);
  if (!userId) return errorResponse('Tu sesión expiró. Vuelve a iniciar sesión.', 401);

  // 2) Validar el código (aceptamos minúsculas, espacios y guiones: "abcd-efgh")
  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse('La solicitud no tiene el formato correcto.', 400);
  }
  const code = String(body.code ?? '')
    .toUpperCase()
    .replace(/[\s-]/g, '');
  if (!CODE_PATTERN.test(code)) {
    return errorResponse('El código no es válido. Debe tener 8 letras o números.', 400);
  }

  // 3) Buscar al dueño del código
  const { data: target, error: targetError } = await admin
    .from('profiles')
    .select('id, username')
    .eq('friend_code', code)
    .maybeSingle();
  if (targetError) return errorResponse('No pudimos buscar el código. Inténtalo de nuevo.', 500);
  if (!target) return errorResponse('No existe ningún usuario con ese código.', 404);
  if (target.id === userId) {
    return errorResponse('Ese es tu propio código. No puedes agregarte a ti mismo.', 400);
  }

  // 4) ¿Ya hay una relación entre los dos (en cualquier dirección)?
  const { data: existing, error: existingError } = await admin
    .from('friendships')
    .select('id, requester_id, status')
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${target.id}),` +
        `and(requester_id.eq.${target.id},addressee_id.eq.${userId})`
    )
    .maybeSingle();
  if (existingError) return errorResponse('No pudimos revisar tus contactos. Inténtalo de nuevo.', 500);

  if (existing) {
    if (existing.status === 'accepted') {
      return errorResponse(`Tú y ${target.username} ya son contactos.`, 409);
    }
    if (existing.requester_id === userId) {
      return errorResponse(`Ya le enviaste una solicitud a ${target.username}. Espera a que la acepte.`, 409);
    }
    // La otra persona ya me había enviado una solicitud: la aceptamos.
    const acceptError = await acceptFriendship(admin, existing.id, userId, target.id);
    if (acceptError) return errorResponse('No pudimos aceptar la solicitud. Inténtalo de nuevo.', 500);
    return jsonResponse({ status: 'accepted', username: target.username });
  }

  // 5) Crear la solicitud pendiente
  const { error: insertError } = await admin
    .from('friendships')
    .insert({ requester_id: userId, addressee_id: target.id });
  if (insertError) {
    // 23505 = violación de unicidad: alguien creó la relación al mismo tiempo
    if (insertError.code === '23505') {
      return errorResponse(`Ya existe una solicitud entre tú y ${target.username}.`, 409);
    }
    return errorResponse('No pudimos enviar la solicitud. Inténtalo de nuevo.', 500);
  }

  return jsonResponse({ status: 'pending', username: target.username }, 201);
});
