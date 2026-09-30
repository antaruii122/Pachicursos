"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface CampusNavLink {
  href: string;
  label: string;
  // Rutas extra que también marcan este link como activo (ej. /cursos/...
  // es parte de "Mis clases").
  activoEn?: string[];
}

// Navegación en píldoras del campus (maqueta: Mi Campus · Módulos y clases ·
// Materiales · …). La píldora activa lleva fondo blush.
export function CampusNav({ links, className = "" }: { links: CampusNavLink[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Campus" className={`flex items-center gap-1 overflow-x-auto font-[family-name:var(--font-ui)] text-[.82rem] ${className}`}>
      {links.map((l) => {
        const activo = pathname === l.href || (l.activoEn ?? []).some((p) => pathname.startsWith(p));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={activo ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 transition-colors duration-[var(--dur)] ${
              activo
                ? "bg-[var(--rosa)] font-medium text-[var(--vino)]"
                : "text-[var(--tinta-suave)] hover:bg-[var(--crema-2)] hover:text-[var(--vino)]"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
