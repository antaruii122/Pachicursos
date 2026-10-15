"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface CampusTab {
  href: string;
  label: string;
  // Rutas extra que también marcan esta pestaña como activa (ej. la clase
  // /cursos/... cuenta como parte de "Módulos").
  activoEn?: string[];
}

// Pestañas superiores del campus (diseño NUTFEM 2027): texto simple, la activa
// en negrita burdeos con subrayado rosa. Se desplazan en horizontal en celular.
export function CampusTabs({ tabs }: { tabs: CampusTab[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Campus" className="-mb-px flex gap-1 overflow-x-auto font-[family-name:var(--font-ui)] text-[.95rem]">
      {tabs.map((t) => {
        const activo =
          pathname === t.href || pathname.startsWith(`${t.href}/`) || (t.activoEn ?? []).some((p) => pathname.startsWith(p));
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={activo ? "page" : undefined}
            className={`whitespace-nowrap border-b-[3px] px-4 py-3.5 transition-colors duration-[var(--dur)] ${
              activo
                ? "border-[var(--rosa-fuerte)] font-semibold text-[var(--vino)]"
                : "border-transparent text-[var(--tinta-suave)] hover:text-[var(--vino)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
