import { ClassPlayer } from "@/components/ClassPlayer";
import { mensajeError } from "@/lib/errores";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getVimeoEmbedUrl } from "@/lib/vimeo";

// Resuelve el embed de Vimeo en el servidor, dentro de un <Suspense>, para que
// el navegador no tenga que esperar a hidratar y luego pedirlo a /player (otro
// viaje completo con sus propias consultas). SOLO se renderiza cuando la
// página ya validó el acceso (clase gratis, compra pagada o admin) — mismo
// criterio que /api/courses/[slug]/videos/[videoId]/player. Al cliente solo
// llega la URL de embed final, nunca el vimeo_id.
export async function ClassPlayerServer({
  courseSlug,
  videoId,
  estadoProcesamiento,
  initialProgressSeconds,
}: {
  courseSlug: string;
  videoId: string;
  estadoProcesamiento: "subiendo" | "procesando" | "listo";
  initialProgressSeconds: number;
}) {
  let embedUrl: string | null = null;
  let error: string | null = null;

  if (estadoProcesamiento === "listo") {
    try {
      const admin = createServiceRoleClient();
      const { data: full, error: errVideo } = await admin
        .from("course_videos")
        .select("vimeo_id")
        .eq("id", videoId)
        .single();
      if (errVideo) throw errVideo;
      if (!full?.vimeo_id) error = "Esta clase todavía no tiene video subido";
      else embedUrl = await getVimeoEmbedUrl(full.vimeo_id);
    } catch (err) {
      error = mensajeError(err);
    }
  }

  return (
    <ClassPlayer
      courseSlug={courseSlug}
      videoId={videoId}
      estadoProcesamiento={estadoProcesamiento}
      initialProgressSeconds={initialProgressSeconds}
      initialEmbedUrl={embedUrl}
      initialError={error}
    />
  );
}
