-- 0003_profiles_add_email.sql
--
-- Gap encontrado al construir la Parte E (otorgar acceso manual): el admin
-- necesita buscar un alumno por email para darle acceso a un curso sin
-- pago, pero `profiles` no tenía email — solo vive en auth.users, que el
-- cliente nunca puede leer directo. Se agrega una copia en profiles,
-- poblada automáticamente al registrarse.

alter table public.profiles add column if not exists email text;

-- Backfill por si ya hay cuentas registradas antes de esta migración.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- El trigger de creación de perfil (0001_init.sql) también guarda el email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, email)
  values (new.id, new.raw_user_meta_data ->> 'nombre', new.email);
  return new;
end;
$$;

create index if not exists profiles_email_idx on public.profiles (email);
