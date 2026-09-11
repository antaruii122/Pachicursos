"use client";

import { addClase, deleteClase, setClaseGratis, swapClaseOrden } from "@/app/admin/cursos/[id]/clases/actions";
import { VideoUploadWidget } from "@/components/VideoUploadWidget";
import { formatDuracion } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

const card = "rounded-[14px] bg-white p-6 shadow-[0_8px_20px_rgba(78,15,38,.08)]";

const ESTADO_LABEL: Record<string, string> = {
  subiendo: "Subiendo",
  procesando: "Procesando",
  listo: "Listo",
};
const ESTADO_COLOR: Record<string, string> = {
  subiendo: "bg-[var(--rosa)] text-[var(--carmin)]",
  procesando: "bg-[var(--dorado)] text-[var(--vino)]",
  listo: "bg-[var(--vino)] text-white",
};

interface Clase {
  id: string;
  orden: number;
  titulo: string;
  duracion: number | null;
  is_free_intro: boolean;
  estado_procesamiento: "subiendo" | "procesando" | "listo";
}

export function ClaseManager({ courseId, clases }: { courseId: string; clases: Clase[] }) {
  const router = useRouter();
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoEsGratis, setNuevoEsGratis] = useState(clases.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);

  const ordenadas = [...clases].sort((a, b) => a.orden - b.orden);

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) return;
    setAgregando(true);
    setError(null);
    const result = await addClase(courseId, nuevoTitulo.trim(), nuevoEsGratis);
    setAgregando(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setNuevoTitulo("");
    setNuevoEsGratis(false);
    router.refresh();
  };

  const handleMover = async (i: number, direccion: -1 | 1) => {
    const j = i + direccion;
    if (j < 0 || j >= ordenadas.length) return;
    setError(null);
    const a = ordenadas[i];
    const b = ordenadas[j];
    const result = await swapClaseOrden(courseId, a.id, a.orden, b.id, b.orden);
    if ("error" in result) setError(result.error);
    else router.refresh();
  };

  const handleGratis = async (claseId: string) => {
    setError(null);
    const result = await setClaseGratis(courseId, claseId);
    if ("error" in result) setError(result.error);
    else router.refresh();
  };

  const handleBorrar = async (clase: Clase) => {
    if (
      !confirm(
        `¿Borrar la clase "${clase.titulo}"? Esto también borrará las notas personales que hayan escrito los alumnos en esta clase. No se puede deshacer.`,
      )
    )
      return;
    setError(null);
    const result = await deleteClase(courseId, clase.id);
    if ("error" in result) setError(result.error);
    else router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-[var(--dorado-osc)]">{error}</p>}

      <div className={card}>
        <h2 className="mb-4 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
          Clases ({ordenadas.length})
        </h2>
        {ordenadas.length === 0 ? (
          <p className="text-sm text-[var(--tinta-suave)]">Todavía no hay clases.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {ordenadas.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  c.is_free_intro ? "border-[var(--carmin)]" : "border-[var(--linea)]"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => handleMover(i, -1)}
                    className="text-[var(--tinta-suave)] disabled:opacity-25"
                    aria-label="Subir"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={i === ordenadas.length - 1}
                    onClick={() => handleMover(i, 1)}
                    className="text-[var(--tinta-suave)] disabled:opacity-25"
                    aria-label="Bajar"
                  >
                    ▼
                  </button>
                </div>

                <div className="flex-1">
                  <p className="font-[family-name:var(--font-ui)] text-[.9rem]">
                    {c.orden}. {c.titulo}
                  </p>
                  {c.duracion && (
                    <p className="text-[.78rem] text-[var(--tinta-suave)]">{formatDuracion(c.duracion)}</p>
                  )}
                </div>

                {c.is_free_intro ? (
                  <span className="rounded-full bg-[var(--rosa)] px-3 py-1 font-[family-name:var(--font-ui)] text-[.72rem] uppercase text-[var(--carmin)]">
                    Gratis
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleGratis(c.id)}
                    className="text-[.78rem] text-[var(--tinta-suave)] underline"
                  >
                    Marcar gratis
                  </button>
                )}

                <span
                  className={`rounded-full px-3 py-1 font-[family-name:var(--font-ui)] text-[.72rem] uppercase ${ESTADO_COLOR[c.estado_procesamiento]}`}
                >
                  {ESTADO_LABEL[c.estado_procesamiento]}
                </span>

                <button
                  type="button"
                  onClick={() => handleBorrar(c)}
                  className="text-[.8rem] text-[var(--dorado-osc)]"
                >
                  Borrar
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAgregar} className="mt-5 flex items-end gap-3 border-t border-[var(--linea)] pt-5">
          <div className="flex-1">
            <label className="mb-1 block font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--vino)]">
              Título de la nueva clase
            </label>
            <input
              className="w-full rounded-lg border border-[var(--linea)] px-3 py-2 text-sm outline-none focus:border-[var(--carmin)]"
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-1.5 pb-2 text-[.8rem] text-[var(--tinta-suave)]">
            <input
              type="checkbox"
              checked={nuevoEsGratis}
              onChange={(e) => setNuevoEsGratis(e.target.checked)}
            />
            Gratis
          </label>
          <button
            type="submit"
            disabled={agregando || !nuevoTitulo.trim()}
            className="rounded-full bg-[var(--vino)] px-5 py-2 font-[family-name:var(--font-ui)] text-[.85rem] text-white disabled:opacity-50"
          >
            + Agregar
          </button>
        </form>
      </div>

      {ordenadas.length > 0 && (
        <div>
          <h2 className="mb-3 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
            Subir / reemplazar video
          </h2>
          <VideoUploadWidget clases={ordenadas} />
        </div>
      )}
    </div>
  );
}
