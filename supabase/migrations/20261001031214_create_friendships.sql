-- =========================================================
-- Amistades / solicitudes de amistad
-- requester_id = quien envía la solicitud, addressee_id = quien la recibe
-- =========================================================
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  -- nadie puede enviarse una solicitud a sí mismo
  constraint friendships_not_self check (requester_id <> addressee_id)
);

comment on table public.friendships is 'Solicitudes (pending) y amistades (accepted). Solo se escriben desde Edge Functions.';

-- Una sola relación por pareja, sin importar quién la envió (A→B es lo mismo que B→A).
create unique index friendships_pair_unique
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

-- Índices para buscar rápido "mis solicitudes" por cada lado.
create index friendships_requester_id_idx on public.friendships (requester_id);
create index friendships_addressee_id_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;

revoke all on table public.friendships from anon, authenticated;
grant select on table public.friendships to authenticated;

-- Solo veo las filas donde participo (como emisor o receptor).
create policy "Ver mis solicitudes y amistades"
  on public.friendships for select
  to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- =========================================================
-- Política de lectura de perfiles (depende de friendships)
-- Veo mi perfil y el de quienes tienen una solicitud o amistad conmigo.
-- =========================================================
create policy "Ver mi perfil y el de mis contactos"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.friendships f
      where (f.requester_id = (select auth.uid()) and f.addressee_id = profiles.id)
         or (f.addressee_id = (select auth.uid()) and f.requester_id = profiles.id)
    )
  );
