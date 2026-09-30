"use server";

import { mensajeError } from "@/lib/errores";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Acciones de "Preguntas de la clase". Todo pasa por el cliente con la
// sesión de quien escribe: RLS decide si puede (acceso a la clase / admin) y
// el trigger fija autor, curso y marca de equipo — acá no se confía en nada
// que venga del navegador más allá del texto.

export async function publicarPregunta(
  videoId: string,
  contenido: string,
  parentId: string | null,
): Promise<{ ok: true } | { error: string }> {
  try {
    const texto = contenido.trim();
    if (!texto) return { error: "Escribe tu pregunta." };
    if (texto.length > 2000) return { error: "El texto es muy largo (máximo 2000 caracteres)." };
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Inicia sesión para preguntar." };
    const { error } = await supabase
      .from("class_questions")
      .insert({ video_id: videoId, contenido: texto, parent_id: parentId, user_id: user.id });
    if (error) {
      if (/row-level security/i.test(error.message)) return { error: "No tienes acceso a esta clase." };
      throw error;
    }
    revalidatePath("/cursos", "layout");
    revalidatePath("/admin/preguntas");
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

export async function borrarPregunta(id: string): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await createClient();
    const { error, count } = await supabase.from("class_questions").delete({ count: "exact" }).eq("id", id);
    if (error) throw error;
    if (!count) return { error: "No se pudo borrar (solo puedes borrar lo tuyo)." };
    revalidatePath("/cursos", "layout");
    revalidatePath("/admin/preguntas");
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

export async function ocultarPregunta(id: string, oculto: boolean): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await createClient();
    const { error, count } = await supabase.from("class_questions").update({ oculto }, { count: "exact" }).eq("id", id);
    if (error) throw error;
    if (!count) return { error: "Solo el equipo puede moderar." };
    revalidatePath("/cursos", "layout");
    revalidatePath("/admin/preguntas");
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}
