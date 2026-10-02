// Mensajes de una conversación: carga inicial + nuevos mensajes en tiempo real.
import { useCallback, useEffect, useState } from 'react';

import type { Tables } from '@/lib/database.types';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { validateMessage } from '@/lib/validation';

export type Message = Tables<'messages'>;

const PAGE_SIZE = 200;

/**
 * Une mensajes sin duplicados y los ordena del más nuevo al más viejo
 * (ese orden es el que necesita la lista "invertida" del chat).
 * Un mismo mensaje puede llegar dos veces: por la respuesta del insert y por Realtime.
 */
function mergeMessages(current: Message[], incoming: Message[]) {
  const byId = new Map<number, Message>();
  for (const message of [...current, ...incoming]) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => b.id - a.id);
}

export function useMessages(conversationId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1) Nos suscribimos a los INSERT de esta conversación.
    //    RLS también aplica aquí: solo llegan mensajes de chats donde participo.
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => setMessages((current) => mergeMessages(current, [payload.new as Message]))
      )
      .subscribe();

    // 2) Cargamos los últimos mensajes guardados.
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('id', { ascending: false })
      .limit(PAGE_SIZE)
      .then(({ data, error: loadError }) => {
        if (loadError) setError(getErrorMessage(loadError));
        else setMessages((current) => mergeMessages(current, data));
        setLoading(false);
      });

    // 3) Al salir del chat, cancelamos la suscripción.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  /** Envía un mensaje. Devuelve un mensaje de error, o null si salió bien. */
  const sendMessage = useCallback(
    async (text: string) => {
      const problem = validateMessage(text);
      if (problem) return problem;

      const { data, error: sendError } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: userId, content: text.trim() })
        .select()
        .single();
      if (sendError) return getErrorMessage(sendError);

      setMessages((current) => mergeMessages(current, [data]));
      return null;
    },
    [conversationId, userId]
  );

  return { messages, loading, error, sendMessage };
}
