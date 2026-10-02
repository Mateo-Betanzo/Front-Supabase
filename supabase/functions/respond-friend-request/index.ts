// Edge Function: respond-friend-request
// Recibe { request_id, action: 'accept' | 'reject' }.
// Solo quien RECIBIÓ la solicitud puede responderla.
//   accept → la amistad queda aceptada y se crea la conversación
//   reject → la solicitud se borra (se podrá volver a enviar más adelante)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import {
  acceptFriendship,
  corsHeaders,
  createAdminClient,
  errorResponse,
  getCallerId,
  jsonResponse,
} from '../_shared/http.ts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Método no permitido.', 405);

  const admin = createAdminClient();

  const userId = await getCallerId(req, admin);
  if (!userId) return errorResponse('Tu sesión expiró. Vuelve a iniciar sesión.', 401);

  let body: { request_id?: unknown; action?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse('La solicitud no tiene el formato correcto.', 400);
  }
  const requestId = String(body.request_id ?? '');
  const action = body.action;
  if (!UUID_PATTERN.test(requestId) || (action !== 'accept' && action !== 'reject')) {
    return errorResponse('La solicitud no tiene el formato correcto.', 400);
  }

  // Buscar la solicitud y comprobar que es para mí
  const { data: request, error: requestError } = await admin
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .eq('id', requestId)
    .maybeSingle();
  if (requestError) return errorResponse('No pudimos cargar la solicitud. Inténtalo de nuevo.', 500);
  if (!request || request.addressee_id !== userId) {
    return errorResponse('Esta solicitud ya no existe.', 404);
  }

  if (action === 'accept') {
    // Si ya estaba aceptada, igual nos aseguramos de que exista la conversación.
    const acceptError = await acceptFriendship(admin, request.id, request.requester_id, userId);
    if (acceptError) return errorResponse('No pudimos aceptar la solicitud. Inténtalo de nuevo.', 500);
    return jsonResponse({ status: 'accepted' });
  }

  // reject: solo se pueden rechazar solicitudes pendientes
  if (request.status !== 'pending') {
    return errorResponse('Esta solicitud ya fue aceptada.', 409);
  }
  const { error: deleteError } = await admin
    .from('friendships')
    .delete()
    .eq('id', request.id)
    .eq('status', 'pending');
  if (deleteError) return errorResponse('No pudimos rechazar la solicitud. Inténtalo de nuevo.', 500);
  return jsonResponse({ status: 'rejected' });
});
