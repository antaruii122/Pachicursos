"use client";

import {
  addClase,
  addModulo,
  deleteClase,
  deleteModulo,
  renameModulo,
  setClaseGratis,
  setClaseModulo,
  swapClaseOrden,
  swapModuloOrden,
} from "@/app/admin/cursos/[id]/clases/actions";
import { MaterialesManager } from "@/components/admin/MaterialesManager";
import { VimeoLinkWidget } from "@/components/admin/VimeoLinkWidget";
import { VideoUploadWidget } from "@/components/VideoUploadWidget";
import { parseRecursos } from "@/lib/recursos";
import { agruparPorModulo, formatDuracion, type Modulo } from "@/lib/types";
import { useState } from "react";

const card = "rounded-[14px] bg-white p-6 shadow-[var(--sombra-md)]";

const ESTADO_LABEL: Record<string, string> = {
  subiendo: "Sin video", // estado inicial de toda clase nueva: nada subiéndose todavía
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
  module_id: string | null;
  resources: unknown;
}

export function ClaseManager({
  courseId,
  clases,
  modulos,
}: {
  courseId: string;
  clases: Clase[];
  modulos: Modulo[];
}) {
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoEsGratis, setNuevoEsGratis] = useState(clases.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  // Bloquea TODAS las flechas mientras un movimiento se guarda: dos clicks
  // rápidos lanzaban dos intercambios en paralelo (bug real 2026-09-30).
  const [moviendo, setMoviendo] = useState(false);
  const [nuevoModuloId, setNuevoModuloId] = useState<string>("");
  const [nuevoModulo, setNuevoModulo] = useState("");
  const [editandoModulo, setEditandoModulo] = useState<string | null>(null);
  const [tituloModulo, setTituloModulo] = useState("");

  const ordenadas = [...clases].sort((a, b) => a.orden - b.orden);
  const grupos = agruparPorModulo(ordenadas, modulos);
  const modulosOrdenados = [...modulos].sort((a, b) => a.orden - b.orden);

  const run = async (p: Promise<{ ok: true } | { error: string }>) => {
    setError(null);
    const result = await p;
    if ("error" in result) {
      setError(result.error);
      return false;
    }
    // Sin router.refresh(): la acción ya hace revalidatePath y trae la página
    // actualizada en la misma respuesta (refrescar de nuevo duplicaba la espera).
    return true;
  };

  const [creandoModulo, setCreandoModulo] = useState(false);
  const handleAgregarModulo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoModulo.trim() || creandoModulo) return;
    setCreandoModulo(true);
    if (await run(addModulo(courseId, nuevoModulo.trim()))) setNuevoModulo("");
    setCreandoModulo(false);
  };

  const handleMoverModulo = async (i: number, direccion: -1 | 1) => {
    const a = modulosOrdenados[i];
    const b = modulosOrdenados[i + direccion];
    if (!a || !b || moviendo) return;
    setMoviendo(true);
    await run(swapModuloOrden(courseId, a.id, a.orden, b.id, b.orden));
    setMoviendo(false);
  };

  const handleGuardarModulo = async (moduloId: string) => {
    if (!tituloModulo.trim()) return;
    if (await run(renameModulo(courseId, moduloId, tituloModulo.trim()))) setEditandoModulo(null);
  };

  const handleBorrarModulo = (m: Modulo) => {
    if (!confirm(`¿Borrar el módulo "${m.titulo}"? Sus clases NO se borran: quedan sin módulo.`)) return;
    run(deleteModulo(courseId, m.id));
  };

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) return;
    setAgregando(true);
    setError(null);
    const result = await addClase(courseId, nuevoTitulo.trim(), nuevoEsGratis, nuevoModuloId || null);
    setAgregando(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setNuevoTitulo("");
    setNuevoEsGratis(false);
  };

  // Solo dentro del mismo módulo; para cambiar de módulo está el selector.
  const handleMover = async (grupo: Clase[], i: number, direccion: -1 | 1) => {
    const j = i + direccion;
    if (j < 0 || j >= grupo.length) return;
    setError(null);
    if (moviendo) return;
    const a = grupo[i];
    const b = grupo[j];
    setMoviendo(true);
    const result = await swapClaseOrden(courseId, a.id, a.orden, b.id, b.orden);
    if ("error" in result) setError(result.error);
    setMoviendo(false);
  };

  const handleGratis = async (claseId: string) => {
    setError(null);
    const result = await setClaseGratis(courseId, claseId);
    if ("error" in result) setError(result.error);
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
  };

  const [claseAbierta, setClaseAbierta] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {error && <p role="alert" className="text-sm text-[var(--dorado-osc)]">{error}</p>}

      <div className={card}>
        <h2 className="mb-1 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
          Clases ({ordenadas.length})
        </h2>
        {ordenadas.length > 0 && (
          <p className="mb-4 text-[.8rem] text-[var(--tinta-suave)]">
            Toca <b>Video y material</b> en cualquier clase para subir el video, vincular uno de Vimeo, o agregar PDF, presentaciones y enlaces.
          </p>
        )}
        {ordenadas.length === 0 && modulos.length === 0 ? (
          <p className="text-sm text-[var(--tinta-suave)]">Todavía no hay clases.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {grupos.map((grupo) => {
              const m = grupo.modulo;
              const iModulo = m ? modulosOrdenados.findIndex((x) => x.id === m.id) : -1;
              return (
              <section key={m?.id ?? "sin-modulo"} aria-label={m ? `Módulo ${m.titulo}` : "Clases sin módulo"}>
                {m ? (
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-[var(--crema-2)] px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <button type="button" disabled={iModulo === 0 || moviendo} onClick={() => handleMoverModulo(iModulo, -1)} className="text-[.7rem] text-[var(--tinta-suave)] disabled:opacity-25" aria-label={`Subir módulo ${m.titulo}`}>▲</button>
                      <button type="button" disabled={iModulo === modulosOrdenados.length - 1 || moviendo} onClick={() => handleMoverModulo(iModulo, 1)} className="text-[.7rem] text-[var(--tinta-suave)] disabled:opacity-25" aria-label={`Bajar módulo ${m.titulo}`}>▼</button>
                    </div>
                    {editandoModulo === m.id ? (
                      <form
                        className="flex flex-1 items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleGuardarModulo(m.id);
                        }}
                      >
                        <input
                          aria-label="Nombre del módulo"
                          autoFocus
                          className="flex-1 rounded-lg border border-[var(--linea)] bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--carmin)]"
                          value={tituloModulo}
                          onChange={(e) => setTituloModulo(e.target.value)}
                        />
                        <button type="submit" className="text-[.8rem] font-medium text-[var(--vino)]">Guardar</button>
                        <button type="button" onClick={() => setEditandoModulo(null)} className="text-[.8rem] text-[var(--tinta-suave)]">Cancelar</button>
                      </form>
                    ) : (
                      <>
                        <p className="flex-1 font-[family-name:var(--font-ui)] text-[.9rem] font-semibold text-[var(--vino)]">
                          Módulo {iModulo + 1} · {m.titulo}
                          <span className="ml-2 font-normal text-[var(--tinta-suave)]">({grupo.clases.length} clases)</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoModulo(m.id);
                            setTituloModulo(m.titulo);
                          }}
                          className="text-[.78rem] text-[var(--tinta-suave)] underline"
                        >
                          Renombrar
                        </button>
                        <button type="button" onClick={() => handleBorrarModulo(m)} className="text-[.78rem] text-[var(--dorado-osc)]">
                          Borrar módulo
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  modulos.length > 0 && (
                    <p className="mb-2 px-1 font-[family-name:var(--font-ui)] text-[.75rem] font-semibold uppercase tracking-[.08em] text-[var(--tinta-suave)]">
                      Sin módulo (se muestran primero)
                    </p>
                  )
                )}
                {grupo.clases.length === 0 && (
                  <p className="px-3 text-[.8rem] text-[var(--tinta-suave)]">Este módulo todavía no tiene clases.</p>
                )}
                <div className="flex flex-col gap-2">
            {grupo.clases.map((c, i) => (
              <div
                key={c.id}
                className={`rounded-lg border ${c.is_free_intro ? "border-[var(--carmin)]" : "border-[var(--linea)]"}`}
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={i === 0 || moviendo}
                      onClick={() => handleMover(grupo.clases, i, -1)}
                      className="text-[var(--tinta-suave)] disabled:opacity-25"
                      aria-label="Subir"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={i === grupo.clases.length - 1 || moviendo}
                      onClick={() => handleMover(grupo.clases, i, 1)}
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

                  {modulos.length > 0 && (
                    <select
                      aria-label={`Módulo de la clase ${c.titulo}`}
                      value={c.module_id ?? ""}
                      onChange={(e) => run(setClaseModulo(courseId, c.id, e.target.value || null))}
                      className="max-w-[160px] rounded-lg border border-[var(--linea)] bg-white px-2 py-1 text-[.78rem] text-[var(--tinta)]"
                    >
                      <option value="">Sin módulo</option>
                      {modulosOrdenados.map((mo) => (
                        <option key={mo.id} value={mo.id}>
                          {mo.titulo}
                        </option>
                      ))}
                    </select>
                  )}

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
                    onClick={() => setClaseAbierta(claseAbierta === c.id ? null : c.id)}
                    className={`rounded-full px-3 py-1 font-[family-name:var(--font-ui)] text-[.78rem] font-medium ${
                      claseAbierta === c.id ? "bg-[var(--vino)] text-white" : "bg-[var(--rosa)] text-[var(--carmin)]"
                    }`}
                  >
                    Video y material
                    {parseRecursos(c.resources).length > 0 && (
                      <span className="ml-1.5 rounded-full bg-white/80 px-1.5 text-[.68rem] text-[var(--vino)]">
                        {parseRecursos(c.resources).length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBorrar(c)}
                    className="text-[.8rem] text-[var(--dorado-osc)]"
                  >
                    Borrar
                  </button>
                </div>

                {claseAbierta === c.id && (
                  <div className="flex flex-col gap-3 border-t border-[var(--linea)] p-3">
                    <VideoUploadWidget claseId={c.id} />
                    <VimeoLinkWidget courseId={courseId} claseId={c.id} />
                    <div className="border-t border-[var(--linea)] pt-3">
                      <MaterialesManager courseId={courseId} claseId={c.id} recursos={parseRecursos(c.resources)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
                </div>
              </section>
              );
            })}
          </div>
        )}

        <form onSubmit={handleAgregarModulo} className="mt-5 flex items-end gap-3 border-t border-[var(--linea)] pt-5">
          <div className="flex-1">
            <label htmlFor="nuevo-modulo-titulo" className="mb-1 block font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--vino)]">
              Nuevo módulo (opcional — agrupa clases, ej. &quot;Tu ciclo&quot;)
            </label>
            <input
              id="nuevo-modulo-titulo"
              className="w-full rounded-lg border border-[var(--linea)] px-3 py-2 text-sm outline-none focus:border-[var(--carmin)]"
              value={nuevoModulo}
              onChange={(e) => setNuevoModulo(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={!nuevoModulo.trim() || creandoModulo}
            className="rounded-full border border-[var(--vino)] px-5 py-2 font-[family-name:var(--font-ui)] text-[.85rem] text-[var(--vino)] disabled:opacity-50"
          >
            {creandoModulo ? "Creando…" : "+ Módulo"}
          </button>
        </form>

        <form onSubmit={handleAgregar} className="mt-5 flex items-end gap-3 border-t border-[var(--linea)] pt-5">
          <div className="flex-1">
            <label htmlFor="nueva-clase-titulo" className="mb-1 block font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--vino)]">
              Título de la nueva clase
            </label>
            <input
              id="nueva-clase-titulo"
              className="w-full rounded-lg border border-[var(--linea)] px-3 py-2 text-sm outline-none focus:border-[var(--carmin)]"
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
            />
          </div>
          {modulos.length > 0 && (
            <div>
              <label htmlFor="nueva-clase-modulo" className="mb-1 block font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--vino)]">
                Módulo
              </label>
              <select
                id="nueva-clase-modulo"
                value={nuevoModuloId}
                onChange={(e) => setNuevoModuloId(e.target.value)}
                className="rounded-lg border border-[var(--linea)] bg-white px-3 py-2 text-sm"
              >
                <option value="">Sin módulo</option>
                {modulosOrdenados.map((mo) => (
                  <option key={mo.id} value={mo.id}>
                    {mo.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}
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
    </div>
  );
}
