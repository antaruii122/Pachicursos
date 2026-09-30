import Link from "next/link";

// El logo vive SOLO en components/brand/Logo.tsx; se re-exporta con los
// nombres que ya usan las pantallas del campus.
export { Logo as CampusLogo, LogoMark as CampusRing } from "@/components/brand/Logo";

// Piezas visuales compartidas del campus privado (plan 2026-09-30,
// docs/plan-campus.md, Paso 0). Una sola fuente para anillo/barra de
// progreso, eyebrows y tarjetas — las pantallas de login, Mi Campus, clase y
// admin las reutilizan en vez de inventar su propio estilo cada una.
// Server-safe: sin hooks, se pueden usar desde Server Components.

export const campusCard =
  "rounded-[var(--radio-lg)] border border-[var(--linea)] bg-white shadow-[var(--sombra-sm)]";

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`block font-[family-name:var(--font-ui)] text-[.68rem] font-semibold uppercase tracking-[.18em] text-[var(--carmin)] ${className}`}
    >
      {children}
    </span>
  );
}

// Anillo de progreso. El trazo se anima desde 0 (clase .anillo-progreso en
// globals.css, solo si el usuario no pidió movimiento reducido).
export function ProgressRing({
  pct,
  size = 112,
  stroke = 9,
  label = "avance",
  segmentos = 1,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  label?: string;
  // Como en la maqueta: la pista del anillo se divide en un tramo por módulo.
  segmentos?: number;
}) {
  const valor = Math.max(0, Math.min(100, Math.round(pct)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - valor / 100);
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${valor}% de ${label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--rosa)"
          strokeWidth={stroke}
          strokeDasharray={segmentos > 1 ? `${c / segmentos - 4} 4` : undefined}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--vino)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="anillo-progreso"
          style={{ ["--anillo-desde" as string]: c }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-[family-name:var(--font-heading)] text-[var(--vino)]" style={{ fontSize: Math.round(size * 0.24) }}>
          {valor}%
        </span>
        {size >= 90 && (
          <span className="mt-1 font-[family-name:var(--font-ui)] text-[.66rem] text-[var(--tinta-suave)]">{label}</span>
        )}
      </div>
    </div>
  );
}

export function ProgressBar({ pct, className = "" }: { pct: number; className?: string }) {
  const valor = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-[var(--rosa)] ${className}`}
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="barra-progreso h-full rounded-full bg-[var(--vino)]"
        style={{ width: `${valor}%` }}
      />
    </div>
  );
}

export function StatBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="block font-[family-name:var(--font-ui)] text-[.62rem] font-semibold uppercase tracking-[.14em] text-[var(--tinta-suave)]">
        {label}
      </span>
      <span className="font-[family-name:var(--font-ui)] text-[.92rem] font-semibold text-[var(--tinta)]">{value}</span>
    </div>
  );
}

export function ShortcutCard({
  href,
  titulo,
  detalle,
  destacado = false,
}: {
  href: string;
  titulo: string;
  detalle: string;
  destacado?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${campusCard} group flex items-start justify-between gap-3 p-4 transition-[transform,box-shadow,border-color] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-0.5 hover:border-[var(--rosa)] hover:shadow-[var(--sombra-md)]`}
    >
      <span>
        <span className="block font-[family-name:var(--font-heading)] text-[1.05rem] text-[var(--vino)]">{titulo}</span>
        <span className={`block text-[.78rem] ${destacado ? "font-medium text-[var(--carmin)]" : "text-[var(--tinta-suave)]"}`}>
          {detalle}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="mt-1 text-[var(--vino)] transition-transform duration-[var(--dur)] ease-[var(--ease)] group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
