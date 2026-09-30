import { campusCard } from "@/components/campus/ui";
import { TIPO_RECURSO, formatTamano, type Recurso } from "@/lib/recursos";

// "Material de la clase" — grilla 2×2 de la pantalla 3 de la maqueta
// (docs/maqueta-campus.md): badge de tipo, nombre + detalle, acción. Cada
// link pasa por /api/.../recursos/[id], que valida acceso antes de firmar
// la descarga — nunca hay una URL directa al archivo en el HTML.
export function ClassMaterials({
  courseSlug,
  videoId,
  recursos,
}: {
  courseSlug: string;
  videoId: string;
  recursos: Recurso[];
}) {
  if (recursos.length === 0) return null;
  return (
    <section className="mb-8" aria-labelledby="material-clase">
      <h2 id="material-clase" className="mb-3 text-[1.2rem] font-normal">
        Material de la clase
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {recursos.map((r) => {
          const tipo = TIPO_RECURSO[r.tipo];
          return (
            <li key={r.id}>
              <a
                href={`/api/courses/${courseSlug}/videos/${videoId}/recursos/${r.id}`}
                target={r.tipo === "link" || r.tipo === "img" ? "_blank" : undefined}
                rel={r.tipo === "link" ? "noopener noreferrer" : undefined}
                className={`${campusCard} group flex items-center gap-3 p-3 transition-[transform,box-shadow,border-color] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-0.5 hover:border-[var(--rosa)] hover:shadow-[var(--sombra-md)]`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radio-sm)] bg-[var(--rosa)] font-[family-name:var(--font-ui)] text-[.62rem] font-semibold tracking-wide text-[var(--vino)]">
                  {tipo.badge}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-[family-name:var(--font-ui)] text-[.86rem] text-[var(--tinta)]">
                    {r.nombre}
                  </span>
                  <span className="block text-[.74rem] text-[var(--tinta-suave)]">
                    {tipo.detalle}
                    {r.tamano ? ` · ${formatTamano(r.tamano)}` : ""}
                  </span>
                </span>
                <span className="font-[family-name:var(--font-ui)] text-[.78rem] font-medium text-[var(--vino)] group-hover:underline">
                  {tipo.accion}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
