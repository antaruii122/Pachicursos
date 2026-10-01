import { AccountMenu } from "@/components/account/AccountMenu";
import { Logo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let nombre = "";
  let email: string | null = null;
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

  return (
    <>
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[var(--vino)] focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-20 border-b border-[var(--linea)] bg-[var(--header-bg)] backdrop-blur-sm">
      <div className="mx-auto flex w-[min(1160px,90vw)] items-center justify-between gap-3 py-4 sm:gap-6">
        <Link href="/" aria-label="NUTFEM — inicio" className="min-w-0">
          <Logo />
        </Link>
        <nav className="flex shrink-0 items-center gap-2.5 font-[family-name:var(--font-ui)] text-[.78rem] sm:gap-6 sm:text-[.86rem]">
          {user ? (
            <>
              <Link
                href="/cuenta/mis-cursos"
                className="rounded-full bg-[var(--rosa)] px-3.5 py-1.5 font-medium text-[var(--vino)] transition-colors hover:bg-[var(--vino)] hover:text-white"
              >
                Mi Campus
              </Link>
              <AccountMenu nombre={nombre} email={email} isAdmin={isAdmin} variante="campus" />
            </>
          ) : (
            <Link
              href="/cuenta/login"
              className="rounded-full bg-[var(--vino)] px-4 py-1.5 font-medium text-white transition-colors hover:bg-[var(--vino-claro)]"
            >
              Ingresar como alumna
            </Link>
          )}
        </nav>
      </div>
      </header>
    </>
  );
}
