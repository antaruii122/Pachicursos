import { CourseForm } from "@/components/admin/CourseForm";
import { createClient } from "@/lib/supabase/server";
import { Course } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function EditarCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, slug, titulo, subtitulo_corto, promesa_principal, descripcion, precio, precio_original, estado, cover_image_url, background_image_url, para_quien_es, para_quien_no_es, que_vas_a_aprender, requisitos, faq, testimonios, seo_titulo, seo_descripcion",
    )
    .eq("id", id)
    .maybeSingle();
  if (!course) notFound();

  const { data: clases } = await supabase
    .from("course_videos")
    .select("estado_procesamiento")
    .eq("course_id", id);

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold text-[var(--vino)]">
        Editar curso
      </h1>
      <CourseForm initialCourse={course as Course} clases={clases ?? []} />
    </div>
  );
}
