import { createClient } from "@/lib/supabase/server";
import { getVimeoTranscodeStatus } from "@/lib/vimeo";
import { NextResponse } from "next/server";

// Parte D: Vimeo no tiene webhook de fin de transcoding (ver docs/cursos.md,
// corrección 2026-09-11) — el admin, mientras tiene la página abierta, hace
// polling a este endpoint hasta que el estado quede "listo" (decisión
// confirmada con Ricardo). `videoId` acá es el id de la fila course_videos,
// no el vimeo_id.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Requiere rol admin" }, { status: 403 });
  }

  const { data: clase } = await supabase
    .from("course_videos")
    .select("id, vimeo_id, estado_procesamiento")
    .eq("id", videoId)
    .single();
  if (!clase) {
    return NextResponse.json({ error: "La clase no existe" }, { status: 404 });
  }

  // Ya está listo, o no hay vimeo_id todavía: no hace falta llamar a Vimeo.
  if (clase.estado_procesamiento === "listo" || !clase.vimeo_id) {
    return NextResponse.json({ estado_procesamiento: clase.estado_procesamiento });
  }

  try {
    const { status: transcodeStatus, durationSeconds } = await getVimeoTranscodeStatus(clase.vimeo_id);

    if (transcodeStatus === "complete") {
      await supabase
        .from("course_videos")
        .update({ estado_procesamiento: "listo", duracion: durationSeconds })
        .eq("id", videoId);
      return NextResponse.json({ estado_procesamiento: "listo" });
    }

    if (transcodeStatus === "error") {
      return NextResponse.json({
        estado_procesamiento: clase.estado_procesamiento,
        transcodeError: true,
      });
    }

    // "in_progress": nos aseguramos de que quede en "procesando" (la subida
    // ya terminó si estamos consultando esto) y seguimos esperando.
    if (clase.estado_procesamiento !== "procesando") {
      await supabase
        .from("course_videos")
        .update({ estado_procesamiento: "procesando" })
        .eq("id", videoId);
    }
    return NextResponse.json({ estado_procesamiento: "procesando" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
