import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";

const BUCKET = "course-images";
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// Sube una imagen de curso (portada/fondo) a Supabase Storage. Igual patrón
// que /api/vimeo/upload-url: valida sesión + rol admin ACÁ antes de tocar
// nada, recién después usa el cliente service_role para escribir (nunca al
// revés). Hallazgo 2026-09-13/14: antes de esto no existía ninguna forma de
// subir una imagen real, solo pegar una URL externa ya hosteada — este
// endpoint reemplaza eso con una subida real, sirviendo el archivo desde un
// bucket público de Supabase (ya incluido en el plan pago del proyecto, sin
// cuenta nueva).
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Requiere rol admin" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usá JPG, PNG, WEBP o AVIF." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen pesa más de 8MB." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const serviceRole = createServiceRoleClient();
  const { error: uploadError } = await serviceRole.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 502 });
  }

  const { data: publicUrlData } = serviceRole.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrlData.publicUrl });
}
