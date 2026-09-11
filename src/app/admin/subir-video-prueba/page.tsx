import { VideoUploadWidget } from "@/components/VideoUploadWidget";
import { createClient } from "@/lib/supabase/server";

// Página de prueba mínima para validar el pipe de subida TUS (Parte C).
// No es el panel admin real (eso es la Parte E) — solo prueba que un admin
// puede subir un video a una clase del curso placeholder. La sesión+rol ya
// se valida en src/app/admin/layout.tsx, no hace falta repetirlo acá.
export default async function SubirVideoPruebaPage() {
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, titulo")
    .eq("slug", "placeholder-regula-tu-ciclo")
    .maybeSingle();

  const { data: clases } = course
    ? await supabase
        .from("course_videos")
        .select("id, orden, titulo")
        .eq("course_id", course.id)
        .order("orden", { ascending: true })
    : { data: null };

  return (
    <div>
      <h1 className="mb-2 font-[family-name:var(--font-heading)] text-[1.5rem] font-semibold text-[var(--vino)]">
        Subir video de prueba
      </h1>
      <p className="mb-6 text-sm text-[var(--tinta-suave)]">
        Prueba interna del pipe de subida TUS (curso: {course?.titulo ?? "—"}). No es el panel de
        administración final.
      </p>
      {clases && clases.length > 0 ? (
        <VideoUploadWidget clases={clases} />
      ) : (
        <p className="text-sm text-[var(--tinta-suave)]">
          No hay curso placeholder. Corré <code>npm run seed:placeholder</code>.
        </p>
      )}
    </div>
  );
}
