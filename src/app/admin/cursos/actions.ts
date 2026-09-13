"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CourseFormData {
  id?: string;
  slug: string;
  titulo: string;
  subtitulo_corto: string;
  promesa_principal: string;
  descripcion: string;
  precio: number;
  precio_original: number | null;
  para_quien_es: string;
  para_quien_no_es: string;
  que_vas_a_aprender: string[];
  requisitos: string;
  faq: { pregunta: string; respuesta: string }[];
  testimonios: { texto: string; autor: string }[];
  seo_titulo: string;
  seo_descripcion: string;
  cover_image_url: string;
  background_image_url: string;
  instructor_nombre: string;
  instructor_bio: string;
  instructor_foto_url: string;
}

// Defensa en profundidad: aunque las policies RLS de "courses" ya exigen
// is_admin() para escribir, cada server action vuelve a chequear el rol acá
// mismo antes de tocar nada — mismo criterio que los endpoints de Vimeo.
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

export async function saveCourse(
  data: CourseFormData,
): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await requireAdmin();

    const row = {
      slug: data.slug,
      titulo: data.titulo,
      subtitulo_corto: data.subtitulo_corto || null,
      promesa_principal: data.promesa_principal || null,
      descripcion: data.descripcion || null,
      precio: data.precio,
      precio_original: data.precio_original,
      para_quien_es: data.para_quien_es || null,
      para_quien_no_es: data.para_quien_no_es || null,
      que_vas_a_aprender: data.que_vas_a_aprender,
      requisitos: data.requisitos || null,
      faq: data.faq,
      testimonios: data.testimonios,
      seo_titulo: data.seo_titulo || null,
      seo_descripcion: data.seo_descripcion || null,
      cover_image_url: data.cover_image_url || null,
      background_image_url: data.background_image_url || null,
      updated_at: new Date().toISOString(),
      // instructor_nombre/instructor_bio/instructor_foto_url deliberadamente
      // NO están acá todavía: la migración 0005 que agrega esas columnas no
      // se corrió en el proyecto real. Incluirlas rompía el UPDATE entero
      // (columna inexistente = falla toda la fila, no solo esos 3 campos) —
      // encontrado en producción el 2026-09-14 justo después de deployar.
      // Reactivar en cuanto Ricardo confirme que corrió 0005.
    };

    if (data.id) {
      const { error } = await supabase.from("courses").update(row).eq("id", data.id);
      if (error) throw error;
      revalidatePath("/admin/cursos");
      revalidatePath(`/cursos/${data.slug}`);
      return { id: data.id };
    }

    const { data: inserted, error } = await supabase
      .from("courses")
      .insert({ ...row, estado: "borrador" })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/admin/cursos");
    return { id: inserted.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function setCourseEstado(
  id: string,
  estado: "borrador" | "publicado" | "despublicado" | "archivado",
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("courses").update({ estado }).eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/cursos");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export async function deleteCourse(id: string): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();

    // Nunca borrar un curso que ya tiene compras (reales o manuales): se
    // perdería el registro de venta/acceso. "Archivar" es la alternativa
    // no destructiva para eso.
    const { count } = await supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("course_id", id);
    if (count && count > 0) {
      return {
        error: "Este curso tiene compras registradas — no se puede borrar. Usá 'Archivar' en vez de borrar.",
      };
    }

    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/cursos");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
