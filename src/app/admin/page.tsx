import { campusCard, Eyebrow } from "@/components/campus/ui";
import { getAdminStats } from "@/lib/admin-stats";
import { createClient } from "@/lib/supabase/server";
import { formatCLP } from "@/lib/types";
import Link from "next/link";

// Dashboard de administración. Rediseñado 2026-09-30 pensando como la
// administradora: (1) números que no mienten — ingresos y "pagantes" solo
// cuentan pagos reales, los accesos dados a mano van aparte; (2) las tareas
// del día a un click (dar acceso, subir material, ver como alumna) en vez de
// dos botones genéricos "Gestionar".
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const stats = await getAdminStats(supabase);

  const kpis = [
    { valor: formatCLP(stats.revenueTotal), label: "Ingresos (pagos reales)" },
    { valor: stats.estudiantesPagantes, label: "Alumnas que pagaron" },
    { valor: stats.alumnasConAcceso, label: "Alumnas con acceso" },
    { valor: `${stats.cursosPublicados} de ${stats.cursosTotal}`, label: "Cursos publicados" },
  ];

  const tareas = [
    { href: "/admin/usuarios/nuevo", titulo: "Crear alumna", detalle: "Cuenta + curso + mensaje de bienvenida" },
    { href: "/admin/usuarios", titulo: "Dar acceso a un curso", detalle: "Busca a la persona y asígnale el curso" },
    { href: "/admin/cursos", titulo: "Subir clases y material", detalle: "Videos, PDF y presentaciones por clase" },
    { href: "/cuenta/mis-cursos", titulo: "Ver el campus como alumna", detalle: "Revisa lo que ven tus alumnas" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Eyebrow>Panel de administración</Eyebrow>
        <h1 className="mt-1 text-[1.9rem] font-normal">Resumen</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={`${campusCard} flex flex-col gap-1 p-5`}>
            <span className="font-[family-name:var(--font-heading)] text-[1.7rem] leading-tight text-[var(--vino-osc)]">
              {k.valor}
            </span>
            <span className="font-[family-name:var(--font-ui)] text-[.72rem] uppercase tracking-[.1em] text-[var(--tinta-suave)]">
              {k.label}
            </span>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-[1.25rem] font-normal">¿Qué quieres hacer?</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tareas.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`${campusCard} group flex items-start justify-between gap-3 p-5 transition-[transform,box-shadow,border-color] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-0.5 hover:border-[var(--rosa)] hover:shadow-[var(--sombra-md)]`}
            >
              <span>
                <span className="block font-[family-name:var(--font-heading)] text-[1.05rem] text-[var(--vino)]">{t.titulo}</span>
                <span className="mt-0.5 block text-[.8rem] text-[var(--tinta-suave)]">{t.detalle}</span>
              </span>
              <span aria-hidden="true" className="mt-1 text-[var(--vino)] transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${campusCard} p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[1.25rem] font-normal">Actividad reciente</h2>
          <Link href="/admin/ventas" className="font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--vino)] underline underline-offset-4">
            Ver todo
          </Link>
        </div>
        {stats.ventasRecientes.length === 0 ? (
          <p className="text-sm text-[var(--tinta-suave)]">Todavía no hay compras ni accesos.</p>
        ) : (
          <ul className="divide-y divide-[var(--linea)]">
            {stats.ventasRecientes.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--tinta)]">{v.alumno}</p>
                  <p className="truncate text-[.78rem] text-[var(--tinta-suave)]">{v.curso}</p>
                </div>
                <div className="shrink-0 text-right">
                  {v.manual ? (
                    <span className="rounded-full bg-[var(--rosa)] px-3 py-1 font-[family-name:var(--font-ui)] text-[.72rem] text-[var(--vino)]">
                      Acceso dado por admin
                    </span>
                  ) : (
                    <p className="font-medium text-[var(--vino)]">{formatCLP(v.monto)}</p>
                  )}
                  <p className="mt-1 text-[.74rem] text-[var(--tinta-suave)]">
                    {new Date(v.fecha).toLocaleDateString("es-CL")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
