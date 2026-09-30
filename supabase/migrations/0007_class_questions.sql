-- 0007_class_questions.sql
--
-- "Preguntas de la clase" (pedido de Ricardo 2026-09-30: foro por clase).
-- Modelo inspirado en lo que hacen Teachable (comentarios por lección,
-- admin responde desde un panel central) y Hotmart Club (moderación con
-- ocultar, "responder como persona" = el equipo responde con una identidad
-- fija), adaptado a una comunidad chica y a un tema de salud sensible:
--   - pregunta + respuestas de UN nivel (sin hilos infinitos);
--   - se publica al instante (sin cola de aprobación), el admin puede ocultar;
--   - la alumna aparece como "Nombre I." (nunca el correo);
--   - las respuestas del equipo se marcan "Equipo docente".
--
-- Seguridad: el nombre visible, la marca de equipo, el curso y el estado
-- "oculto" los fija un TRIGGER en la base (no el cliente), así nadie puede
-- hacerse pasar por el equipo docente llamando la API a mano.

create table public.class_questions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.course_videos (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.class_questions (id) on delete cascade,
  contenido text not null check (char_length(btrim(contenido)) between 1 and 2000),
  autor_nombre text not null default '',
  es_equipo boolean not null default false,
  oculto boolean not null default false,
  created_at timestamptz not null default now()
);

create index class_questions_video_idx on public.class_questions (video_id, created_at);
create index class_questions_course_idx on public.class_questions (course_id, created_at desc);
create index class_questions_parent_idx on public.class_questions (parent_id);

-- ¿Puede el usuario actual participar en las preguntas de esta clase?
-- (clase gratis con sesión iniciada, compra pagada del curso, o admin)
create or replace function public.puede_ver_clase(p_video_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin()
    or exists (
      select 1 from public.course_videos v
      where v.id = p_video_id
        and (
          (v.is_free_intro and auth.uid() is not null)
          or exists (
            select 1 from public.purchases p
            where p.course_id = v.course_id
              and p.user_id = auth.uid()
              and p.estado = 'pagado'
          )
        )
    );
$$;

create or replace function public.class_questions_antes_de_insertar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text;
  v_padre public.class_questions;
begin
  new.user_id := auth.uid();
  if new.user_id is null then
    raise exception 'Debes iniciar sesión';
  end if;

  select course_id into new.course_id from public.course_videos where id = new.video_id;
  if new.course_id is null then
    raise exception 'Clase no encontrada';
  end if;

  -- Una respuesta tiene que ser a una pregunta (no a otra respuesta) de la
  -- misma clase: un solo nivel.
  if new.parent_id is not null then
    select * into v_padre from public.class_questions where id = new.parent_id;
    if v_padre.id is null or v_padre.parent_id is not null or v_padre.video_id <> new.video_id then
      raise exception 'Respuesta inválida';
    end if;
  end if;

  new.es_equipo := public.is_admin();
  new.oculto := false;
  new.created_at := now();

  -- "Camila T." — nunca el correo.
  select nullif(btrim(nombre), '') into v_nombre from public.profiles where id = new.user_id;
  if new.es_equipo then
    new.autor_nombre := 'Equipo docente';
  elsif v_nombre is null then
    new.autor_nombre := 'Alumna';
  else
    new.autor_nombre := split_part(v_nombre, ' ', 1)
      || case when split_part(v_nombre, ' ', 2) <> '' then ' ' || upper(left(split_part(v_nombre, ' ', 2), 1)) || '.' else '' end;
  end if;
  return new;
end;
$$;

create trigger class_questions_antes_de_insertar
  before insert on public.class_questions
  for each row execute function public.class_questions_antes_de_insertar();

alter table public.class_questions enable row level security;

create policy "class_questions: ver si tiene acceso a la clase"
  on public.class_questions for select
  using (public.is_admin() or (not oculto and public.puede_ver_clase(video_id)));

create policy "class_questions: publicar si tiene acceso a la clase"
  on public.class_questions for insert
  with check (public.puede_ver_clase(video_id));

-- Solo el admin modera (ocultar/mostrar).
create policy "class_questions: admin modera"
  on public.class_questions for update
  using (public.is_admin())
  with check (public.is_admin());

-- Cada una puede borrar lo suyo; el admin, cualquier cosa.
create policy "class_questions: borrar lo propio o admin"
  on public.class_questions for delete
  using (auth.uid() = user_id or public.is_admin());
