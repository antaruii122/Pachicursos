"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Sub-navegación DENTRO de Mi perfil (pedido de Ricardo 2026-09-30: Actividad
// y Seguridad son parte del perfil, no pestañas del menú principal).
const TABS = [
  { href: "/cuenta/perfil", label: "Resumen" },
  { href: "/cuenta/actividad", label: "Actividad" },
  { href: "/cuenta/perfil#seguridad", label: "Seguridad" },
];

export function PerfilTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Mi perfil" className="mb-6 flex gap-1 border-b border-[var(--linea)] font-[family-name:var(--font-ui)] text-[.85rem]">
      {TABS.map((t) => {
        const activo = !t.href.includes("#") && pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={activo ? "page" : undefined}
            className={`-mb-px border-b-2 px-3.5 py-2.5 transition-colors ${
              activo
                ? "border-[var(--vino)] font-medium text-[var(--vino)]"
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
