import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con la service_role key: ignora RLS y los GRANT/REVOKE de columna
// (ej. vimeo_id en course_videos). Server-only, nunca importar desde un
// client component. Usar solo después de que el propio endpoint ya validó
// el acceso "a mano" (ver /api/courses/[slug]/videos/[videoId]/player) —
// este cliente no aplica ningún control de acceso por sí mismo.
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
