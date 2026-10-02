-- =========================================================
-- Mensajes de texto
-- =========================================================
create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  -- no vacío (sin contar espacios) y como máximo 2000 caracteres
  content text not null
    constraint messages_content_length check (
      char_length(btrim(content)) >= 1 and char_length(content) <= 2000
    ),
  created_at timestamptz not null default now()
);

comment on table public.messages is 'Mensajes de cada conversación. Realtime activado.';

-- Para cargar los mensajes de un chat en orden, rápido.
create index messages_conversation_id_created_at_idx on public.messages (conversation_id, created_at);
create index messages_sender_id_idx on public.messages (sender_id);

alter table public.messages enable row level security;

revoke all on table public.messages from anon, authenticated;
grant select, insert on table public.messages to authenticated;

-- Veo los mensajes de las conversaciones en las que participo.
create policy "Ver mensajes de mis conversaciones"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (select auth.uid()) in (c.user_a, c.user_b)
    )
  );

-- Solo puedo enviar mensajes como yo mismo y en conversaciones donde participo.
create policy "Enviar mensajes en mis conversaciones"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (select auth.uid()) in (c.user_a, c.user_b)
    )
  );

-- Realtime: los cambios de esta tabla se envían a los clientes suscritos (respetando RLS).
alter publication supabase_realtime add table public.messages;
