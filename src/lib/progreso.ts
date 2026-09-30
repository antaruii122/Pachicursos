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

// ---------------------------------------------------------------------------
// Mi Campus (plan 2026-09-30, Paso 2): mismo dato real de lesson_progress,
// pero desglosado por módulo y con la clase exacta para "Continúa donde
// quedaste" — la pantalla 2 de la maqueta necesita las dos cosas.

export interface ModuloProgreso {
  id: string | null; // null = clases sin módulo
  numero: number | null;
  titulo: string;
  total: number;
  completadas: number;
  primeraOrden: number | null; // para enlazar la fila del módulo a su primera clase
}

export interface CursoCampus {
  courseId: string;
  slug: string;
  titulo: string;
  coverImageUrl: string | null;
  totalClases: number;
  clasesCompletadas: number;
  modulos: ModuloProgreso[];
  tieneModulos: boolean;
  // Lista de clases (para el curso SIN módulos: Mi Campus muestra cada clase
  // con su check en vez de una sola fila "Todas las clases").
  clases: { orden: number; titulo: string; duracion: number | null; completada: boolean }[];
  siguiente: { orden: number; titulo: string; moduloTitulo: string | null; moduloNumero: number | null } | null;
  ultimaActividad: number; // epoch ms, 0 si nunca empezó
}

export async function campusDelUsuario(supabase: SupabaseClient, userId: string): Promise<CursoCampus[]> {
  const { data: purchasesRaw } = await supabase
    .from("purchases")
    .select("course_id, courses(id, slug, titulo, cover_image_url)")
    .eq("user_id", userId)
    .eq("estado", "pagado");

  const cursos = (purchasesRaw ?? [])
    .map((p) => (Array.isArray(p.courses) ? p.courses[0] : p.courses))
    .filter((c): c is { id: string; slug: string; titulo: string; cover_image_url: string | null } => !!c);
  if (cursos.length === 0) return [];

  const ids = cursos.map((c) => c.id);
  const [{ data: clases }, { data: modulos }] = await Promise.all([
    supabase
      .from("course_videos")
      .select("id, course_id, orden, titulo, module_id, duracion")
      .in("course_id", ids)
      .order("orden", { ascending: true }),
    supabase.from("course_modules").select("id, course_id, orden, titulo").in("course_id", ids),
  ]);

  const claseIds = (clases ?? []).map((c) => c.id);
  const { data: progreso } = claseIds.length
    ? await supabase
        .from("lesson_progress")
        .select("video_id, completed, actualizado_en")
        .eq("user_id", userId)
        .in("video_id", claseIds)
    : { data: [] as { video_id: string; completed: boolean; actualizado_en: string }[] };

  const progresoPorClase = new Map((progreso ?? []).map((p) => [p.video_id, p]));

  return cursos
    .map((curso) => {
      const clasesCurso = (clases ?? []).filter((c) => c.course_id === curso.id);
      const modsCurso = (modulos ?? [])
        .filter((m) => m.course_id === curso.id)
        .sort((a, b) => a.orden - b.orden);
      const numeroModulo = new Map(modsCurso.map((m, i) => [m.id, i + 1]));
      const hecha = (id: string) => !!progresoPorClase.get(id)?.completed;

      const grupos: ModuloProgreso[] = [];
      const sueltas = clasesCurso.filter((c) => !c.module_id || !numeroModulo.has(c.module_id));
      if (sueltas.length > 0) {
        grupos.push({
          id: null,
          numero: null,
          titulo: modsCurso.length > 0 ? "Introducción" : "Todas las clases",
          total: sueltas.length,
          completadas: sueltas.filter((c) => hecha(c.id)).length,
          primeraOrden: sueltas[0]?.orden ?? null,
        });
      }
      for (const m of modsCurso) {
        const delModulo = clasesCurso.filter((c) => c.module_id === m.id);
        grupos.push({
          id: m.id,
          numero: numeroModulo.get(m.id) ?? null,
          titulo: m.titulo,
          total: delModulo.length,
          completadas: delModulo.filter((c) => hecha(c.id)).length,
          primeraOrden: delModulo[0]?.orden ?? null,
        });
      }

      // Siguiente clase: la de actividad más reciente si no está terminada;
      // si ya la terminó, la primera pendiente después de ella; si nunca
      // empezó, la primera del curso.
      const conActividad = clasesCurso
        .filter((c) => progresoPorClase.has(c.id))
        .sort(
          (a, b) =>
            new Date(progresoPorClase.get(b.id)!.actualizado_en).getTime() -
            new Date(progresoPorClase.get(a.id)!.actualizado_en).getTime(),
        );
      const ultima = conActividad[0];
      let siguienteClase = clasesCurso[0];
      if (ultima) {
        siguienteClase = hecha(ultima.id)
          ? (clasesCurso.find((c) => c.orden > ultima.orden && !hecha(c.id)) ??
            clasesCurso.find((c) => !hecha(c.id)) ??
            ultima)
          : ultima;
      }
      const moduloSiguiente = siguienteClase?.module_id
        ? modsCurso.find((m) => m.id === siguienteClase.module_id)
        : undefined;

      return {
        courseId: curso.id,
        slug: curso.slug,
        titulo: curso.titulo,
        coverImageUrl: curso.cover_image_url,
        totalClases: clasesCurso.length,
        clasesCompletadas: clasesCurso.filter((c) => hecha(c.id)).length,
        modulos: grupos,
        tieneModulos: modsCurso.length > 0,
        clases: clasesCurso.map((c) => ({
          orden: c.orden,
          titulo: c.titulo,
          duracion: c.duracion ?? null,
          completada: hecha(c.id),
        })),
        siguiente: siguienteClase
          ? {
              orden: siguienteClase.orden,
              titulo: siguienteClase.titulo,
              moduloTitulo: moduloSiguiente?.titulo ?? null,
              moduloNumero: moduloSiguiente ? (numeroModulo.get(moduloSiguiente.id) ?? null) : null,
            }
          : null,
        ultimaActividad: ultima ? new Date(progresoPorClase.get(ultima.id)!.actualizado_en).getTime() : 0,
      };
    })
    .sort((a, b) => b.ultimaActividad - a.ultimaActividad);
}
