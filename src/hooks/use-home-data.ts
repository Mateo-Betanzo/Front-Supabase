// Carga lo que muestra la pestaña Chats: solicitudes y contactos.
// (Mi perfil se carga aparte, en use-profile.ts, para la pestaña Perfil.)
// RLS se encarga de que solo lleguen MIS datos.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

export type Contact = { conversationId: string; username: string };
export type FriendRequest = { id: string; username: string };

type HomeData = {
  contacts: Contact[];
  incoming: FriendRequest[]; // solicitudes que me enviaron (puedo aceptar/rechazar)
  outgoing: FriendRequest[]; // solicitudes que envié (pendientes)
};

export function useHomeData(userId: string) {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    // Las dos consultas van en paralelo para que cargue más rápido.
    const [requestsResult, conversationsResult] = await Promise.all([
      // "requester:profiles!friendships_requester_id_fkey(username)" trae el
      // username de la otra persona usando la clave foránea.
      supabase
        .from('friendships')
        .select(
          'id, requester_id, requester:profiles!friendships_requester_id_fkey(username), addressee:profiles!friendships_addressee_id_fkey(username)'
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('conversations')
        .select(
          'id, user_a, a:profiles!conversations_user_a_fkey(username), b:profiles!conversations_user_b_fkey(username)'
        ),
    ]);

    const firstError = requestsResult.error ?? conversationsResult.error;
    if (firstError) {
      setError(getErrorMessage(firstError));
      return;
    }
    setError(null);

    const requests = requestsResult.data ?? [];
    const conversations = conversationsResult.data ?? [];

    setData({
      incoming: requests
        .filter((r) => r.requester_id !== userId)
        .map((r) => ({ id: r.id, username: r.requester.username })),
      outgoing: requests
        .filter((r) => r.requester_id === userId)
        .map((r) => ({ id: r.id, username: r.addressee.username })),
      contacts: conversations
        // el contacto es "el otro" de la pareja
        .map((c) => ({
          conversationId: c.id,
          username: c.user_a === userId ? c.b.username : c.a.username,
        }))
        .sort((x, y) => x.username.localeCompare(y.username)),
    });
  }, [userId]);

  // Recarga cada vez que la pantalla vuelve a estar visible (por ejemplo, al salir de un chat).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Para "tirar hacia abajo para actualizar".
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { data, error, refreshing, refresh, reload: load };
}
