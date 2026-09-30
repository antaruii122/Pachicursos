import { CampusHeader } from "@/components/campus/CampusHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Shell compartido de toda el área de cuenta (2026-09-14 — antes cada página
// bajo /cuenta traía su propio SiteHeader/SiteFooter por separado y no había
// ningún concepto real de "mi cuenta": solo un link suelto a "Mis cursos" en
// el header). Vive en un route group `(area)` — no en /cuenta directamente —
// para que login/registro/logout/olvide-password (que NO requieren sesión)
// no queden atrapados por el redirect de acá abajo.
export default async function CuentaAreaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login?next=/cuenta/perfil");

  return (
    // tema-campus: paleta de la maqueta aprobada (ver globals.css). El header
    // del campus reemplaza SiteHeader + la sub-nav de pestañas.
    <div className="tema-campus flex min-h-svh flex-col">
      <CampusHeader />
      <main id="contenido-principal" className="mx-auto w-[min(1180px,92vw)] flex-1 py-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
