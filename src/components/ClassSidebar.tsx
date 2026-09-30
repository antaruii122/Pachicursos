import { Eyebrow, ProgressBar, campusCard } from "@/components/campus/ui";
import { agruparPorModulo, formatDuracion, type Modulo } from "@/lib/types";
import Link from "next/link";

export interface ClassSidebarItem {
  id: string;
  orden: number;
  titulo: string;
  duracion: number | null;
  is_free_intro: boolean;
  module_id?: string | null;
}

interface ClassSidebarProps {
  courseSlug: string;
  courseTitulo: string;
  clases: ClassSidebarItem[];
  modulos?: Modulo[];
  currentOrden: number;
  hasPurchase: boolean;
  completedIds: Set<string>;
}

// Navegación de clases dentro del reproductor. Desde el 2026-09-30 sigue la
// pantalla 3 de la maqueta (docs/maqueta-campus.md): la tarjeta muestra el
// MÓDULO actual (título + % del módulo + sus clases), y el curso completo
// queda a un click en "Ver todo el curso". Un curso sin módulos muestra la
// lista completa como antes. Se renderiza dos veces (colapsable en mobile
// vía <details>, fija en desktop) para no necesitar JS de layout.
export function ClassSidebar(props: ClassSidebarProps) {
  const { clases, modulos = [], currentOrden, completedIds, courseTitulo } = props;
  const actual = clases.find((c) => c.orden === currentOrden);
  const modulosOrdenados = [...modulos].sort((a, b) => a.orden - b.orden);
  const moduloActual = actual?.module_id ? modulosOrdenados.find((m) => m.id === actual.module_id) : undefined;
  const numeroModulo = moduloActual ? modulosOrdenados.indexOf(moduloActual) + 1 : null;

  const delFoco = moduloActual ? clases.filter((c) => c.module_id === moduloActual.id) : clases;
  const hechas = delFoco.filter((c) => completedIds.has(c.id)).length;
  const pct = delFoco.length > 0 ? Math.round((hechas / delFoco.length) * 100) : 0;

  const cabecera = (
    <div className="px-2 pb-3 pt-1">
      <Eyebrow className="!text-[var(--tinta-suave)]">{moduloActual ? `Módulo ${numeroModulo}` : "Contenido del curso"}</Eyebrow>
      <p className="mt-1 font-[family-name:var(--font-heading)] text-[1.05rem] leading-snug text-[var(--vino)]">
        {moduloActual?.titulo ?? courseTitulo}
      </p>
      <ProgressBar pct={pct} className="mt-3" />
      <p className="mt-1.5 font-[family-name:var(--font-ui)] text-[.72rem] font-medium text-[var(--vino)]">
        {pct} % completado
        <span className="font-normal text-[var(--tinta-suave)]">
          {" "}
          · {hechas}/{delFoco.length}
        </span>
      </p>
    </div>
  );

  const cuerpo = (
    <>
      {cabecera}
      <ClassRows {...props} clases={delFoco} />
      {moduloActual && (
        <details className="group mt-3 border-t border-[var(--linea)] pt-2">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-[var(--radio-sm)] px-2 py-2 font-[family-name:var(--font-ui)] text-[.8rem] font-medium text-[var(--vino)] hover:bg-[var(--crema-2)]">
            Ver todo el curso
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="transition-transform duration-[var(--dur)] ease-[var(--ease)] group-open:rotate-180"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <div className="mt-2">
            <ClassRowsAgrupadas {...props} />
          </div>
        </details>
      )}
    </>
  );

  return (
    <>
      <details className={`${campusCard} mb-6 md:hidden`}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
          <span className="font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-[var(--vino)]">
            Clase {currentOrden} de {clases.length}
            {moduloActual ? ` · Módulo ${numeroModulo}` : ` · ${courseTitulo}`}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tinta-suave)" strokeWidth="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </summary>
        <div className="border-t border-[var(--linea)] p-3">{cuerpo}</div>
      </details>

      <aside className="hidden w-[310px] shrink-0 md:order-last md:block" aria-label="Clases del curso">
        <div className={`${campusCard} sticky top-[92px] max-h-[calc(100svh-110px)] overflow-y-auto p-3`}>{cuerpo}</div>
      </aside>
    </>
  );
}

function ClassRowsAgrupadas(props: ClassSidebarProps) {
  const modulos = props.modulos ?? [];
  const ordenados = [...modulos].sort((a, b) => a.orden - b.orden);
  return (
    <div className="flex flex-col gap-3">
      {agruparPorModulo(props.clases, modulos)
        .filter((g) => g.clases.length > 0)
        .map((g) => (
          <div key={g.modulo?.id ?? "sin-modulo"}>
            {g.modulo && (
              <p className="px-2 pb-1 font-[family-name:var(--font-ui)] text-[.68rem] font-semibold uppercase tracking-[.08em] text-[var(--carmin)]">
                Módulo {ordenados.findIndex((m) => m.id === g.modulo!.id) + 1} · {g.modulo.titulo}
              </p>
            )}
            <ClassRows {...props} clases={g.clases} />
          </div>
        ))}
    </div>
  );
}

function ClassRows({ courseSlug, clases, currentOrden, hasPurchase, completedIds }: ClassSidebarProps) {
  return (
    <div className="flex flex-col gap-1">
      {clases.map((c) => {
        const accesible = c.is_free_intro || hasPurchase;
        const esActual = c.orden === currentOrden;
        const completada = completedIds.has(c.id);

        return (
          <Link
            key={c.id}
            href={`/cursos/${courseSlug}/clase/${c.orden}`}
            aria-current={esActual ? "page" : undefined}
            className={`flex items-center gap-3 rounded-[var(--radio-sm)] px-2.5 py-2 transition-colors duration-[var(--dur)] ${
              esActual ? "bg-[var(--rosa)]" : "hover:bg-[var(--crema-2)]"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                completada
                  ? "bg-[var(--vino)]"
                  : esActual
                    ? "border-2 border-[var(--vino)] bg-white"
                    : "border border-[var(--linea)] bg-white"
              }`}
            >
              {completada ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-label="Completada">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : !accesible ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--tinta-suave)" strokeWidth="2" aria-label="Bloqueada">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 018 0v3" />
                </svg>
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block font-[family-name:var(--font-ui)] text-[.82rem] leading-snug ${
                  esActual ? "font-semibold text-[var(--vino)]" : "text-[var(--tinta)]"
                }`}
              >
                {c.orden}. {c.titulo}
              </span>
              {c.duracion && (
                <span className="block text-[.7rem] text-[var(--tinta-suave)]">{formatDuracion(c.duracion)}</span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
