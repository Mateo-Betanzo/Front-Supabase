-- Al enviar un mensaje, el cliente solo puede indicar conversación, remitente y texto.
-- La fecha (created_at) la pone siempre el servidor, así nadie puede "inventar" la hora.
revoke insert on table public.messages from authenticated;
grant insert (conversation_id, sender_id, content) on table public.messages to authenticated;
