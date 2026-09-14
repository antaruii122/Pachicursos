import { createClient } from "@/lib/supabase/server";
import { formatCLP } from "@/lib/types";
import { redirect } from "next/navigation";

const card = "rounded-[18px] bg-white p-6 shadow-[0_12px_30px_rgba(78,15,38,.1)]";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  fallido: "Fallido",
  reembolsado: "Reembolsado",
  revocado: "Revocado",
};

// Actividad real, sin nada inventado (2026-09-14): no existe ningún sistema
// de notificaciones en la plataforma (ni tabla, ni nada que las dispare
// todavía), así que en vez de una bandeja de notificaciones falsa esta
// página muestra dos historiales reales que ya se guardan hoy: compras y
// avance de clases.
export default async function ActividadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login?next=/cuenta/actividad");

  const [{ data: compras }, { data: progreso }] = await Promise.all([
    supabase
      .from("purchases")
      .select("id, monto, proveedor_pago, estado, fecha, courses(titulo, slug)")
      .eq("user_id", user.id)
      .order("fecha", { ascending: false }),
    supabase
      .from("lesson_progress")
      .select("video_id, completed, actualizado_en, course_videos(titulo, course_id, courses(titulo, slug))")
      .eq("user_id", user.id)
      .order("actualizado_en", { ascending: false })
      .limit(15),
  ]);

  const comprasNorm = (compras ?? []).map((c) => ({
    ...c,
    courses: Array.isArray(c.courses) ? (c.courses[0] ?? null) : c.courses,
  }));

  const progresoNorm = (progreso ?? [])
    .map((p) => {
      const clase = Array.isArray(p.course_videos) ? p.course_videos[0] : p.course_videos;
      if (!clase) return null;
      const curso = Array.isArray(clase.courses) ? clase.courses[0] : clase.courses;
      return { ...p, claseTitulo: clase.titulo, curso };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold text-[var(--vino)]">
        Actividad
      </h1>

      <div className={card}>
        <h2 className="mb-4 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
          Historial de compras
        </h2>
        {comprasNorm.length === 0 ? (
          <p className="text-sm text-[var(--tinta-suave)]">Todavía no tenés compras.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {comprasNorm.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--linea)] p-3 text-sm">
                <div>
                  <p className="font-medium text-[var(--tinta)]">{c.courses?.titulo ?? "—"}</p>
                  <p className="text-[.78rem] text-[var(--tinta-suave)]">
                    {new Date(c.fecha).toLocaleDateString("es-CL")} ·{" "}
                    {c.proveedor_pago === "manual" ? "Otorgado manualmente" : c.proveedor_pago}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[var(--vino)]">{formatCLP(c.monto)}</span>
                  <span className="rounded-full bg-[var(--crema-2)] px-3 py-1 text-[.72rem] uppercase text-[var(--tinta-suave)]">
                    {ESTADO_LABEL[c.estado] ?? c.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={card}>
        <h2 className="mb-4 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
          Actividad reciente
        </h2>
        {progresoNorm.length === 0 ? (
          <p className="text-sm text-[var(--tinta-suave)]">Todavía no empezaste ninguna clase.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {progresoNorm.map((p) => (
              <div key={p.video_id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--linea)] p-3 text-sm">
                <div>
                  <p className="font-medium text-[var(--tinta)]">{p.claseTitulo}</p>
                  <p className="text-[.78rem] text-[var(--tinta-suave)]">{p.curso?.titulo ?? "—"}</p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-[.78rem] text-[var(--tinta-suave)]">
                    {new Date(p.actualizado_en).toLocaleDateString("es-CL")}
                  </span>
                  {p.completed && (
                    <span className="rounded-full bg-[var(--vino)] px-3 py-1 text-[.7rem] uppercase text-white">
                      Completada
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
