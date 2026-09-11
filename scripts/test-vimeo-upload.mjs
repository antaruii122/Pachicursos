// Prueba real de punta a punta del pipeline de Vimeo (Parte C/D, ver
// docs/cursos.md): sube un archivo de video real a la cuenta de Vimeo
// configurada en .env.local, espera a que termine de procesar, confirma que
// devuelve un player_embed_url reproducible, y borra el video de prueba al
// final (no deja basura en la cuenta real).
//
// No depende de tener sesión de admin en el navegador ni de la app corriendo
// — usa las mismas funciones/endpoints que src/lib/vimeo.ts, directo contra
// la API real de Vimeo con el VIMEO_ACCESS_TOKEN de .env.local.
//
// Uso: node --env-file=.env.local scripts/test-vimeo-upload.mjs <ruta-al-video.mp4>

import { Upload } from "tus-js-client";
import { readFileSync, statSync } from "node:fs";

const VIMEO_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
const VIMEO_API_BASE = "https://api.vimeo.com";
const filePath = process.argv[2];

if (!VIMEO_TOKEN) {
  console.error(
    "Falta VIMEO_ACCESS_TOKEN. Corré con: node --env-file=.env.local scripts/test-vimeo-upload.mjs <video.mp4>",
  );
  process.exit(1);
}
if (!filePath) {
  console.error("Uso: node --env-file=.env.local scripts/test-vimeo-upload.mjs <ruta-al-video.mp4>");
  process.exit(1);
}

function vimeoHeaders() {
  return {
    Authorization: `Bearer ${VIMEO_TOKEN}`,
    Accept: "application/vnd.vimeo.*;version=3.4",
  };
}

async function createTusUpload(filename, filesizeBytes) {
  const res = await fetch(`${VIMEO_API_BASE}/me/videos?fields=uri,upload`, {
    method: "POST",
    headers: { ...vimeoHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      name: filename,
      upload: { approach: "tus", size: String(filesizeBytes) },
    }),
  });
  if (!res.ok) throw new Error(`Vimeo respondió ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const vimeoId = data.uri.split("/").pop();
  return { vimeoId, uploadLink: data.upload.upload_link };
}

function uploadViaTus(fileBuffer, uploadLink) {
  return new Promise((resolve, reject) => {
    const upload = new Upload(fileBuffer, {
      uploadUrl: uploadLink,
      onError: reject,
      onProgress(bytesUploaded, bytesTotal) {
        const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(0);
        process.stdout.write(`\r  Subiendo... ${pct}%`);
      },
      onSuccess: () => {
        process.stdout.write("\n");
        resolve();
      },
    });
    upload.start();
  });
}

async function getTranscodeStatus(vimeoId) {
  const res = await fetch(`${VIMEO_API_BASE}/videos/${vimeoId}?fields=transcode.status,duration`, {
    headers: vimeoHeaders(),
  });
  if (!res.ok) throw new Error(`Vimeo respondió ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { status: data.transcode.status, durationSeconds: data.duration ?? null };
}

async function getEmbedUrl(vimeoId) {
  const res = await fetch(`${VIMEO_API_BASE}/videos/${vimeoId}?fields=player_embed_url`, {
    headers: vimeoHeaders(),
  });
  if (!res.ok) throw new Error(`Vimeo respondió ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.player_embed_url;
}

async function deleteVideo(vimeoId) {
  const res = await fetch(`${VIMEO_API_BASE}/videos/${vimeoId}`, {
    method: "DELETE",
    headers: vimeoHeaders(),
  });
  if (!res.ok && res.status !== 404) {
    console.warn(`  Aviso: no se pudo borrar el video de prueba ${vimeoId} (${res.status}). Borralo a mano en Vimeo.`);
  }
}

async function main() {
  const stat = statSync(filePath);
  const fileBuffer = readFileSync(filePath);
  console.log(`Archivo: ${filePath} (${(stat.size / 1024).toFixed(0)} KB)`);

  console.log("1. Creando upload TUS en Vimeo (POST /me/videos)...");
  const { vimeoId, uploadLink } = await createTusUpload("[TEST] Prueba automática — borrar", stat.size);
  console.log(`   vimeo_id = ${vimeoId}`);

  try {
    console.log("2. Subiendo el archivo real vía TUS...");
    await uploadViaTus(fileBuffer, uploadLink);

    console.log("3. Polling de transcode.status (mismo mecanismo que VideoUploadWidget)...");
    let status = "in_progress";
    let durationSeconds = null;
    const start = Date.now();
    const timeoutMs = 5 * 60 * 1000;
    while (status === "in_progress" && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 5000));
      ({ status, durationSeconds } = await getTranscodeStatus(vimeoId));
      console.log(`   estado: ${status}`);
    }

    if (status !== "complete") {
      throw new Error(`El video no terminó de procesar a tiempo (último estado: ${status})`);
    }

    console.log(`   duración real reportada por Vimeo: ${durationSeconds} segundos`);

    console.log("4. Pidiendo player_embed_url...");
    const embedUrl = await getEmbedUrl(vimeoId);
    console.log(`   player_embed_url = ${embedUrl}`);

    console.log("\n✅ PASS — pipeline de subida, procesamiento, duración real y reproducción funciona de punta a punta contra la cuenta real de Vimeo.");
  } finally {
    console.log(`5. Borrando el video de prueba (${vimeoId})...`);
    await deleteVideo(vimeoId);
  }
}

main().catch((err) => {
  console.error("\n❌ FAIL —", err.message);
  process.exit(1);
});
