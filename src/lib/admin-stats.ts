import type { SupabaseClient } from "@supabase/supabase-js";

// Estadísticas reales de la plataforma, calculadas desde las tablas que ya
// existen (`purchases`, `courses`) — sin ninguna tabla nueva. Se usa tanto en
// el resumen compacto de /cuenta/perfil (para el admin) como en el dashboard
// completo de /admin (2026-09-14 — antes no existía ningún resumen de
// negocio en ningún lado, solo la tabla cruda de /admin/ventas).
export interface AdminStats {
  revenueTotal: number; // solo pagos reales (Flow/Stripe), nunca accesos manuales
  estudiantesPagantes: number; // personas con al menos un pago real
  alumnasConAcceso: number; // personas con acceso hoy (pagado o dado por admin)
  cursosTotal: number;
  cursosPublicados: number;
  ventasRecientes: {
    id: string;
    monto: number;
    manual: boolean;
    fecha: string;
    alumno: string;
    curso: string;
  }[];
}

export async function getAdminStats(supabase: SupabaseClient): Promise<AdminStats> {
  const [{ data: pagadas }, { data: cursos }, { data: recientes, error: recientesError }] = await Promise.all([
    supabase.from("purchases").select("monto, user_id, proveedor_pago").eq("estado", "pagado"),
    supabase.from("courses").select("estado"),
    supabase
      .from("purchases")
      .select("id, monto, proveedor_pago, fecha, profiles:profiles!purchases_user_id_fkey(nombre, email), courses(titulo)")
      .eq("estado", "pagado")
      .order("fecha", { ascending: false })
      .limit(5),
  ]);

  if (recientesError) throw new Error(`No se pudieron cargar las ventas recientes: ${recientesError.message}`);

  // Un acceso dado a mano por el admin NO es una venta (hallazgo 2026-09-30:
  // el dashboard mostraba un acceso de cortesía como "venta de $0" y lo
  // contaba como "alumna pagante").
  const reales = (pagadas ?? []).filter((p) => p.proveedor_pago !== "manual");
  const revenueTotal = reales.reduce((sum, p) => sum + p.monto, 0);
  const estudiantesPagantes = new Set(reales.map((p) => p.user_id)).size;
  const alumnasConAcceso = new Set((pagadas ?? []).map((p) => p.user_id)).size;
  const cursosTotal = cursos?.length ?? 0;
  const cursosPublicados = (cursos ?? []).filter((c) => c.estado === "publicado").length;

  const ventasRecientes = (recientes ?? []).map((v) => {
    const perfil = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
    const curso = Array.isArray(v.courses) ? v.courses[0] : v.courses;
    return {
      id: v.id,
      monto: v.monto,
      manual: v.proveedor_pago === "manual",
      fecha: v.fecha,
      alumno: perfil?.nombre || perfil?.email || "—",
      curso: curso?.titulo ?? "—",
    };
  });

  return { revenueTotal, estudiantesPagantes, alumnasConAcceso, cursosTotal, cursosPublicados, ventasRecientes };
}
