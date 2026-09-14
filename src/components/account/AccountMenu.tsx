"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Reemplaza la fila plana de links de texto que había antes en el header
// (2026-09-14 — no existía ningún concepto real de "mi cuenta", solo links
// sueltos). Sin librería, un dropdown a mano igual que el resto del sitio.
export function AccountMenu({
  nombre,
  email,
  isAdmin,
}: {
  nombre: string;
  email: string | null;
  isAdmin: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (!abierto) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [abierto]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--vino)] font-[family-name:var(--font-ui)] text-[.85rem] font-semibold text-white transition hover:bg-[var(--vino-claro)]"
      >
        {inicial}
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-30 w-64 overflow-hidden rounded-[14px] bg-white shadow-[var(--sombra-xl)] ring-1 ring-[var(--linea)]"
        >
          <div className="border-b border-[var(--linea)] px-4 py-3">
            <p className="truncate font-[family-name:var(--font-ui)] text-[.88rem] font-medium text-[var(--tinta)]">
              {nombre}
            </p>
            {email && <p className="truncate text-[.75rem] text-[var(--tinta-suave)]">{email}</p>}
          </div>
          <nav className="flex flex-col py-1.5 text-[.85rem]">
            <Link
              href="/cuenta/perfil"
              onClick={() => setAbierto(false)}
              className="px-4 py-2 text-[var(--tinta)] hover:bg-[var(--crema-2)]"
            >
              Mi perfil
            </Link>
            <Link
              href="/cuenta/mis-cursos"
              onClick={() => setAbierto(false)}
              className="px-4 py-2 text-[var(--tinta)] hover:bg-[var(--crema-2)]"
            >
              Mis cursos
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setAbierto(false)}
                className="px-4 py-2 font-medium text-[var(--carmin)] hover:bg-[var(--rosa)]"
              >
                Panel admin
              </Link>
            )}
          </nav>
          <div className="border-t border-[var(--linea)] py-1.5">
            <Link
              href="/cuenta/logout"
              className="block px-4 py-2 text-[.85rem] text-[var(--tinta-suave)] hover:bg-[var(--crema-2)]"
            >
              Cerrar sesión
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
