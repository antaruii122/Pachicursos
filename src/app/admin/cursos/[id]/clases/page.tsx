import { ClaseManager } from "@/components/admin/ClaseManager";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ClasesCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("id, titulo").eq("id", id).maybeSingle();
  if (!course) notFound();

  const [{ data: clases }, { data: modulos }] = await Promise.all([
    supabase
      .from("course_videos")
      .select("id, orden, titulo, duracion, is_free_intro, estado_procesamiento, module_id, resources")
      .eq("course_id", id)
      .order("orden", { ascending: true }),
    supabase.from("course_modules").select("id, orden, titulo").eq("course_id", id),
  ]);

  return (
    <div>
      <Link
        href={`/admin/cursos/${id}/editar`}
        className="mb-4 inline-block text-[.85rem] text-[var(--tinta-suave)] hover:text-[var(--vino)]"
      >
        ← {course.titulo}
      </Link>
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold text-[var(--vino)]">
        Clases de &quot;{course.titulo}&quot;
      </h1>
      <ClaseManager courseId={id} clases={clases ?? []} modulos={modulos ?? []} />
    </div>
  );
}
