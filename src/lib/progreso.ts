import type { SupabaseClient } from "@supabase/supabase-js";

// Extraído de cuenta/mis-cursos/page.tsx (2026-09-14) para que el nuevo
// resumen de /cuenta/perfil use exactamente los mismos números reales de
// progreso, en vez de duplicar esta lógica en dos lugares.
export interface CursoConProgreso {
  courseId: string;
  slug: string;
  titulo: string;
  coverImageUrl: string | null;
  totalClases: number;
  clasesCompletadas: number;
  siguienteOrden: number;
}

export async function calcularProgreso(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  slug: string,
  titulo: string,
  coverImageUrl: string | null,
): Promise<CursoConProgreso> {
  const { data: clases } = await supabase
    .from("course_videos")
    .select("id, orden")
    .eq("course_id", courseId)
    .order("orden", { ascending: true });

  const claseIds = (clases ?? []).map((c) => c.id);
  let clasesCompletadas = 0;
  let siguienteOrden = clases?.[0]?.orden ?? 1;

  if (claseIds.length > 0) {
    const { data: progreso } = await supabase
      .from("lesson_progress")
      .select("video_id, completed, actualizado_en")
      .eq("user_id", userId)
      .in("video_id", claseIds);

    clasesCompletadas = (progreso ?? []).filter((p) => p.completed).length;

    const masReciente = (progreso ?? []).sort(
      (a, b) => new Date(b.actualizado_en).getTime() - new Date(a.actualizado_en).getTime(),
    )[0];
    if (masReciente) {
      const clase = clases?.find((c) => c.id === masReciente.video_id);
      if (clase) siguienteOrden = clase.orden;
    }
  }

  return {
    courseId,
    slug,
    titulo,
    coverImageUrl,
    totalClases: claseIds.length,
    clasesCompletadas,
    siguienteOrden,
  };
}

export async function cursosConProgresoDelUsuario(
  supabase: SupabaseClient,
  userId: string,
): Promise<CursoConProgreso[]> {
  const { data: purchasesRaw } = await supabase
    .from("purchases")
    .select("course_id, courses(id, slug, titulo, cover_image_url)")
    .eq("user_id", userId)
    .eq("estado", "pagado");

  const cursosComprados = (purchasesRaw ?? [])
    .map((p) => (Array.isArray(p.courses) ? p.courses[0] : p.courses))
    .filter((c): c is { id: string; slug: string; titulo: string; cover_image_url: string | null } => !!c);

  return Promise.all(
    cursosComprados.map((c) =>
      calcularProgreso(supabase, userId, c.id, c.slug, c.titulo, c.cover_image_url),
    ),
  );
}
