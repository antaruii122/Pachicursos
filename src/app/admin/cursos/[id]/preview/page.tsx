import { CourseLanding } from "@/components/CourseLanding";
import { createClient } from "@/lib/supabase/server";
import { ClaseResumen, Course } from "@/lib/types";
import { notFound } from "next/navigation";

// Vista previa: misma plantilla que la landing pública (nunca un diseño
// ad-hoc), pero funciona sin importar el estado del curso — solo accesible
// dentro de /admin, ya protegido por el layout.
export default async function PreviewCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, slug, titulo, subtitulo_corto, promesa_principal, descripcion, precio, precio_original, estado, cover_image_url, background_image_url, para_quien_es, para_quien_no_es, que_vas_a_aprender, requisitos, faq, testimonios",
    )
    .eq("id", id)
    .maybeSingle();
  if (!course) notFound();

  const { data: clases } = await supabase
    .from("course_videos")
    .select("id, orden, titulo, duracion, is_free_intro, estado_procesamiento")
    .eq("course_id", id)
    .order("orden", { ascending: true });

  return (
    <div>
      <div className="bg-[var(--dorado)] py-2 text-center font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--vino)]">
        Vista previa — así se ve la landing pública (estado actual: {course.estado})
      </div>
      <CourseLanding course={course as Course} clases={(clases ?? []) as ClaseResumen[]} />
    </div>
  );
}
