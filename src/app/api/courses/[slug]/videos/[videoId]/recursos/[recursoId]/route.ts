import { parseRecursos } from "@/lib/recursos";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";

// Descarga de un material de clase. Mismo criterio de seguridad que el
// endpoint del player (Parte D): primero se valida acceso con el cliente
// normal (clase gratis, compra pagada, o admin); recién después se usa la
// service_role para firmar un link de 2 minutos al archivo del bucket
// PRIVADO `materiales`. Nunca existe una URL pública del archivo.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; videoId: string; recursoId: string }> },
) {
  const { slug, videoId, recursoId } = await params;
  const supabase = await createClient();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });
  if (!course) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

  const { data: clase, error: claseError } = await supabase
    .from("course_videos")
    .select("id, is_free_intro, resources")
    .eq("id", videoId)
    .eq("course_id", course.id)
    .maybeSingle();
  if (claseError) return NextResponse.json({ error: claseError.message }, { status: 500 });
  if (!clase) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });

  let tieneAcceso = clase.is_free_intro;
  if (!tieneAcceso) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(
        new URL(`/cuenta/login?next=${encodeURIComponent(`/cursos/${slug}`)}`, _request.url),
      );
    }
    const [{ data: purchase }, { data: profile }] = await Promise.all([
      supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .eq("estado", "pagado")
        .maybeSingle(),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);
    tieneAcceso = !!purchase || profile?.role === "admin";
  }
  if (!tieneAcceso) return NextResponse.json({ error: "No tienes acceso a esta clase" }, { status: 403 });

  const recurso = parseRecursos(clase.resources).find((r) => r.id === recursoId);
  if (!recurso) return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });

  if (recurso.url) {
    const destino = new URL(recurso.url);
    if (destino.protocol !== "https:" && destino.protocol !== "http:") {
      return NextResponse.json({ error: "Enlace inválido" }, { status: 400 });
    }
    return NextResponse.redirect(destino);
  }
  if (!recurso.path) return NextResponse.json({ error: "Material sin archivo" }, { status: 404 });

  const extension = recurso.path.split(".").pop();
  const nombreDescarga = recurso.nombre.toLowerCase().endsWith(`.${extension}`)
    ? recurso.nombre
    : `${recurso.nombre}.${extension}`;
  const { data, error } = await createServiceRoleClient()
    .storage.from("materiales")
    .createSignedUrl(recurso.path, 120, { download: recurso.tipo === "img" ? false : nombreDescarga });
  if (error || !data) {
    const noExiste = /not found/i.test(error?.message ?? "");
    return NextResponse.json(
      {
        error: noExiste
          ? "Este material ya no está disponible. Avísale al equipo para que lo vuelva a subir."
          : `No se pudo generar la descarga: ${error?.message ?? "error desconocido"}`,
      },
      { status: noExiste ? 404 : 502 },
    );
  }
  return NextResponse.redirect(data.signedUrl);
}
