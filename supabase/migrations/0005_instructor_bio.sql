-- 0005_instructor_bio.sql
--
-- Gap encontrado por Ricardo (2026-09-14): la sección "Quién te enseña" de
-- la landing tenía el nombre/foto de Marcela hardcodeados directo en el
-- componente ("contenido fijo de marca, no por curso" — decisión original
-- de diseño), así que no había NINGÚN campo en el admin para cambiar su
-- foto. Se agrega acá mismo en `courses` (en vez de una tabla nueva de
-- "site settings") porque en la práctica hoy solo existe un curso a la vez
-- y esto evita una tabla/RLS nueva para un caso de uso mínimo.

alter table public.courses add column if not exists instructor_nombre text;
alter table public.courses add column if not exists instructor_bio text;
alter table public.courses add column if not exists instructor_foto_url text;
