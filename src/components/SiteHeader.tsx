import { AccountMenu } from "@/components/account/AccountMenu";
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
      <header className="sticky top-0 z-20 border-b border-[var(--linea)] bg-[rgba(253,247,248,.94)] backdrop-blur-sm">
      <div className="mx-auto flex w-[min(1160px,90vw)] items-center justify-between gap-3 py-4 sm:gap-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--vino)" strokeWidth="1.4" className="shrink-0">
            <path d="M12 21c-4-3-7-6.5-7-10.2C5 7 7.2 5 10 5c1 0 1.7.4 2 1 .3-.6 1-1 2-1 2.8 0 5 2 5 5.8 0 3.7-3 7.2-7 10.2z" />
          </svg>
          <span className="flex min-w-0 flex-col leading-tight">
            <b className="truncate font-[family-name:var(--font-heading)] text-[.95rem] text-[var(--vino)] sm:text-[1.1rem]">
              Alimenta tu Fertilidad
            </b>
            <span className="hidden font-[family-name:var(--font-ui)] text-[.55rem] uppercase tracking-[.22em] text-[var(--tinta-suave)] sm:block">
              Cursos con Marcela Calderón
            </span>
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2.5 font-[family-name:var(--font-ui)] text-[.78rem] sm:gap-6 sm:text-[.86rem]">
          <Link
            href="/"
            className="hidden text-[var(--tinta-suave)] hover:text-[var(--vino)] sm:inline"
          >
            Cursos disponibles
          </Link>
          {user ? (
            <AccountMenu nombre={nombre} email={email} isAdmin={isAdmin} />
          ) : (
            <Link href="/cuenta/login" className="text-[var(--tinta)] hover:text-[var(--vino)]">
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
      </header>
    </>
  );
}
