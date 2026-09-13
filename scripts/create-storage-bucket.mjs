// Crea el bucket público de Supabase Storage para imágenes de curso
// (portada/fondo) — hallazgo 2026-09-13/14: el admin no tenía ninguna forma
// de subir una foto, solo pegar una URL externa. Idempotente: si el bucket
// ya existe, no hace nada.
//
// Uso: node --env-file=.env.local scripts/create-storage-bucket.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables de entorno. Corré con: node --env-file=.env.local scripts/create-storage-bucket.mjs",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET_ID = "course-images";

async function main() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  if (buckets.some((b) => b.id === BUCKET_ID)) {
    console.log(`Bucket "${BUCKET_ID}" ya existe.`);
    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET_ID, {
    public: true,
    fileSizeLimit: "8MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  });
  if (error) throw error;
  console.log(`Bucket "${BUCKET_ID}" creado (público, hasta 8MB, jpeg/png/webp/avif).`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
