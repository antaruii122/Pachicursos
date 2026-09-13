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

  const clasesPorCurso = new Map<string, number>();
  if (cursos && cursos.length > 0) {
    const { data: clases } = await supabase
      .from("course_videos")
      .select("course_id")
      .in(
        "course_id",
        cursos.map((c) => c.id),
      );
    for (const cl of clases ?? []) {
      clasesPorCurso.set(cl.course_id, (clasesPorCurso.get(cl.course_id) ?? 0) + 1);
    }
  }

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
            <div
              key={c.id}
              className="flex flex-col gap-4 rounded-[14px] bg-white px-5 py-4 shadow-[0_8px_20px_rgba(78,15,38,.08)] sm:flex-row sm:items-center sm:justify-between"
            >
              <Link href={`/admin/cursos/${c.id}/editar`} className="min-w-0 flex-1 hover:opacity-80">
                <p className="font-[family-name:var(--font-ui)] text-[.95rem] font-medium text-[var(--tinta)]">
                  {c.titulo}
                </p>
                <p className="text-[.8rem] text-[var(--tinta-suave)]">/cursos/{c.slug}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="text-[.85rem] text-[var(--tinta-suave)]">{formatCLP(c.precio)}</span>
                  <span
                    className={`rounded-full px-3 py-1 font-[family-name:var(--font-ui)] text-[.72rem] uppercase tracking-wide ${ESTADO_COLOR[c.estado]}`}
                  >
                    {ESTADO_LABEL[c.estado]}
                  </span>
                </div>
              </Link>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/admin/cursos/${c.id}/clases`}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--carmin)] px-4 py-2 font-[family-name:var(--font-ui)] text-[.8rem] font-medium text-[var(--carmin)] hover:bg-[var(--rosa)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 10l4.5-2.5v9L15 14M4 7h9a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z" />
                  </svg>
                  Clases y videos ({clasesPorCurso.get(c.id) ?? 0})
                </Link>
                <Link
                  href={`/admin/cursos/${c.id}/accesos`}
                  className="rounded-full border border-[var(--linea)] px-4 py-2 font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--tinta-suave)] hover:border-[var(--vino)] hover:text-[var(--vino)]"
                >
                  Accesos y ventas
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
