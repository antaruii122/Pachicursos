import { campusCard } from "@/components/campus/ui";
import Link from "next/link";

export interface ClaseFila {
  orden: number;
  titulo: string;
  duracion: number | null;
  completada: boolean;
}

// Lista de clases de un módulo (o de un programa sin módulos): número de clase
// dentro del módulo, título, duración y estado. La clase "Sigue aquí" es la
// primera pendiente que coincide con la siguiente del programa.
export function ListaClases({
  slug,
  clases,
  siguienteOrden,
  prefijo = "Clase",
}: {
  slug: string;
  clases: ClaseFila[];
  siguienteOrden: number | null;
  prefijo?: string;
}) {
  if (clases.length === 0) {
    return (
      <div className={`${campusCard} p-6 text-[.95rem] text-[var(--tinta-suave)]`}>
        Las clases de este módulo todavía no están publicadas.
      </div>
    );
  }
  return (
    <ol className="divide-y divide-[var(--linea)] border border-[var(--linea)] bg-white">
      {clases.map((c, i) => {
        const esSiguiente = siguienteOrden === c.orden && !c.completada;
        return (
          <li key={c.orden}>
            <Link
              href={`/cursos/${slug}/clase/${c.orden}`}
              className={`flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-4 transition-colors duration-[var(--dur)] hover:bg-[var(--crema-2)] ${
                esSiguiente ? "bg-[var(--crema-2)]" : ""
              }`}
            >
              <span className="w-[4.5rem] shrink-0 font-[family-name:var(--font-ui)] text-[.82rem] font-bold text-[var(--carmin)]">
                {prefijo} {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-[family-name:var(--font-ui)] text-[.98rem] font-semibold leading-snug text-[var(--tinta)]">
                  {c.titulo}
                </span>
                {c.duracion ? (
                  <span className="mt-0.5 block font-[family-name:var(--font-ui)] text-[.78rem] text-[var(--tinta-suave)]">
                    {Math.round(c.duracion / 60)} min
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 font-[family-name:var(--font-ui)] text-[.8rem]">
                {c.completada ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--ok)]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    Completada
                  </span>
                ) : esSiguiente ? (
                  <span className="rounded-[3px] bg-[var(--rosa-fuerte)] px-3 py-1 font-bold uppercase tracking-[.05em] text-[var(--vino-osc)]">
                    Sigue aquí
                  </span>
                ) : (
                  <span className="text-[var(--tinta-suave)]">Pendiente</span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
