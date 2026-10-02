-- El chat carga los mensajes con: where conversation_id = X order by id desc limit 200.
-- El índice anterior usaba created_at y no servía para esa consulta (lo marcó el advisor).
drop index if exists public.messages_conversation_id_created_at_idx;
create index messages_conversation_id_id_idx on public.messages (conversation_id, id);
