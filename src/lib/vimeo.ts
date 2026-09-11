// Cliente mínimo de la API de Vimeo, server-only (usa VIMEO_ACCESS_TOKEN,
// nunca se importa desde un client component). Patrón verificado contra el
// SDK oficial vimeo/vimeo.py (client.py + upload.py), no adivinado:
// - Accept: application/vnd.vimeo.*;version=3.4
// - POST /me/videos con { upload: { approach: 'tus', size }, name } crea el
//   video y devuelve { uri: "/videos/<id>", upload: { upload_link } }.
//
// IMPORTANTE (corrección 2026-09-11, ver docs/cursos.md): Vimeo NO tiene
// webhook de fin de transcoding (limitación confirmada por Vimeo mismo,
// nunca resuelta). El único mecanismo real es hacer polling a
// GET /videos/{id}?fields=transcode.status, que devuelve "in_progress",
// "complete" o "error" (fuente: Vimeo Help Center, artículo "Get video
// transcode status from the API").

const VIMEO_API_BASE = "https://api.vimeo.com";

function vimeoHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.vimeo.*;version=3.4",
  };
}

export async function createVimeoTusUpload(filename: string, filesizeBytes: number) {
  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) throw new Error("Falta VIMEO_ACCESS_TOKEN en las variables de entorno");

  const res = await fetch(`${VIMEO_API_BASE}/me/videos?fields=uri,upload`, {
    method: "POST",
    headers: { ...vimeoHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      name: filename,
      upload: { approach: "tus", size: String(filesizeBytes) },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Vimeo respondió ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as { uri: string; upload: { upload_link: string } };
  const vimeoId = data.uri.split("/").pop();
  if (!vimeoId) throw new Error("No se pudo extraer el vimeo_id de la respuesta de Vimeo");

  return { vimeoId, uploadLink: data.upload.upload_link };
}

export type VimeoTranscodeStatus = "in_progress" | "complete" | "error";

// `duration` es un campo estándar de la API de Vimeo (segundos, entero) —
// se pide junto con transcode.status en la misma llamada para poder escribir
// la duración real la primera vez que el polling detecta "complete" (ver
// /api/vimeo/status/[videoId]/route.ts). Antes de esto, `course_videos.duracion`
// nunca se llenaba desde ningún lado del código real (solo el script de seed
// lo hardcodeaba a mano) — hallazgo de Ricardo viendo "12 min" en el curso
// placeholder y preguntando si eso salía del video real.
export async function getVimeoTranscodeStatus(
  vimeoId: string,
): Promise<{ status: VimeoTranscodeStatus; durationSeconds: number | null }> {
  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) throw new Error("Falta VIMEO_ACCESS_TOKEN en las variables de entorno");

  const res = await fetch(`${VIMEO_API_BASE}/videos/${vimeoId}?fields=transcode.status,duration`, {
    headers: vimeoHeaders(token),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Vimeo respondió ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as { transcode: { status: VimeoTranscodeStatus }; duration?: number };
  return { status: data.transcode.status, durationSeconds: data.duration ?? null };
}

// player_embed_url ya incluye el hash de privacidad cuando hace falta (video
// unlisted) — se devuelve tal cual la entrega la API, nunca se arma la URL
// a mano (eso rompe con privacidad "unlisted"). Campo confirmado real
// revisando uso en producción en múltiples repos públicos (incluido el
// extractor de yt-dlp) — la doc oficial de Vimeo es una SPA que bloquea el
// scraping automático, así que se verificó por esta vía en vez de adivinar.
export async function getVimeoEmbedUrl(vimeoId: string): Promise<string> {
  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) throw new Error("Falta VIMEO_ACCESS_TOKEN en las variables de entorno");

  const res = await fetch(`${VIMEO_API_BASE}/videos/${vimeoId}?fields=player_embed_url`, {
    headers: vimeoHeaders(token),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Vimeo respondió ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as { player_embed_url: string };
  return data.player_embed_url;
}
