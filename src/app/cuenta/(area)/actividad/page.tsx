import { PerfilTabs } from "@/components/account/PerfilTabs";
import { campusCard, Eyebrow } from "@/components/campus/ui";
import { createClient } from "@/lib/supabase/server";
import { formatCLP } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";

// Actividad (dentro de Mi perfil). Historiales reales: cursos que tienes y
// clases que viste. Los intentos de pago que no se completaron NO se
// muestran (hallazgo 2026-09-30: aparecían como "$480.000 PENDIENTE", que
// para una alumna se lee como una deuda).
export default async function ActividadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login?next=/cuenta/actividad");

  const [{ data: compras, error: e1 }, { data: progreso, error: e2 }] = await Promise.all([
    supabase
      .from("purchases")
      .select("id, monto, proveedor_pago, estado, fecha, courses(titulo, slug)")
      .eq("user_id", user.id)
      .in("estado", ["pagado", "reembolsado", "revocado"])
      .order("fecha", { ascending: false }),
    supabase
      .from("lesson_progress")
      .select("video_id, completed, actualizado_en, course_videos(orden, titulo, courses(titulo, slug))")
      .eq("user_id", user.id)
      .order("actualizado_en", { ascending: false })
      .limit(20),
  ]);
  if (e1) throw new Error(`No se pudo cargar tu historial: ${e1.message}`);
  if (e2) throw new Error(`No se pudo cargar tu actividad: ${e2.message}`);

  const cursos = (compras ?? []).map((c) => ({
    ...c,
    curso: Array.isArray(c.courses) ? (c.courses[0] ?? null) : c.courses,
  }));

  const clases = (progreso ?? [])
    .map((p) => {
      const clase = Array.isArray(p.course_videos) ? p.course_videos[0] : p.course_videos;
      if (!clase) return null;
      const curso = Array.isArray(clase.courses) ? clase.courses[0] : clase.courses;
      return { ...p, clase, curso };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div>
      <Eyebrow>Mi perfil</Eyebrow>
      <h1 className="mb-5 mt-1 text-[1.9rem] font-normal">Actividad</h1>
      <PerfilTabs />

      <div className="flex flex-col gap-6">
        <section className={`${campusCard} p-6`}>
          <h2 className="mb-4 text-[1.2rem] font-normal">Tus cursos</h2>
          {cursos.length === 0 ? (
            <p className="text-sm text-[var(--tinta-suave)]">Todavía no tienes cursos.</p>
          ) : (
            <ul className="divide-y divide-[var(--linea)]">
              {cursos.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--tinta)]">{c.curso?.titulo ?? "—"}</p>
                    <p className="text-[.78rem] text-[var(--tinta-suave)]">
                      {new Date(c.fecha).toLocaleDateString("es-CL")} ·{" "}
                      {c.proveedor_pago === "manual" ? "Acceso dado por el equipo" : `Compra de ${formatCLP(c.monto)}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 font-[family-name:var(--font-ui)] text-[.72rem] ${
                      c.estado === "pagado" ? "bg-[var(--rosa)] text-[var(--vino)]" : "bg-[var(--crema-2)] text-[var(--tinta-suave)]"
                    }`}
                  >
                    {c.estado === "pagado" ? "Con acceso" : c.estado === "reembolsado" ? "Reembolsado" : "Sin acceso"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${campusCard} p-6`}>
          <h2 className="mb-4 text-[1.2rem] font-normal">Clases que viste</h2>
          {clases.length === 0 ? (
            <p className="text-sm text-[var(--tinta-suave)]">Todavía no empiezas ninguna clase.</p>
          ) : (
            <ul className="divide-y divide-[var(--linea)]">
              {clases.map((p) => (
                <li key={p.video_id}>
                  <Link
                    href={p.curso ? `/cursos/${p.curso.slug}/clase/${p.clase.orden}` : "/cuenta/mis-cursos"}
                    className="flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:text-[var(--vino)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--tinta)]">{p.clase.titulo}</p>
                      <p className="truncate text-[.78rem] text-[var(--tinta-suave)]">{p.curso?.titulo ?? "—"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-[.76rem] text-[var(--tinta-suave)]">
                        {new Date(p.actualizado_en).toLocaleDateString("es-CL")}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 font-[family-name:var(--font-ui)] text-[.72rem] ${
                          p.completed ? "bg-[var(--vino)] text-white" : "bg-[var(--crema-2)] text-[var(--tinta-suave)]"
                        }`}
                      >
                        {p.completed ? "Completada" : "En curso"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
