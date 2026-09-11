import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--linea)] bg-[rgba(253,247,248,.94)] backdrop-blur-sm">
      <div className="mx-auto flex w-[min(1160px,90vw)] items-center justify-between gap-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--vino)" strokeWidth="1.4">
            <path d="M12 21c-4-3-7-6.5-7-10.2C5 7 7.2 5 10 5c1 0 1.7.4 2 1 .3-.6 1-1 2-1 2.8 0 5 2 5 5.8 0 3.7-3 7.2-7 10.2z" />
          </svg>
          <span className="flex flex-col leading-tight">
            <b className="font-[family-name:var(--font-heading)] text-[1.1rem] text-[var(--vino)]">
              Alimenta tu Fertilidad
            </b>
            <span className="font-[family-name:var(--font-ui)] text-[.55rem] uppercase tracking-[.22em] text-[var(--tinta-suave)]">
              Cursos con Marcela Calderón
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 font-[family-name:var(--font-ui)] text-[.86rem]">
          <a
            href="https://www.alimentatufertilidad.com"
            className="text-[var(--tinta-suave)] hover:text-[var(--vino)]"
          >
            Volver al sitio principal
          </a>
        </nav>
      </div>
    </header>
  );
}
