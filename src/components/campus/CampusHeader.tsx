import { AccountMenu } from "@/components/account/AccountMenu";
import { CampusNav, type CampusNavLink } from "@/components/campus/CampusNav";
import { CampusLogo } from "@/components/campus/ui";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

// Header del campus privado (pantallas 2 y 3 de la maqueta): logo de aro a
// la izquierda, navegación en píldoras al centro, avatar con iniciales +
// nombre a la derecha. Reemplaza SiteHeader + AccountSubNav dentro del
// campus; el sitio público de venta sigue con SiteHeader.
export async function CampusHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nombre = "";
  let email: string | null = null;
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, nombre, email")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
    nombre = profile?.nombre || user.email?.split("@")[0] || "Cuenta";
    email = profile?.email ?? user.email ?? null;
  }

  const links: CampusNavLink[] = [
    { href: "/cuenta/mis-cursos", label: "Mi Campus", activoEn: ["/cursos/"] },
    { href: "/cuenta/actividad", label: "Actividad" },
    { href: "/cuenta/perfil", label: "Mi perfil" },
    { href: "/cuenta/seguridad", label: "Seguridad" },
  ];

  return (
    <>
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-[var(--vino)] focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-20 border-b border-[var(--linea)] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-[min(1180px,92vw)] items-center justify-between gap-4 py-3.5">
          {/* El logo SIEMPRE lleva a la página principal, en todo el sitio. */}
          <Link href="/" aria-label="Alimenta tu Fertilidad — inicio">
            <CampusLogo />
          </Link>
          {user && <CampusNav links={links} className="hidden md:flex" />}
          {user ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden rounded-full border border-[var(--linea)] px-3.5 py-1.5 font-[family-name:var(--font-ui)] text-[.78rem] font-medium text-[var(--vino)] transition-colors hover:bg-[var(--rosa)] lg:inline-flex"
                >
                  Panel admin
                </Link>
              )}
              <AccountMenu nombre={nombre} email={email} isAdmin={isAdmin} variante="campus" />
            </div>
          ) : (
            <Link
              href="/cuenta/login"
              className="rounded-full bg-[var(--vino)] px-5 py-2 font-[family-name:var(--font-ui)] text-[.82rem] font-medium text-white hover:bg-[var(--vino-claro)]"
            >
              Ingresar
            </Link>
          )}
        </div>
        {user && (
          <div className="border-t border-[var(--linea)] md:hidden">
            <CampusNav links={links} className="mx-auto w-[min(1180px,92vw)] py-2" />
          </div>
        )}
      </header>
    </>
  );
}
