import { formatDuracion } from "@/lib/types";
import Link from "next/link";

export interface ClassSidebarItem {
  id: string;
  orden: number;
  titulo: string;
  duracion: number | null;
  is_free_intro: boolean;
}

interface ClassSidebarProps {
  courseSlug: string;
  courseTitulo: string;
  clases: ClassSidebarItem[];
  currentOrden: number;
  hasPurchase: boolean;
  completedIds: Set<string>;
}

// Navegación de clases dentro del reproductor (hallazgo 2026-09-12: no
// existía ninguna forma de pasar de una clase a otra sin volver a la landing
// de venta — el patrón real de cualquier plataforma de cursos es una lista
// persistente al lado del player, no un componente nuevo por página). Se
// renderiza dos veces (colapsable en mobile vía <details>, fija en desktop)
// para no necesitar JS de layout — mismo patrón de <details>/<summary> ya
// usado en el acordeón de FAQ de CourseLanding.
export function ClassSidebar(props: ClassSidebarProps) {
  return (
    <>
      <details className="mb-6 rounded-[14px] bg-white shadow-[0_8px_20px_rgba(78,15,38,.08)] md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
          <span className="font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-[var(--vino)]">
            Clase {props.currentOrden} de {props.clases.length} · {props.courseTitulo}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tinta-suave)" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </summary>
        <div className="border-t border-[var(--linea)] p-3">
          <ClassRows {...props} />
        </div>
      </details>

      <aside className="hidden w-[300px] shrink-0 md:block">
        <div className="sticky top-[92px] rounded-[14px] bg-white p-3 shadow-[0_8px_20px_rgba(78,15,38,.08)]">
          <p className="mb-2 px-2 pt-1 font-[family-name:var(--font-ui)] text-[.72rem] font-semibold uppercase tracking-[.08em] text-[var(--tinta-suave)]">
            Contenido del curso
          </p>
          <ClassRows {...props} />
        </div>
      </aside>
    </>
  );
}

function ClassRows({ courseSlug, clases, currentOrden, hasPurchase, completedIds }: ClassSidebarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {clases.map((c) => {
        const accesible = c.is_free_intro || hasPurchase;
        const esActual = c.orden === currentOrden;
        const completada = completedIds.has(c.id);

        return (
          <Link
            key={c.id}
            href={`/cursos/${courseSlug}/clase/${c.orden}`}
            aria-current={esActual ? "true" : undefined}
            className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition ${
              esActual ? "bg-[var(--vino)]" : "hover:bg-[var(--crema-2)]"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                esActual ? "bg-white/15" : completada ? "bg-[var(--rosa)]" : "bg-[var(--crema-2)]"
              }`}
            >
              {completada ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={esActual ? "#fff" : "var(--carmin)"} strokeWidth="2.5">
                  <path d="M4 12l6 6 10-12" />
                </svg>
              ) : accesible ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill={esActual ? "#fff" : "var(--carmin)"}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={esActual ? "#fff" : "var(--tinta-suave)"} strokeWidth="1.8">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 018 0v3" />
                </svg>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate font-[family-name:var(--font-ui)] text-[.85rem] ${
                  esActual ? "font-medium text-white" : "text-[var(--tinta)]"
                }`}
              >
                {c.orden}. {c.titulo}
              </span>
              {c.duracion && (
                <span className={`block text-[.72rem] ${esActual ? "text-white/70" : "text-[var(--tinta-suave)]"}`}>
                  {formatDuracion(c.duracion)}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
