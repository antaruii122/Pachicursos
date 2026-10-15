// LOGO ÚNICO de NUTFEM (guía de estilo NUTFEM 2027, Pachi, 2026-10-16):
// corazón dentro de un aro de cuatro tramos + "ACADEMIA NUTFEM" y debajo
// "Campus Virtual". Reemplaza el aro de degradé ciruela (Ricardo, 2026-10-01).
// Es el ÚNICO lugar donde se dibuja el logo: header público, campus, admin,
// login y los "sin foto" lo importan de acá. El favicon (src/app/icon.svg)
// es la misma forma. `npm run lint` falla si aparece otro logo dibujado a
// mano en otro archivo (scripts/check-marca.mjs).
//
// Colores: tokens --aro-borde / --aro-1..4 / --corazon en globals.css.

export function LogoMark({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d="M16 16V.6A15.4 15.4 0 0 0 .6 16Z" fill="var(--aro-1)" />
      <path d="M16 16V.6A15.4 15.4 0 0 1 31.4 16Z" fill="var(--aro-2)" />
      <path d="M16 16H.6A15.4 15.4 0 0 0 16 31.4Z" fill="var(--aro-3)" />
      <path d="M16 16h15.4A15.4 15.4 0 0 1 16 31.4Z" fill="var(--aro-4)" />
      <circle cx="16" cy="16" r="15.6" fill="none" stroke="var(--aro-borde)" strokeWidth="0.9" />
      <circle cx="16" cy="16" r="10.2" fill="#fff" />
      <path
        d="M16 22.4C12 19.2 9.4 16.7 9.4 13.9c0-1.9 1.4-3.2 3.2-3.2 1.5 0 2.7.8 3.4 2 .7-1.2 1.9-2 3.4-2 1.8 0 3.2 1.3 3.2 3.2 0 2.8-2.6 5.3-6.6 8.5Z"
        fill="var(--corazon)"
      />
    </svg>
  );
}

export function Logo({ apilado = false }: { apilado?: boolean }) {
  if (apilado) {
    return (
      <span className="flex flex-col items-center">
        <LogoMark size={52} />
        <span className="mt-3 font-[family-name:var(--font-heading)] text-[1.05rem] font-bold uppercase leading-none tracking-[.1em] text-[var(--vino)]">
          Academia NUTFEM
        </span>
        <span className="mt-1.5 font-[family-name:var(--font-ui)] text-[.78rem] leading-none text-[var(--tinta-suave)]">
          Campus Virtual
        </span>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <LogoMark size={32} />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate font-[family-name:var(--font-heading)] text-[.86rem] font-bold uppercase tracking-[.1em] text-[var(--vino)]">
          Academia NUTFEM
        </span>
        <span className="mt-1 font-[family-name:var(--font-ui)] text-[.7rem] text-[var(--tinta-suave)]">
          Campus Virtual
        </span>
      </span>
    </span>
  );
}
