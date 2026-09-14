import { EditableNombre } from "@/components/account/EditableNombre";
import { getAdminStats } from "@/lib/admin-stats";
import { cursosConProgresoDelUsuario } from "@/lib/progreso";
import { createClient } from "@/lib/supabase/server";
import { formatCLP } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";

const card = "rounded-[18px] bg-white p-6 shadow-[0_12px_30px_rgba(78,15,38,.1)]";
const stat = "flex flex-col gap-1 rounded-[14px] bg-[var(--crema-2)] p-4";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login?next=/cuenta/perfil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, email, role, created_at")
    .eq("id", user.id)
    .single();

  const cursos = await cursosConProgresoDelUsuario(supabase, user.id);
  const totalClases = cursos.reduce((sum, c) => sum + c.totalClases, 0);
  const totalCompletadas = cursos.reduce((sum, c) => sum + c.clasesCompletadas, 0);
  const cursosCompletados = cursos.filter((c) => c.totalClases > 0 && c.clasesCompletadas === c.totalClases).length;
  const progresoPromedio = totalClases > 0 ? Math.round((totalCompletadas / totalClases) * 100) : 0;

  const esAdmin = profile?.role === "admin";
  const adminStats = esAdmin ? await getAdminStats(supabase) : null;

  const miembroDesde = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("es-CL", { year: "numeric", month: "long" })
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className={card}>
        <EditableNombre nombreInicial={profile?.nombre || user.email?.split("@")[0] || "Sin nombre"} />
        <p className="mt-1 text-[.85rem] text-[var(--tinta-suave)]">{profile?.email ?? user.email}</p>
        {miembroDesde && (
          <p className="mt-3 text-[.78rem] text-[var(--tinta-suave)]">Miembro desde {miembroDesde}</p>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-[family-name:var(--font-ui)] text-[.85rem] font-semibold uppercase tracking-[.06em] text-[var(--tinta-suave)]">
          Tu progreso
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className={stat}>
            <span className="text-[1.6rem] font-semibold text-[var(--vino)]">{cursos.length}</span>
            <span className="text-[.78rem] text-[var(--tinta-suave)]">Cursos comprados</span>
          </div>
          <div className={stat}>
            <span className="text-[1.6rem] font-semibold text-[var(--vino)]">{cursosCompletados}</span>
            <span className="text-[.78rem] text-[var(--tinta-suave)]">Completados</span>
          </div>
          <div className={stat}>
            <span className="text-[1.6rem] font-semibold text-[var(--vino)]">{progresoPromedio}%</span>
            <span className="text-[.78rem] text-[var(--tinta-suave)]">Avance promedio</span>
          </div>
          <Link href="/cuenta/mis-cursos" className={`${stat} justify-center text-center hover:bg-[var(--rosa)]`}>
            <span className="text-[.85rem] font-medium text-[var(--carmin)]">Ir a Mis cursos →</span>
          </Link>
        </div>
      </div>

      {esAdmin && adminStats && (
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-ui)] text-[.85rem] font-semibold uppercase tracking-[.06em] text-[var(--tinta-suave)]">
            Administración
          </h2>
          <div className={`${card} flex flex-col gap-4`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className={stat}>
                <span className="text-[1.4rem] font-semibold text-[var(--vino)]">
                  {formatCLP(adminStats.revenueTotal)}
                </span>
                <span className="text-[.78rem] text-[var(--tinta-suave)]">Ingresos totales</span>
              </div>
              <div className={stat}>
                <span className="text-[1.4rem] font-semibold text-[var(--vino)]">
                  {adminStats.estudiantesPagantes}
                </span>
                <span className="text-[.78rem] text-[var(--tinta-suave)]">Alumnas pagantes</span>
              </div>
              <div className={stat}>
                <span className="text-[1.4rem] font-semibold text-[var(--vino)]">
                  {adminStats.cursosPublicados}/{adminStats.cursosTotal}
                </span>
                <span className="text-[.78rem] text-[var(--tinta-suave)]">Cursos publicados</span>
              </div>
            </div>
            <Link
              href="/admin"
              className="self-start rounded-full bg-[var(--vino)] px-5 py-2 font-[family-name:var(--font-ui)] text-[.85rem] text-white hover:bg-[var(--vino-claro)]"
            >
              Ir al panel de administración
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
