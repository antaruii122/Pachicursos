-- 0004_courses_purchased_visibility.sql
--
-- Bug encontrado al construir "Mis cursos": docs/cursos.md es explícito en
-- que "si un curso comprado se despublica después, sigue apareciendo normal
-- ahí y en su reproductor (sin candado ni aviso de error)". Pero las
-- policies de SELECT de 0001_init.sql para `courses` y `course_videos`
-- solo dejaban ver un curso si estado='publicado' o el que consulta es
-- admin — un alumno que compró un curso que después se despublica queda
-- bloqueado por RLS, tanto en "Mis cursos" como en el reproductor de clase
-- (bug ya existente ahí también, no solo en la pantalla nueva).
--
-- Fix: agregar "o el usuario tiene una compra pagada de este curso" a
-- ambas policies.

drop policy if exists "courses: público ve cursos publicados" on public.courses;
create policy "courses: público ve publicados, dueño ve lo que compró"
  on public.courses for select
  using (
    estado = 'publicado'
    or public.is_admin()
    or exists (
      select 1 from public.purchases p
      where p.course_id = courses.id
        and p.user_id = auth.uid()
        and p.estado = 'pagado'
    )
  );

drop policy if exists "course_videos: filas visibles si el curso es visible" on public.course_videos;
create policy "course_videos: filas visibles si el curso es visible o comprado"
  on public.course_videos for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.courses c
      where c.id = course_videos.course_id
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
