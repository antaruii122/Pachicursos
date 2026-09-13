"use server";

import { createClient } from "@/lib/supabase/server";
import { getVimeoTranscodeStatus } from "@/lib/vimeo";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Requiere rol admin");

  return supabase;
}

export async function addClase(
  courseId: string,
  titulo: string,
  esGratis: boolean,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();

    const { data: existentes } = await supabase
      .from("course_videos")
      .select("orden")
      .eq("course_id", courseId)
      .order("orden", { ascending: false })
      .limit(1);
    const siguienteOrden = (existentes?.[0]?.orden ?? 0) + 1;

    if (esGratis) {
      // Solo puede haber 1 clase gratis por curso (índice único parcial en 0001).
      // Se desmarca la anterior antes de insertar para no chocar con esa constraint.
      await supabase
        .from("course_videos")
        .update({ is_free_intro: false })
        .eq("course_id", courseId)
        .eq("is_free_intro", true);
    }

    const { error } = await supabase.from("course_videos").insert({
      course_id: courseId,
      titulo,
      orden: siguienteOrden,
      is_free_intro: esGratis,
      estado_procesamiento: "subiendo",
    });
    if (error) throw error;

    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function setClaseGratis(
  courseId: string,
  claseId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();

    await supabase
      .from("course_videos")
      .update({ is_free_intro: false })
      .eq("course_id", courseId)
      .eq("is_free_intro", true);

    const { error } = await supabase
      .from("course_videos")
      .update({ is_free_intro: true })
      .eq("id", claseId);
    if (error) throw error;

    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

// Swap con un valor temporal negativo: evita chocar con la constraint
// UNIQUE(course_id, orden) a mitad de camino (Postgres la chequea por
// statement, no al final de la transacción).
export async function swapClaseOrden(
  courseId: string,
  idA: string,
  ordenA: number,
  idB: string,
  ordenB: number,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();

    const paso1 = await supabase.from("course_videos").update({ orden: -1 }).eq("id", idA);
    if (paso1.error) throw paso1.error;

    const paso2 = await supabase.from("course_videos").update({ orden: ordenA }).eq("id", idB);
    if (paso2.error) throw paso2.error;

    const paso3 = await supabase.from("course_videos").update({ orden: ordenB }).eq("id", idA);
    if (paso3.error) throw paso3.error;

    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

// Alternativa a subir el archivo desde acá (hallazgo 2026-09-14: el token de
// Vimeo sin scope "upload" bloqueaba la subida en el momento en que Ricardo
// más la necesitaba). El admin sube el video directo en vimeo.com con su
// cuenta normal — eso nunca pasó por nuestra API, así que el scope "upload"
// no importa — y acá solo pega el link. Esto sí necesita el token, pero solo
// para LEER datos del video (transcode.status/duration), un permiso distinto
// del que falta.
export async function attachVimeoVideo(
  courseId: string,
  claseId: string,
  vimeoUrlOrId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();

    const match = vimeoUrlOrId.trim().match(/(\d{6,})/);
    if (!match) {
      return { error: "No se encontró un ID de video de Vimeo en lo que pegaste. Copiá el link completo de la página del video en vimeo.com." };
    }
    const vimeoId = match[1];

    let info;
    try {
      info = await getVimeoTranscodeStatus(vimeoId);
    } catch {
      return {
        error: "No se pudo encontrar ese video en la cuenta de Vimeo conectada. Confirmá que lo subiste con la misma cuenta y que el link es correcto.",
      };
    }

    const { error } = await supabase
      .from("course_videos")
      .update({
        vimeo_id: vimeoId,
        estado_procesamiento: info.status === "complete" ? "listo" : "procesando",
        ...(info.durationSeconds ? { duracion: info.durationSeconds } : {}),
      })
      .eq("id", claseId);
    if (error) throw error;

    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function deleteClase(
  courseId: string,
  claseId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("course_videos").delete().eq("id", claseId);
    if (error) throw error;
    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
