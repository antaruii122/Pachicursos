"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/cuenta/perfil", label: "Resumen" },
  { href: "/cuenta/mis-cursos", label: "Mis cursos" },
  { href: "/cuenta/actividad", label: "Actividad" },
  { href: "/cuenta/seguridad", label: "Seguridad" },
];

export function AccountSubNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-[var(--linea)] bg-white">
      <nav className="mx-auto flex w-[min(1160px,90vw)] items-center gap-1 overflow-x-auto font-[family-name:var(--font-ui)] text-[.85rem]">
        {links.map((l) => {
          const activo = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap border-b-2 px-3 py-3.5 transition-colors ${
                activo
                  ? "border-[var(--vino)] font-medium text-[var(--vino)]"
                  : "border-transparent text-[var(--tinta-suave)] hover:text-[var(--vino)]"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--rosa)] px-4 py-1.5 font-medium text-[var(--carmin)] hover:bg-[var(--carmin)] hover:text-white"
          >
            Panel admin
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        )}
      </nav>
    </div>
  );
}
