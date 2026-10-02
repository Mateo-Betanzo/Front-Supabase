-- =========================================================
-- Conversaciones 1 a 1
-- La pareja se guarda siempre ordenada (user_a < user_b), así
-- es imposible que existan dos chats entre las mismas personas.
-- =========================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conversations_ordered_pair check (user_a < user_b),
  constraint conversations_pair_unique unique (user_a, user_b)
);

comment on table public.conversations is 'Chat entre dos contactos. Se crea al aceptar una solicitud (Edge Function).';

-- user_a ya está cubierto por el índice del unique (user_a, user_b); falta user_b.
create index conversations_user_b_idx on public.conversations (user_b);

alter table public.conversations enable row level security;

revoke all on table public.conversations from anon, authenticated;
grant select on table public.conversations to authenticated;

-- Solo veo las conversaciones en las que participo.
create policy "Ver mis conversaciones"
  on public.conversations for select
  to authenticated
  using ((select auth.uid()) in (user_a, user_b));
