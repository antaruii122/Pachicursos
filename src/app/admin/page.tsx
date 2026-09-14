import { getAdminStats } from "@/lib/admin-stats";
import { createClient } from "@/lib/supabase/server";
import { formatCLP } from "@/lib/types";
import Link from "next/link";

const card = "rounded-[14px] bg-white p-6 shadow-[0_8px_20px_rgba(78,15,38,.08)]";
const stat = "flex flex-col gap-1 rounded-[14px] bg-[var(--crema-2)] p-5";

// Dashboard de administración (2026-09-14 — antes /admin (a secas) ni
// siquiera tenía un page.tsx, así que 404eaba; lo único que existía era la
// tabla cruda de /admin/ventas, sin ningún resumen del negocio en ningún
// lado). Todo calculado desde tablas que ya existen, sin esquema nuevo.
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const stats = await getAdminStats(supabase);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-6 font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold text-[var(--vino)]">
          Resumen
        </h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className={stat}>
            <span className="text-[1.5rem] font-semibold text-[var(--vino)]">
              {formatCLP(stats.revenueTotal)}
            </span>
            <span className="text-[.8rem] text-[var(--tinta-suave)]">Ingresos totales</span>
          </div>
          <div className={stat}>
            <span className="text-[1.5rem] font-semibold text-[var(--vino)]">
              {stats.estudiantesPagantes}
            </span>
            <span className="text-[.8rem] text-[var(--tinta-suave)]">Alumnas pagantes</span>
          </div>
          <div className={stat}>
            <span className="text-[1.5rem] font-semibold text-[var(--vino)]">
              {stats.cursosPublicados}
            </span>
            <span className="text-[.8rem] text-[var(--tinta-suave)]">Cursos publicados</span>
          </div>
          <div className={stat}>
            <span className="text-[1.5rem] font-semibold text-[var(--vino)]">{stats.cursosTotal}</span>
            <span className="text-[.8rem] text-[var(--tinta-suave)]">Cursos totales</span>
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
            Ventas recientes
          </h2>
          <Link href="/admin/ventas" className="text-[.82rem] text-[var(--carmin)] underline">
            Ver todas
          </Link>
        </div>
        {stats.ventasRecientes.length === 0 ? (
          <p className="text-sm text-[var(--tinta-suave)]">Todavía no hay ventas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {stats.ventasRecientes.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--linea)] p-3 text-sm">
                <div>
                  <p className="font-medium text-[var(--tinta)]">{v.alumno}</p>
                  <p className="text-[.78rem] text-[var(--tinta-suave)]">{v.curso}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[var(--vino)]">{formatCLP(v.monto)}</p>
                  <p className="text-[.78rem] text-[var(--tinta-suave)]">
                    {new Date(v.fecha).toLocaleDateString("es-CL")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/cursos" className={`${card} block hover:opacity-90`}>
          <h3 className="font-[family-name:var(--font-ui)] text-[.9rem] font-medium text-[var(--vino)]">
            Gestionar cursos →
          </h3>
        </Link>
        <Link href="/admin/usuarios" className={`${card} block hover:opacity-90`}>
          <h3 className="font-[family-name:var(--font-ui)] text-[.9rem] font-medium text-[var(--vino)]">
            Gestionar usuarios →
          </h3>
        </Link>
      </div>
    </div>
  );
}
