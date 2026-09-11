import { createClient } from "@/lib/supabase/server";
import { createVimeoTusUpload } from "@/lib/vimeo";
import { NextResponse } from "next/server";

// Genera una URL de subida TUS para una clase existente. El archivo viaja
// directo navegador → Vimeo (nunca pasa por acá); este endpoint solo pide el
// link firmado, validando ANTES que quien lo pide es admin (no solo que
// tiene sesión activa) — ver docs/cursos.md, sección Vimeo y CLAUDE.md.
export async function POST(request: Request) {
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

  const body = await request.json();
  const { video_id, filename, filesize } = body as {
    video_id?: string;
    filename?: string;
    filesize?: number;
  };
  if (!video_id || !filename || !filesize) {
    return NextResponse.json({ error: "Faltan video_id, filename o filesize" }, { status: 400 });
  }

  const { data: clase } = await supabase
    .from("course_videos")
    .select("id")
    .eq("id", video_id)
    .single();
  if (!clase) {
    return NextResponse.json({ error: "La clase no existe" }, { status: 404 });
  }

  try {
    const { vimeoId, uploadLink } = await createVimeoTusUpload(filename, filesize);

    // La policy "course_videos: admin gestiona clases" (0001_init.sql)
    // permite este update porque quien llama ya se validó como admin arriba.
    const { error: updateError } = await supabase
      .from("course_videos")
      .update({ vimeo_id: vimeoId, estado_procesamiento: "subiendo" })
      .eq("id", video_id);
    if (updateError) throw updateError;

    return NextResponse.json({ uploadLink, vimeoId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
