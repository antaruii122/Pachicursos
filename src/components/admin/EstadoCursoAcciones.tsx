"use client";

import { setCourseEstado } from "@/app/admin/cursos/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Publicar/despublicar directo desde la lista de cursos (hallazgo de Ricardo
// 2026-09-30: creó un curso, fue a "Cursos" y no lo veía — estaba en
// borrador y nada le decía qué significaba ni dónde publicarlo).
export function EstadoCursoAcciones({
  id,
  slug,
  estado,
  faltan,
}: {
  id: string;
  slug: string;
  estado: string;
  faltan: string[];
}) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = async (nuevo: "publicado" | "despublicado") => {
    if (
      nuevo === "despublicado" &&
      !confirm("¿Despublicar? El curso deja de verse en la web (quien ya lo compró sigue viéndolo).")
    )
      return;
    setGuardando(true);
    setError(null);
    const r = await setCourseEstado(id, nuevo);
    setGuardando(false);
    if ("error" in r) setError(r.error);
    else router.refresh();
  };

  if (estado === "publicado") {
    return (
      <div className="flex flex-wrap items-center gap-3 font-[family-name:var(--font-ui)] text-[.78rem]">
        <span className="text-[var(--ok)]">● Visible en la web</span>
        <a
          href={`/cursos/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--vino)] underline underline-offset-4"
        >
          Ver en la web ↗
        </a>
        <button
          type="button"
          disabled={guardando}
          onClick={() => cambiar("despublicado")}
          className="text-[var(--tinta-suave)] underline underline-offset-4"
        >
          Despublicar
        </button>
        {error && (
          <span role="alert" className="text-[var(--dorado-osc)]">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 font-[family-name:var(--font-ui)] text-[.78rem]">
      <span className="text-[var(--tinta-suave)]">○ No se ve en la web (borrador)</span>
      {faltan.length === 0 ? (
        <button
          type="button"
          disabled={guardando}
          onClick={() => cambiar("publicado")}
          className="rounded-full bg-[var(--vino)] px-4 py-1.5 font-medium text-white transition-colors hover:bg-[var(--vino-claro)] disabled:opacity-60"
        >
          {guardando ? "Publicando..." : "Publicar ahora"}
        </button>
      ) : (
        <span className="text-[var(--dorado-osc)]">Para publicar falta: {faltan.join(", ")}</span>
      )}
      {error && (
        <span role="alert" className="text-[var(--dorado-osc)]">
          {error}
        </span>
      )}
    </div>
  );
}
