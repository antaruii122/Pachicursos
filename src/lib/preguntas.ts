import type { SupabaseClient } from "@supabase/supabase-js";

// "Preguntas de la clase" (0007_class_questions.sql). El nombre visible, la
// marca de equipo y el curso los fija un trigger en la base, nunca el cliente.
export interface Pregunta {
  id: string;
  video_id: string;
  course_id: string;
  user_id: string;
  parent_id: string | null;
  contenido: string;
  autor_nombre: string;
  es_equipo: boolean;
  oculto: boolean;
  created_at: string;
}

export interface Hilo extends Pregunta {
  respuestas: Pregunta[];
  respondida: boolean; // tiene al menos una respuesta del equipo docente
}

// Código Postgres de "la tabla no existe": el código puede deployarse antes de
// correr 0007 sin romper la página de la clase (lección del incidente
// 2026-09-14) — la sección simplemente no aparece hasta que exista la tabla.
export const TABLA_NO_EXISTE = "42P01";
export function esTablaFaltante(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === TABLA_NO_EXISTE || error.code === "PGRST205" || /class_questions/.test(error.message ?? "") && /does not exist|schema cache/i.test(error.message ?? ""));
}

export function armarHilos(filas: Pregunta[]): Hilo[] {
  const preguntas = filas.filter((f) => !f.parent_id);
  return preguntas
    .map((p) => {
      const respuestas = filas
        .filter((f) => f.parent_id === p.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      return { ...p, respuestas, respondida: respuestas.some((r) => r.es_equipo) };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** null = la función todavía no está activada (falta correr 0007). */
export async function preguntasDeClase(supabase: SupabaseClient, videoId: string): Promise<Hilo[] | null> {
  const { data, error } = await supabase
    .from("class_questions")
    .select("*")
    .eq("video_id", videoId)
    .order("created_at", { ascending: true });
  if (esTablaFaltante(error)) return null;
  if (error) throw new Error(`No se pudieron cargar las preguntas: ${error.message}`);
  return armarHilos((data ?? []) as Pregunta[]);
}

export function fechaRelativa(iso: string): string {
  const seg = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seg < 60) return "hace un momento";
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `hace ${d} día${d === 1 ? "" : "s"}`;
  return new Date(iso).toLocaleDateString("es-CL");
}
