-- 0002_profiles_role_column_protection.sql
--
-- Bug encontrado al escribir el test de acceso cruzado de la Parte B:
-- la policy "profiles: usuario edita su propio perfil" (0001_init.sql)
-- permite auth.uid() = id, pero RLS controla FILAS, no COLUMNAS — así que
-- cualquier alumno logueado podía hacer
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', auth.uid())
-- y auto-promoverse a admin. Mismo tipo de limitación que ya se documentó
-- para course_videos.vimeo_id en 0001 (RLS no es column-level).
--
-- Fix: igual que con vimeo_id, se usa GRANT/REVOKE de columna. El rol de
-- Postgres 'authenticated' es el mismo para alumnos Y admins (la distinción
-- admin/alumno es solo de la app, vía is_admin()), así que un REVOKE de
-- columna aplica a todos por igual — la consecuencia correcta es que
-- cambiar el campo `role` de CUALQUIER perfil (incluyendo promover a un
-- admin nuevo) deja de poder hacerse desde el cliente con la anon/authenticated
-- key, sin importar si quien llama es admin o no. Debe hacerse desde el
-- servidor con la service_role key (que ignora RLS y grants) — ej. un
-- script de setup, o un endpoint admin en la Parte E.

revoke update on public.profiles from authenticated;
grant update (nombre) on public.profiles to authenticated;
