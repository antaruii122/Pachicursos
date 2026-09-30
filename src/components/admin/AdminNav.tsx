"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Resumen", exacto: true },
  { href: "/admin/usuarios", label: "Alumnas y usuarios" },
  { href: "/admin/cursos", label: "Cursos y contenidos" },
  { href: "/admin/preguntas", label: "Preguntas" },
  { href: "/admin/ventas", label: "Ventas y accesos" },
];

// Navegación lateral del panel admin (pantalla 4 de la maqueta): ítem activo
// con fondo blush, "Ver el campus como alumna" separado abajo.
export function AdminNav({ horizontal = false, pendientes = 0 }: { horizontal?: boolean; pendientes?: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Panel de administración"
      className={`font-[family-name:var(--font-ui)] text-[.84rem] ${
        horizontal ? "flex gap-1 overflow-x-auto" : "flex flex-col gap-0.5"
      }`}
    >
      {links.map((l) => {
        const activo = l.exacto ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={activo ? "page" : undefined}
            className={`whitespace-nowrap rounded-[var(--radio-sm)] px-3 py-2 transition-colors duration-[var(--dur)] ${
              activo
                ? "bg-[var(--rosa)] font-medium text-[var(--vino)]"
                : "text-[var(--tinta)] hover:bg-[var(--crema-2)] hover:text-[var(--vino)]"
            }`}
          >
            {l.label}
            {l.href === "/admin/preguntas" && pendientes > 0 && (
              <span className="ml-2 rounded-full bg-[var(--vino)] px-1.5 py-px text-[.68rem] text-white" aria-label={`${pendientes} sin responder`}>
                {pendientes}
              </span>
            )}
          </Link>
        );
      })}
      {!horizontal && <hr className="my-3 border-[var(--linea)]" />}
      <Link
        href="/cuenta/mis-cursos"
        className="whitespace-nowrap rounded-[var(--radio-sm)] px-3 py-2 text-[var(--tinta-suave)] transition-colors hover:bg-[var(--crema-2)] hover:text-[var(--vino)]"
      >
        Ver el campus como alumna
      </Link>
    </nav>
  );
}
