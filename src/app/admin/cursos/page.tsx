import { createClient } from "@/lib/supabase/server";
import { formatCLP } from "@/lib/types";
import Link from "next/link";

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  despublicado: "Despublicado",
  archivado: "Archivado",
};

const ESTADO_COLOR: Record<string, string> = {
  borrador: "bg-[var(--rosa)] text-[var(--carmin)]",
  publicado: "bg-[var(--vino)] text-white",
  despublicado: "bg-[var(--linea)] text-[var(--tinta-suave)]",
  archivado: "bg-[var(--linea)] text-[var(--tinta-suave)]",
};

export default async function AdminCursosPage() {
  const supabase = await createClient();
  const { data: cursos } = await supabase
    .from("courses")
    .select("id, slug, titulo, estado, precio")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold text-[var(--vino)]">
          Cursos
        </h1>
        <Link
          href="/admin/cursos/nuevo"
          className="rounded-full bg-[var(--vino)] px-5 py-2.5 font-[family-name:var(--font-ui)] text-[.88rem] font-medium text-white hover:bg-[var(--vino-claro)]"
        >
          + Nuevo curso
        </Link>
      </div>

      {!cursos || cursos.length === 0 ? (
        <p className="text-sm text-[var(--tinta-suave)]">Todavía no hay cursos creados.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {cursos.map((c) => (
            <Link
              key={c.id}
              href={`/admin/cursos/${c.id}/editar`}
              className="flex items-center justify-between rounded-[14px] bg-white px-5 py-4 shadow-[0_8px_20px_rgba(78,15,38,.08)] hover:shadow-[0_8px_24px_rgba(78,15,38,.14)]"
            >
              <div>
                <p className="font-[family-name:var(--font-ui)] text-[.95rem] font-medium text-[var(--tinta)]">
                  {c.titulo}
                </p>
                <p className="text-[.8rem] text-[var(--tinta-suave)]">/cursos/{c.slug}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[.9rem] text-[var(--tinta-suave)]">{formatCLP(c.precio)}</span>
                <span
                  className={`rounded-full px-3 py-1 font-[family-name:var(--font-ui)] text-[.72rem] uppercase tracking-wide ${ESTADO_COLOR[c.estado]}`}
                >
                  {ESTADO_LABEL[c.estado]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
