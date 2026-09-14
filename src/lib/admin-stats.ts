import type { SupabaseClient } from "@supabase/supabase-js";

// Estadísticas reales de la plataforma, calculadas desde las tablas que ya
// existen (`purchases`, `courses`) — sin ninguna tabla nueva. Se usa tanto en
// el resumen compacto de /cuenta/perfil (para el admin) como en el dashboard
// completo de /admin (2026-09-14 — antes no existía ningún resumen de
// negocio en ningún lado, solo la tabla cruda de /admin/ventas).
export interface AdminStats {
  revenueTotal: number;
  estudiantesPagantes: number;
  cursosTotal: number;
  cursosPublicados: number;
  ventasRecientes: {
    id: string;
    monto: number;
    fecha: string;
    alumno: string;
    curso: string;
  }[];
}

export async function getAdminStats(supabase: SupabaseClient): Promise<AdminStats> {
  const [{ data: pagadas }, { data: cursos }, { data: recientes }] = await Promise.all([
    supabase.from("purchases").select("monto, user_id").eq("estado", "pagado"),
    supabase.from("courses").select("estado"),
    supabase
      .from("purchases")
      .select("id, monto, fecha, profiles(nombre, email), courses(titulo)")
      .eq("estado", "pagado")
      .order("fecha", { ascending: false })
      .limit(5),
  ]);

  const revenueTotal = (pagadas ?? []).reduce((sum, p) => sum + p.monto, 0);
  const estudiantesPagantes = new Set((pagadas ?? []).map((p) => p.user_id)).size;
  const cursosTotal = cursos?.length ?? 0;
  const cursosPublicados = (cursos ?? []).filter((c) => c.estado === "publicado").length;

  const ventasRecientes = (recientes ?? []).map((v) => {
    const perfil = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
    const curso = Array.isArray(v.courses) ? v.courses[0] : v.courses;
    return {
      id: v.id,
      monto: v.monto,
      fecha: v.fecha,
      alumno: perfil?.nombre || perfil?.email || "—",
      curso: curso?.titulo ?? "—",
    };
  });

  return { revenueTotal, estudiantesPagantes, cursosTotal, cursosPublicados, ventasRecientes };
}
