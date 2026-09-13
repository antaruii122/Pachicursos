"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const labelClass = "mb-1 block font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-[var(--vino)]";

interface ImageUploadFieldProps {
  label: string;
  helpText?: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: string;
}

// Reemplaza el campo de texto "pegá una URL" por una subida real (hallazgo
// 2026-09-13/14: el admin no tenía ninguna forma de subir una foto propia).
// Sube a /api/admin/upload-image (Supabase Storage), que devuelve una URL
// pública — se guarda en el mismo campo de texto que ya existía
// (cover_image_url/background_image_url), así que no hace falta ningún
// cambio de esquema ni tocar dónde se muestran estas imágenes.
export function ImageUploadField({ label, helpText, value, onChange, aspect = "aspect-video" }: ImageUploadFieldProps) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setSubiendo(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo subir la imagen");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {helpText && <p className="mb-2 text-xs text-[var(--tinta-suave)]">{helpText}</p>}

      {value ? (
        <div className={`relative ${aspect} w-full max-w-sm overflow-hidden rounded-lg border border-[var(--linea)] bg-[var(--crema-2)]`}>
          <Image src={value} alt="" fill sizes="384px" className="object-cover" />
          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/50 via-transparent to-transparent p-2 opacity-0 transition hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={subiendo}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[var(--vino)]"
            >
              {subiendo ? "Subiendo..." : "Reemplazar"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[var(--dorado-osc)]"
            >
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className={`flex ${aspect} w-full max-w-sm flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--linea)] bg-[var(--crema-2)] text-[var(--tinta-suave)] transition hover:border-[var(--carmin)] hover:text-[var(--carmin)] disabled:opacity-60`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
            <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
          </svg>
          <span className="text-sm font-medium">{subiendo ? "Subiendo..." : "Subir imagen"}</span>
          <span className="text-xs">JPG, PNG, WEBP o AVIF · hasta 8MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-[var(--dorado-osc)]">
          {error}
        </p>
      )}
    </div>
  );
}
