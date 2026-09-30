-- 0006_course_modules.sql
--
-- Pedido de Ricardo (2026-09-30): "¿puedo hacer módulos y ahí tener clases?"
-- Hasta ahora las clases de un curso eran una sola lista plana ordenada por
-- `orden`. Se agregan módulos como agrupación OPCIONAL:
--   - un curso sin módulos sigue funcionando exactamente igual que antes;
--   - una clase sin módulo (`module_id` null) se muestra antes que los
--     módulos (típicamente "Bienvenida").
--
-- Decisión: `course_videos.orden` sigue siendo el número de clase global del
-- curso (es el `n` de la URL /cursos/[slug]/clase/[n] y lo que ve la alumna
-- como "Clase 5"). Para que ese número siempre coincida con el orden visual
-- agrupado por módulo, cada cambio de módulos/asignación llama a
-- `normalizar_orden_clases`, que renumera 1..N en el orden
-- (sin módulo primero, luego módulo.orden, luego orden anterior).
-- El avance (`lesson_progress`) y las notas van por `video_id`, no por
-- `orden`, así que renumerar nunca pierde datos de alumnas.

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  orden integer not null,
  titulo text not null,
  created_at timestamptz not null default now(),

  constraint course_modules_course_orden_unique unique (course_id, orden)
);

create index course_modules_course_id_idx on public.course_modules (course_id);

alter table public.course_modules enable row level security;

-- Misma visibilidad que course_videos (0004): admin, curso publicado, o
-- alumna con compra pagada aunque el curso se haya despublicado después.
create policy "course_modules: visibles si el curso es visible o comprado"
  on public.course_modules for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.courses c
      where c.id = course_modules.course_id
        and (
          c.estado = 'publicado'
          or exists (
            select 1 from public.purchases p
            where p.course_id = c.id
              and p.user_id = auth.uid()
              and p.estado = 'pagado'
          )
        )
    )
  );

create policy "course_modules: admin gestiona módulos"
  on public.course_modules for all
  using (public.is_admin())
  with check (public.is_admin());

-- Borrar un módulo NO borra sus clases: quedan "sin módulo".
alter table public.course_videos
  add column if not exists module_id uuid references public.course_modules (id) on delete set null;

create index if not exists course_videos_module_id_idx on public.course_videos (module_id);

-- 0001 revocó SELECT de tabla en course_videos y lo otorgó columna por
-- columna (para esconder vimeo_id). Una columna nueva NO queda incluida
-- automáticamente — sin este grant, cualquier SELECT de module_id desde el
-- cliente falla con "permission denied".
grant select (module_id) on public.course_videos to anon, authenticated;

create or replace function public.normalizar_orden_clases(p_course_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Requiere rol admin';
  end if;

  -- Paso 1 a negativos para no chocar con UNIQUE(course_id, orden) a mitad
  -- de camino (mismo truco que swapClaseOrden en el código).
  with nuevo as (
    select v.id,
           row_number() over (
             order by (v.module_id is not null), m.orden nulls first, v.orden
           ) as rn
    from public.course_videos v
    left join public.course_modules m on m.id = v.module_id
    where v.course_id = p_course_id
  )
  update public.course_videos v
     set orden = -nuevo.rn
    from nuevo
   where v.id = nuevo.id;

  update public.course_videos
     set orden = -orden
   where course_id = p_course_id;
end;
$$;

grant execute on function public.normalizar_orden_clases(uuid) to authenticated;
