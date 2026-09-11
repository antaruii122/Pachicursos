import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getVimeoEmbedUrl } from "@/lib/vimeo";
import { NextResponse } from "next/server";

// Núcleo de seguridad de la Parte D (ver docs/cursos.md): el vimeo_id NUNCA
// se entrega al cliente sin validar acceso primero. `videoId` es el id de
// la fila course_videos. El acceso se valida acá con el cliente normal
// (RLS + columnas públicas); solo después de aprobar se usa la
// service_role key para leer vimeo_id (columna bloqueada para
// anon/authenticated desde 0001_init.sql) y se pide el embed a Vimeo.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; videoId: string }> },
) {
  const { slug, videoId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!course) {
    return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  }

  const { data: clase } = await supabase
    .from("course_videos")
    .select("id, course_id, is_free_intro, estado_procesamiento")
    .eq("id", videoId)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!clase) {
    return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
  }

  let tieneAcceso = clase.is_free_intro;
  if (!tieneAcceso) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("estado", "pagado")
      .maybeSingle();
    tieneAcceso = !!purchase;
  }

  if (!tieneAcceso) {
    return NextResponse.json({ error: "No tenés acceso a esta clase" }, { status: 403 });
  }

  if (clase.estado_procesamiento !== "listo") {
    return NextResponse.json({ error: "El video todavía se está procesando" }, { status: 409 });
  }

  const admin = createServiceRoleClient();
  const { data: full } = await admin
    .from("course_videos")
    .select("vimeo_id")
    .eq("id", videoId)
    .single();
  if (!full?.vimeo_id) {
    return NextResponse.json({ error: "Esta clase todavía no tiene video subido" }, { status: 404 });
  }

  try {
    const embedUrl = await getVimeoEmbedUrl(full.vimeo_id);
    return NextResponse.json({ embedUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
