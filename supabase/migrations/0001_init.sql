-- 0001_init.sql — Alimenta Tu Fertilidad, plataforma de cursos
-- Esquema inicial completo: tablas, restricciones, índices y RLS.
-- Corresponde al "Modelo de datos" descrito en docs/cursos.md.
--
-- Cómo aplicarlo:
--   Opción A (recomendada): Supabase Dashboard → SQL Editor → pegar y ejecutar (Run).
--   Opción B: Supabase CLI → `supabase db push` (si usas migraciones versionadas con la CLI).

-- ============================================================
-- EXTENSIONES
-- ============================================================
create extension if not exists "pgcrypto"; -- para gen_random_uuid()

-- ============================================================
-- PROFILES — perfil de cada usuario (extiende auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  role text not null default 'alumno' check (role in ('admin', 'alumno')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Se crea automáticamente un profile al registrarse un usuario nuevo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre)
  values (new.id, new.raw_user_meta_data ->> 'nombre');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper para chequear rol admin sin causar recursión de RLS en profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles: usuario ve su propio perfil"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles: usuario edita su propio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: admin gestiona todos los perfiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- COURSES — cursos
-- ============================================================
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  subtitulo_corto text,
  promesa_principal text,
  descripcion text,
  precio integer not null default 0,          -- CLP, sin decimales
  precio_original integer,                     -- opcional, para mostrar descuento tachado
  estado text not null default 'borrador'
    check (estado in ('borrador', 'publicado', 'despublicado', 'archivado')),
  cover_image_url text,
  background_image_url text,
  accent_color text,
  para_quien_es text,
  para_quien_no_es text,
  que_vas_a_aprender jsonb not null default '[]'::jsonb,  -- lista de bullets (strings)
  requisitos text,
  faq jsonb not null default '[]'::jsonb,                  -- lista de {pregunta, respuesta}
  testimonios jsonb default '[]'::jsonb,                   -- lista opcional
  seo_titulo text,
  seo_descripcion text,
  seo_og_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index courses_estado_idx on public.courses (estado);

alter table public.courses enable row level security;

create policy "courses: público ve cursos publicados"
  on public.courses for select
  using (estado = 'publicado' or public.is_admin());

create policy "courses: admin gestiona cursos"
  on public.courses for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- LEADS — captura de email (no bloqueante) tras ver la clase gratis
-- ============================================================
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  course_id uuid references public.courses (id) on delete set null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  captured_at timestamptz not null default now()
);

create index leads_course_id_idx on public.leads (course_id);

alter table public.leads enable row level security;

create policy "leads: cualquiera puede dejar su email"
  on public.leads for insert
  with check (true);

create policy "leads: solo admin lee los leads"
  on public.leads for select
  using (public.is_admin());

-- ============================================================
-- COURSE_VIDEOS — clases de cada curso
-- ============================================================
create table public.course_videos (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  orden integer not null,
  titulo text not null,
  vimeo_id text,                              -- columna sensible, ver GRANT más abajo
  is_free_intro boolean not null default false,
  duracion integer,                           -- segundos
  estado_procesamiento text not null default 'subiendo'
    check (estado_procesamiento in ('subiendo', 'procesando', 'listo')),
  resources jsonb default '[]'::jsonb,        -- PDFs/guías (URLs de Supabase Storage)
  created_at timestamptz not null default now(),

  constraint course_videos_course_orden_unique unique (course_id, orden)
);

-- Nunca más de 1 clase gratis por curso (pero permite 0).
create unique index course_videos_one_free_intro_per_course
  on public.course_videos (course_id)
  where is_free_intro;

create index course_videos_course_id_idx on public.course_videos (course_id);

alter table public.course_videos enable row level security;

create policy "course_videos: filas visibles si el curso es visible"
  on public.course_videos for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.courses c
      where c.id = course_videos.course_id and c.estado = 'publicado'
    )
  );

create policy "course_videos: admin gestiona clases"
  on public.course_videos for all
  using (public.is_admin())
  with check (public.is_admin());

-- Protección de columna: el RLS de arriba controla FILAS, no columnas.
-- El vimeo_id NUNCA se entrega a anon/authenticated directamente:
-- se revocan todos los privilegios de columna por defecto y se otorga
-- SELECT solo sobre las columnas no sensibles. El endpoint server-side
-- (que usa la service_role key, la cual ignora RLS y grants) es el único
-- que puede leer vimeo_id, después de validar acceso.
revoke select on public.course_videos from anon, authenticated;
grant select (
  id, course_id, orden, titulo, is_free_intro,
  duracion, estado_procesamiento, resources, created_at
) on public.course_videos to anon, authenticated;

-- ============================================================
-- PURCHASES — compras
-- ============================================================
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  monto integer not null,
  moneda text not null default 'CLP',
  proveedor_pago text not null check (proveedor_pago in ('flow', 'stripe', 'manual')),
  id_transaccion text,                        -- NULL si proveedor_pago = 'manual'
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'pagado', 'fallido', 'reembolsado', 'revocado')),
  otorgado_por uuid references public.profiles (id),  -- admin, solo si manual
  fecha timestamptz not null default now(),

  constraint purchases_proveedor_transaccion_unique unique (proveedor_pago, id_transaccion)
);

-- Evita doble cobro del mismo curso: solo puede haber 1 fila "pagado" por (user, curso).
create unique index purchases_one_paid_per_user_course
  on public.purchases (user_id, course_id)
  where estado = 'pagado';

create index purchases_user_course_idx on public.purchases (user_id, course_id);

alter table public.purchases enable row level security;

create policy "purchases: usuario ve sus propias compras"
  on public.purchases for select
  using (auth.uid() = user_id or public.is_admin());

-- Sin policies de insert/update/delete para anon/authenticated:
-- todo write pasa por el servidor con la service_role key (webhooks,
-- checkout, otorgar/revocar acceso manual desde el admin), nunca desde el cliente.
create policy "purchases: admin gestiona accesos manuales"
  on public.purchases for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- PAYMENT_WEBHOOK_EVENTS — log crudo de webhooks de pago
-- ============================================================
create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  proveedor text not null check (proveedor in ('flow', 'stripe')),
  payload jsonb not null,
  firma text,
  recibido_en timestamptz not null default now(),
  procesado boolean not null default false
);

alter table public.payment_webhook_events enable row level security;
-- Sin policies: solo la service_role key (servidor) puede leer/escribir esta tabla.

-- ============================================================
-- VIDEO_NOTES — notas personales del alumno por clase (se sobrescribe)
-- ============================================================
create table public.video_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.course_videos (id) on delete cascade,
  contenido text,
  actualizado_en timestamptz not null default now(),

  constraint video_notes_user_video_unique unique (user_id, video_id)
);

alter table public.video_notes enable row level security;

create policy "video_notes: cada alumno gestiona sus propias notas"
  on public.video_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- LESSON_PROGRESS — avance de cada alumno por clase
-- ============================================================
create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.course_videos (id) on delete cascade,
  progress_seconds integer not null default 0,
  completed boolean not null default false,
  actualizado_en timestamptz not null default now(),

  primary key (user_id, video_id)
);

alter table public.lesson_progress enable row level security;

create policy "lesson_progress: cada alumno gestiona su propio avance"
  on public.lesson_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- ANALYTICS_EVENTS — eventos livianos del funnel
-- ============================================================
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  evento text not null,  -- landing_viewed, free_class_watched, checkout_started, purchase_completed, etc.
  user_id uuid references public.profiles (id) on delete set null,
  course_id uuid references public.courses (id) on delete set null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  "timestamp" timestamptz not null default now()
);

create index analytics_events_course_id_idx on public.analytics_events (course_id);

alter table public.analytics_events enable row level security;

create policy "analytics_events: cualquiera puede registrar un evento"
  on public.analytics_events for insert
  with check (true);

create policy "analytics_events: solo admin lee los eventos"
  on public.analytics_events for select
  using (public.is_admin());
