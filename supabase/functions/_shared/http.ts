// Utilidades compartidas por las Edge Functions.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Responde con JSON y el código HTTP indicado. */
export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Responde con un error en español: { error: "..." }. */
export function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

/**
 * Cliente "admin" (service role). Ignora RLS, por eso SOLO existe aquí,
 * en el servidor. La clave la inyecta Supabase; nunca llega a la app.
 */
export function createAdminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

/** Devuelve el id del usuario que llama (leyendo su token), o null si no es válido. */
export async function getCallerId(req: Request, admin: SupabaseClient) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * Marca la amistad como aceptada y crea la conversación entre los dos.
 * Es "idempotente": si se llama dos veces, no duplica nada.
 */
export async function acceptFriendship(
  admin: SupabaseClient,
  friendshipId: string,
  userId1: string,
  userId2: string
) {
  const { error: updateError } = await admin
    .from('friendships')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .eq('status', 'pending'); // si ya estaba aceptada, no cambia nada
  if (updateError) return updateError;

  // La pareja se guarda ordenada (user_a < user_b), igual que exige la tabla.
  const [userA, userB] = [userId1, userId2].sort();
  const { error: conversationError } = await admin
    .from('conversations')
    .upsert({ user_a: userA, user_b: userB }, { onConflict: 'user_a,user_b', ignoreDuplicates: true });
  return conversationError;
}
