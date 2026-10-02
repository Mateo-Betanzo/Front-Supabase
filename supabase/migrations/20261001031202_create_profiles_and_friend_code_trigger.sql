-- =========================================================
-- Perfiles: un perfil por cada usuario de auth.users (relación 1 a 1)
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- nombre de usuario: 3 a 20 caracteres, minúsculas, números o "_"
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  -- código para agregar amigos: 8 caracteres sin letras/números confusos (sin 0, O, 1, I, L)
  friend_code text not null unique check (friend_code ~ '^[A-HJKMNP-Z2-9]{8}$'),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Datos públicos de cada usuario. Se crea solo, con un trigger, al registrarse.';

-- Activamos RLS: sin políticas, nadie puede leer ni escribir (las políticas van en la siguiente migración).
alter table public.profiles enable row level security;

-- Permisos mínimos: los usuarios logueados solo pueden LEER (filtrado por RLS).
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

-- =========================================================
-- Genera un código de amigo único de 8 caracteres
-- =========================================================
create function public.generate_friend_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  new_code text;
begin
  loop
    new_code := '';
    for i in 1..8 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    -- si por casualidad ya existe, generamos otro
    exit when not exists (select 1 from public.profiles where friend_code = new_code);
  end loop;
  return new_code;
end;
$$;

-- =========================================================
-- Trigger: al crearse un usuario en auth.users, crea su perfil
-- =========================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer -- se ejecuta con permisos del dueño para poder insertar en profiles
set search_path = ''
as $$
declare
  base_name text;
  final_name text;
begin
  -- 1) username elegido al registrarse con email (viene en los metadatos)
  final_name := lower(nullif(btrim(new.raw_user_meta_data ->> 'username'), ''));

  -- 2) si no hay (por ejemplo, login con Google), lo generamos desde el email: juan_4821
  if final_name is null then
    base_name := left(
      regexp_replace(lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g'),
      15
    );
    if length(base_name) < 3 then
      base_name := 'usuario';
    end if;
    loop
      final_name := base_name || '_' || lpad(floor(random() * 10000)::int::text, 4, '0');
      exit when not exists (select 1 from public.profiles where username = final_name);
    end loop;
  end if;

  -- si el username ya existe, este insert falla y el registro se cancela
  insert into public.profiles (id, username, friend_code)
  values (new.id, final_name, public.generate_friend_code());

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nadie debe poder llamar estas funciones directamente desde la API.
revoke execute on function public.generate_friend_code() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
