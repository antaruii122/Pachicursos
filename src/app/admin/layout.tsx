import { AdminNav } from "@/components/admin/AdminNav";
import { CampusLogo } from "@/components/campus/ui";
import { armarHilos, type Pregunta } from "@/lib/preguntas";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

// Gate único para toda /admin/**: sesión + role=admin, validado server-side
// (nunca confiar en el cliente). Cada página admin puede asumir que ya pasó
// por acá. Diseño: pantalla 4 de la maqueta (docs/maqueta-campus.md) —
// sidebar blanca a la izquierda con logo, navegación y la administradora
// abajo; en mobile la navegación pasa a una fila horizontal arriba.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login?next=/admin/cursos");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nombre")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  // Contador de preguntas sin responder para el menú (0 si la tabla todavía
  // no existe — la migración 0007 puede no estar corrida).
  const { data: qs } = await supabase.from("class_questions").select("*").limit(1000);
  const pendientes = armarHilos((qs ?? []) as Pregunta[]).filter((h) => !h.respondida && !h.oculto).length;

  const nombre = profile?.nombre || user.email?.split("@")[0] || "Admin";
  const partes = nombre.trim().split(/\s+/);
  const iniciales = ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();

  return (
    <div className="tema-campus min-h-svh md:flex">
      <aside className="sticky top-0 hidden h-svh w-[272px] shrink-0 flex-col border-r border-[var(--linea)] bg-white px-4 py-6 md:flex">
        {/* El logo SIEMPRE lleva a la página principal, en todo el sitio. */}
        <Link href="/" className="mb-8 px-2" aria-label="Alimenta tu Fertilidad — inicio">
          <CampusLogo />
        </Link>
        <AdminNav pendientes={pendientes} />
        <div className="mt-auto flex items-center gap-3 border-t border-[var(--linea)] px-2 pt-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--vino)] font-[family-name:var(--font-ui)] text-[.75rem] font-semibold text-white">
            {iniciales}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate font-[family-name:var(--font-ui)] text-[.82rem] font-medium text-[var(--tinta)]">
              {nombre}
            </span>
            <span className="block text-[.72rem] text-[var(--tinta-suave)]">Administradora</span>
          </span>
          <Link
            href="/cuenta/logout"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="rounded-full p-1.5 text-[var(--tinta-suave)] hover:bg-[var(--rosa)] hover:text-[var(--vino)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-[var(--linea)] bg-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Alimenta tu Fertilidad — inicio">
            <CampusLogo />
          </Link>
          <Link href="/cuenta/logout" className="font-[family-name:var(--font-ui)] text-[.78rem] text-[var(--tinta-suave)]">
            Salir
          </Link>
        </div>
        <div className="px-3 pb-2">
          <AdminNav horizontal pendientes={pendientes} />
        </div>
      </header>

      <main className="min-w-0 flex-1 px-5 py-8 md:px-10">
        <div className="mx-auto max-w-[1100px]">{children}</div>
      </main>
    </div>
  );
}
