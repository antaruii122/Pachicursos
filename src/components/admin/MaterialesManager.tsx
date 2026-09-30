"use client";

import {
  agregarEnlaceMaterial,
  borrarMaterial,
  confirmarMaterial,
  prepararSubidaMaterial,
} from "@/app/admin/cursos/[id]/clases/actions";
import {
  EXTENSIONES_PERMITIDAS,
  TAMANO_MAXIMO,
  TIPO_RECURSO,
  formatTamano,
  type Recurso,
} from "@/lib/recursos";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// Materiales de una clase (PDF, PPT, Word, Excel, imágenes, links) desde el
// gestor de clases del admin. Se ven para la alumna en "Material de la
// clase" (pantalla 3 de la maqueta). Arrastrar y soltar o elegir archivo;
// se pueden subir varios a la vez.
export function MaterialesManager({
  courseId,
  claseId,
  recursos,
}: {
  courseId: string;
  claseId: string;
  recursos: Recurso[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [linkNombre, setLinkNombre] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const subir = async (archivos: FileList | File[]) => {
    setError(null);
    for (const archivo of Array.from(archivos)) {
      if (archivo.size > TAMANO_MAXIMO) {
        setError(`"${archivo.name}" pesa más de 50 MB. Exporta a PDF o comprímelo.`);
        continue;
      }
      setSubiendo(archivo.name);
      const prep = await prepararSubidaMaterial(courseId, claseId, archivo.name, archivo.size);
      if ("error" in prep) {
        setError(prep.error);
        continue;
      }
      const { error: errSubida } = await createClient()
        .storage.from("materiales")
        .uploadToSignedUrl(prep.path, prep.token, archivo, { contentType: archivo.type || undefined });
      if (errSubida) {
        setError(`No se pudo subir "${archivo.name}": ${errSubida.message}`);
        continue;
      }
      const nombre = archivo.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      const conf = await confirmarMaterial(courseId, claseId, { nombre, path: prep.path, tamano: archivo.size });
      if ("error" in conf) setError(conf.error);
    }
    setSubiendo(null);
    router.refresh();
  };

  const agregarLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    setError(null);
    const r = await agregarEnlaceMaterial(courseId, claseId, linkNombre, linkUrl);
    if ("error" in r) {
      setError(r.error);
      return;
    }
    setLinkNombre("");
    setLinkUrl("");
    router.refresh();
  };

  const borrar = async (r: Recurso) => {
    if (!confirm(`¿Borrar "${r.nombre}"? Las alumnas dejarán de verlo.`)) return;
    setError(null);
    const res = await borrarMaterial(courseId, claseId, r.id);
    if ("error" in res) setError(res.error);
    else router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="font-[family-name:var(--font-ui)] text-[.82rem] font-semibold text-[var(--vino)]">
        Material de la clase {recursos.length > 0 && <span className="font-normal text-[var(--tinta-suave)]">({recursos.length})</span>}
      </p>

      {recursos.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {recursos.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-[var(--radio-sm)] border border-[var(--linea)] bg-white p-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--rosa)] font-[family-name:var(--font-ui)] text-[.62rem] font-semibold text-[var(--vino)]">
                {TIPO_RECURSO[r.tipo].badge}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[.84rem] text-[var(--tinta)]">{r.nombre}</span>
                <span className="block text-[.72rem] text-[var(--tinta-suave)]">
                  {TIPO_RECURSO[r.tipo].detalle}
                  {r.tamano ? ` · ${formatTamano(r.tamano)}` : ""}
                </span>
              </span>
              <button
                type="button"
                onClick={() => borrar(r)}
                aria-label={`Borrar ${r.nombre}`}
                className="rounded-full px-2 py-1 text-[.75rem] text-[var(--dorado-osc)] hover:bg-[var(--crema-2)]"
              >
                Borrar
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          if (e.dataTransfer.files.length) subir(e.dataTransfer.files);
        }}
        disabled={!!subiendo}
        className={`flex flex-col items-center justify-center gap-1 rounded-[var(--radio-sm)] border-2 border-dashed px-4 py-5 text-center transition-colors ${
          arrastrando ? "border-[var(--vino)] bg-[var(--rosa)]" : "border-[var(--linea)] bg-[var(--crema-2)] hover:border-[var(--vino)]"
        }`}
      >
        <span className="font-[family-name:var(--font-ui)] text-[.84rem] font-medium text-[var(--vino)]">
          {subiendo ? `Subiendo "${subiendo}"...` : "Subir PDF, presentación u otro archivo"}
        </span>
        <span className="text-[.74rem] text-[var(--tinta-suave)]">
          Arrastra aquí o haz click · PDF, PPT, Word, Excel, imágenes · hasta 50 MB · puedes elegir varios
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={EXTENSIONES_PERMITIDAS}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) subir(e.target.files);
          e.target.value = "";
        }}
      />

      <form onSubmit={agregarLink} className="flex flex-col gap-2 sm:flex-row">
        <input
          aria-label="Nombre del enlace"
          placeholder="Nombre (ej. Lectura recomendada)"
          value={linkNombre}
          onChange={(e) => setLinkNombre(e.target.value)}
          className="rounded-[var(--radio-sm)] border border-[var(--linea)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--vino)] sm:w-[40%]"
        />
        <input
          aria-label="URL del enlace"
          type="url"
          placeholder="https://..."
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className="flex-1 rounded-[var(--radio-sm)] border border-[var(--linea)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--vino)]"
        />
        <button
          type="submit"
          disabled={!linkUrl.trim()}
          className="rounded-full border border-[var(--vino)] px-4 py-2 font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--vino)] disabled:opacity-40"
        >
          + Enlace
        </button>
      </form>

      {error && <p role="alert" className="text-sm text-[var(--dorado-osc)]">{error}</p>}
    </div>
  );
}
