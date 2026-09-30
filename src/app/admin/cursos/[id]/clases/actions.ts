"use server";

import { mensajeError } from "@/lib/errores";
import { parseRecursos, TAMANO_MAXIMO, tipoDesdeNombre, type Recurso } from "@/lib/recursos";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getVimeoTranscodeStatus, VimeoApiError } from "@/lib/vimeo";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  // getClaims verifica el JWT localmente (clave ES256), sin ir a Supabase Auth.
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) throw new Error("No autenticado");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role !== "admin") throw new Error("Requiere rol admin");

  return supabase;
}

export async function addClase(
  courseId: string,
  titulo: string,
  esGratis: boolean,
  moduloId: string | null = null,
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
      module_id: moduloId,
    });
    if (error) throw error;

    // Queda al final de su módulo, no al final del curso.
    if (moduloId) await normalizarOrden(supabase, courseId);

    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

type Supa = Awaited<ReturnType<typeof requireAdmin>>;

// Renumera `orden` 1..N para que el número de clase global coincida con el
// orden visual agrupado por módulo (ver 0006_course_modules.sql).
async function normalizarOrden(supabase: Supa, courseId: string) {
  const { error } = await supabase.rpc("normalizar_orden_clases", { p_course_id: courseId });
  if (error) throw error;
}

export async function addModulo(
  courseId: string,
  titulo: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();
    const { data: existentes } = await supabase
      .from("course_modules")
      .select("orden")
      .eq("course_id", courseId)
      .order("orden", { ascending: false })
      .limit(1);
    const { error } = await supabase.from("course_modules").insert({
      course_id: courseId,
      titulo,
      orden: (existentes?.[0]?.orden ?? 0) + 1,
    });
    if (error) throw error;
    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

export async function renameModulo(
  courseId: string,
  moduloId: string,
  titulo: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("course_modules").update({ titulo }).eq("id", moduloId);
    if (error) throw error;
    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

// Las clases del módulo NO se borran: quedan "sin módulo" (on delete set null).
export async function deleteModulo(
  courseId: string,
  moduloId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("course_modules").delete().eq("id", moduloId);
    if (error) throw error;
    await normalizarOrden(supabase, courseId);
    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

export async function swapModuloOrden(
  courseId: string,
  idA: string,
  ordenA: number,
  idB: string,
  ordenB: number,
): Promise<{ ok: true } | { error: string }> {
  let supabase: Supa | null = null;
  try {
    supabase = await requireAdmin();
    const paso1 = await supabase.from("course_modules").update({ orden: tempNegativo() }).eq("id", idA);
    if (paso1.error) throw paso1.error;
    const paso2 = await supabase.from("course_modules").update({ orden: ordenA }).eq("id", idB);
    if (paso2.error) throw paso2.error;
    const paso3 = await supabase.from("course_modules").update({ orden: ordenB }).eq("id", idA);
    if (paso3.error) throw paso3.error;
    await normalizarOrden(supabase, courseId);
    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    // Si quedó un módulo con orden temporal negativo, se ordena primero y se
    // ve raro pero no rompe nada; se reintenta devolviendo el mensaje real.
    if (supabase) await normalizarOrden(supabase, courseId).catch(() => {});
    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { error: `No se pudo mover el módulo: ${mensajeError(err)}. Intenta de nuevo.` };
  }
}

export async function setClaseModulo(
  courseId: string,
  claseId: string,
  moduloId: string | null,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();
    // Orden alto temporal para que la clase quede al final de su nuevo módulo
    // al normalizar (se renumera enseguida, nunca queda así).
    const { data: max } = await supabase
      .from("course_videos")
      .select("orden")
      .eq("course_id", courseId)
      .order("orden", { ascending: false })
      .limit(1);
    const { error } = await supabase
      .from("course_videos")
      .update({ module_id: moduloId, orden: (max?.[0]?.orden ?? 0) + 1 })
      .eq("id", claseId);
    if (error) throw error;
    await normalizarOrden(supabase, courseId);
    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
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
    return { error: mensajeError(err) };
  }
}

// Intercambia el orden de dos clases. Es en 3 pasos (Postgres chequea
// UNIQUE(course_id, orden) fila por fila), así que:
//  - el valor temporal es negativo y ÚNICO por llamada (antes era siempre -1:
//    dos clicks rápidos chocaban entre sí y una clase quedó con orden -1 en
//    producción — bug real 2026-09-30);
//  - si cualquier paso falla, se renumera todo el curso 1..N con
//    normalizar_orden_clases (atómica, en la base), así nunca queda un orden
//    negativo o con huecos, pase lo que pase.
function tempNegativo() {
  return -(100000 + Math.floor(Math.random() * 1_000_000_000));
}

export async function swapClaseOrden(
  courseId: string,
  idA: string,
  ordenA: number,
  idB: string,
  ordenB: number,
): Promise<{ ok: true } | { error: string }> {
  let supabase: Supa | null = null;
  try {
    supabase = await requireAdmin();

    const paso1 = await supabase.from("course_videos").update({ orden: tempNegativo() }).eq("id", idA);
    if (paso1.error) throw paso1.error;

    const paso2 = await supabase.from("course_videos").update({ orden: ordenA }).eq("id", idB);
    if (paso2.error) throw paso2.error;

    const paso3 = await supabase.from("course_videos").update({ orden: ordenB }).eq("id", idA);
    if (paso3.error) throw paso3.error;

    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    if (supabase) await normalizarOrden(supabase, courseId).catch(() => {});
    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { error: `No se pudo mover la clase: ${mensajeError(err)}. El orden quedó corregido; intenta de nuevo.` };
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
): Promise<{ ok: true; listo: boolean } | { error: string }> {
  try {
    const supabase = await requireAdmin();

    const match = vimeoUrlOrId.trim().match(/(\d{6,})/);
    if (!match) {
      return { error: "No se encontró un ID de video de Vimeo en lo que pegaste. Copia el link completo de la página del video en vimeo.com." };
    }
    const vimeoId = match[1];

    let info;
    try {
      info = await getVimeoTranscodeStatus(vimeoId);
    } catch (err) {
      if (err instanceof VimeoApiError && err.status === 429) {
        return {
          error: "Vimeo nos está limitando temporalmente por muchos pedidos seguidos (no tiene nada que ver con tu video). Espera un minuto y prueba de nuevo.",
        };
      }
      return {
        error: "No se pudo encontrar ese video en Vimeo. Confirma que el link es correcto y que el video es público (o está en la cuenta de Vimeo conectada).",
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
    return { ok: true, listo: info.status === "complete" };
  } catch (err) {
    return { error: mensajeError(err) };
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
    // Sin huecos en la numeración ("Clase 1, 2, 4" confunde a la alumna).
    await normalizarOrden(supabase, courseId);
    revalidatePath(`/admin/cursos/${courseId}/clases`);
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

// ---------------------------------------------------------------------------
// Materiales por clase (PDF/PPT/…) — pedido de Ricardo 2026-09-30.
// Los archivos pueden pesar decenas de MB (un PPT), más que el límite de
// body de una función serverless — así que el navegador sube DIRECTO a
// Storage con un link de subida de un solo uso que se genera acá, recién
// después de validar que quien pide es admin. El bucket es privado.

const BUCKET_MATERIALES = "materiales";

async function leerRecursos(supabase: Supa, claseId: string): Promise<Recurso[]> {
  const { data, error } = await supabase.from("course_videos").select("resources").eq("id", claseId).single();
  if (error) throw error;
  return parseRecursos(data?.resources);
}

async function guardarRecursos(supabase: Supa, courseId: string, claseId: string, recursos: Recurso[]) {
  const { error } = await supabase.from("course_videos").update({ resources: recursos }).eq("id", claseId);
  if (error) throw error;
  revalidatePath(`/admin/cursos/${courseId}/clases`);
}

export async function prepararSubidaMaterial(
  courseId: string,
  claseId: string,
  nombreArchivo: string,
  tamano: number,
): Promise<{ ok: true; path: string; token: string } | { error: string }> {
  try {
    await requireAdmin();
    if (tamano > TAMANO_MAXIMO) {
      return { error: "El archivo pesa más de 50 MB. Comprímelo o expórtalo a PDF e intenta de nuevo." };
    }
    const seguro = nombreArchivo
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .slice(-120);
    const path = `${courseId}/${claseId}/${crypto.randomUUID()}-${seguro}`;
    const { data, error } = await createServiceRoleClient()
      .storage.from(BUCKET_MATERIALES)
      .createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error("No se pudo preparar la subida");
    return { ok: true, path: data.path, token: data.token };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

export async function confirmarMaterial(
  courseId: string,
  claseId: string,
  material: { nombre: string; path: string; tamano: number },
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();
    // El path tiene que ser de ESTA clase (no se acepta uno arbitrario).
    if (!material.path.startsWith(`${courseId}/${claseId}/`)) return { error: "Archivo inválido" };
    const recursos = await leerRecursos(supabase, claseId);
    recursos.push({
      id: crypto.randomUUID(),
      nombre: material.nombre.trim() || "Material",
      tipo: tipoDesdeNombre(material.path),
      path: material.path,
      tamano: material.tamano,
    });
    await guardarRecursos(supabase, courseId, claseId, recursos);
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

export async function agregarEnlaceMaterial(
  courseId: string,
  claseId: string,
  nombre: string,
  url: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();
    let limpia: URL;
    try {
      limpia = new URL(url.trim());
    } catch {
      return { error: "Ese enlace no es válido. Pégalo completo, empezando con https://" };
    }
    if (limpia.protocol !== "https:" && limpia.protocol !== "http:") {
      return { error: "Solo se aceptan enlaces que empiecen con https://" };
    }
    const recursos = await leerRecursos(supabase, claseId);
    recursos.push({ id: crypto.randomUUID(), nombre: nombre.trim() || limpia.hostname, tipo: "link", url: limpia.toString() });
    await guardarRecursos(supabase, courseId, claseId, recursos);
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

export async function borrarMaterial(
  courseId: string,
  claseId: string,
  recursoId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await requireAdmin();
    const recursos = await leerRecursos(supabase, claseId);
    const recurso = recursos.find((r) => r.id === recursoId);
    if (!recurso) return { ok: true };
    // Primero se saca de la lista y DESPUÉS se borra el archivo: si algo corta
    // la acción a la mitad, queda a lo sumo un archivo huérfano invisible (y
    // privado), nunca un material listado cuyo archivo ya no existe (bug real
    // 2026-09-30: descarga rota en la clase gratis).
    await guardarRecursos(
      supabase,
      courseId,
      claseId,
      recursos.filter((r) => r.id !== recursoId),
    );
    if (recurso.path) {
      const { error } = await createServiceRoleClient().storage.from(BUCKET_MATERIALES).remove([recurso.path]);
      if (error) console.error("Material quitado de la lista pero el archivo no se pudo borrar:", recurso.path, error);
    }
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}
