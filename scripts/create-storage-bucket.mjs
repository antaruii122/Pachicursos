// Crea los buckets de Supabase Storage del proyecto. Originalmente solo el
// público de imágenes de curso
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

// Buckets del proyecto. Idempotente: los que ya existen no se tocan.
const BUCKETS = [
  {
    id: "course-images",
    options: {
      public: true,
      fileSizeLimit: "8MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    },
  },
  // Materiales de clase (PDF/PPT/…, pedido de Ricardo 2026-09-30). PRIVADO:
  // nunca hay un link público; la alumna descarga vía
  // /api/courses/[slug]/videos/[videoId]/recursos/[id], que valida acceso y
  // entrega un link firmado de corta duración.
  {
    id: "materiales",
    options: {
      public: false,
      fileSizeLimit: "50MB",
      allowedMimeTypes: [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/zip",
      ],
    },
  },
];

async function main() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  for (const b of BUCKETS) {
    if (buckets.some((x) => x.id === b.id)) {
      console.log(`Bucket "${b.id}" ya existe.`);
      continue;
    }
    const { error } = await supabase.storage.createBucket(b.id, b.options);
    if (error) throw error;
    console.log(`Bucket "${b.id}" creado (${b.options.public ? "público" : "privado"}, hasta ${b.options.fileSizeLimit}).`);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
