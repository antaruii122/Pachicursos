// LOGO ÚNICO de Alimenta tu Fertilidad (decisión de Ricardo, 2026-09-30).
// Es el ÚNICO lugar donde se dibuja el logo: header público, campus, admin,
// login y los "sin foto" lo importan de acá. El favicon (src/app/icon.svg)
// es la misma forma. `npm run lint` falla si aparece otro logo dibujado a
// mano en otro archivo (scripts/check-marca.mjs).
//
// Forma: aro con degradé ciruela → malva (tokens --aro-1/2/3 en globals.css)
// + "Alimenta tu Fertilidad" en serif + "CAMPUS" espaciado debajo.

import { useId } from "react";

export function LogoMark({ size = 30, className = "" }: { size?: number; className?: string }) {
  const id = `aro-${useId().replace(/:/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--aro-1)" />
          <stop offset="55%" stopColor="var(--aro-2)" />
          <stop offset="100%" stopColor="var(--aro-3)" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="12.5" fill="none" stroke={`url(#${id})`} strokeWidth="3" />
    </svg>
  );
}

export function Logo({ apilado = false }: { apilado?: boolean }) {
  if (apilado) {
    return (
      <span className="flex flex-col items-center">
        <LogoMark size={46} />
        <span className="mt-3 font-[family-name:var(--font-heading)] text-[1.45rem] leading-none tracking-[.01em] text-[var(--vino)]">
          Alimenta tu Fertilidad
        </span>
        <span className="mt-1.5 font-[family-name:var(--font-ui)] text-[.62rem] uppercase tracking-[.34em] text-[var(--tinta-suave)]">
          Campus
        </span>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <LogoMark size={30} />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate font-[family-name:var(--font-heading)] text-[1.02rem] tracking-[.01em] text-[var(--vino)]">
          Alimenta tu Fertilidad
        </span>
        <span className="mt-1 font-[family-name:var(--font-ui)] text-[.55rem] uppercase tracking-[.3em] text-[var(--tinta-suave)]">
          Campus
        </span>
      </span>
    </span>
  );
}
