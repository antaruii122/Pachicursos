"use client";

import { attachVimeoVideo } from "@/app/admin/cursos/[id]/clases/actions";
import { useEffect, useRef, useState } from "react";

type Estado = "idle" | "guardando" | "procesando" | "listo" | "error";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60;

// Alternativa a VideoUploadWidget para cuando el token de Vimeo no tiene
// scope de "upload" (ver actions.ts, attachVimeoVideo): el admin sube el
// video directo en vimeo.com con su cuenta normal, y acá solo pega el link
// para vincularlo a la clase. Reutiliza el mismo endpoint de polling que ya
// existía (/api/vimeo/status/[id]) para esperar a que termine de procesar.
//
// Scopeado a una sola clase (claseId), igual que VideoUploadWidget — ver el
// comentario ahí sobre por qué se sacó el <select> compartido.
export function VimeoLinkWidget({ courseId, claseId }: { courseId: string; claseId: string }) {
  const [link, setLink] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = (idParaConsultar: string) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/vimeo/status/${idParaConsultar}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo consultar el estado");

        if (data.estado_procesamiento === "listo") {
          if (pollRef.current) clearInterval(pollRef.current);
          setEstado("listo");
          return;
        }
        if (data.transcodeError) {
          if (pollRef.current) clearInterval(pollRef.current);
          setError("Vimeo reportó un error procesando el video.");
          setEstado("error");
          return;
        }
      } catch (err) {
        if (pollRef.current) clearInterval(pollRef.current);
        setError(err instanceof Error ? err.message : "Error desconocido");
        setEstado("error");
        return;
      }

      if (attempts >= MAX_POLL_ATTEMPTS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setError("Está tardando más de lo esperado. Podés cerrar esta página y revisar más tarde.");
        setEstado("error");
      }
    }, POLL_INTERVAL_MS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.trim()) return;
    setEstado("guardando");
    setError(null);

    const result = await attachVimeoVideo(courseId, claseId, link.trim());
    if ("error" in result) {
      setError(result.error);
      setEstado("error");
      return;
    }
    setLink("");
    setEstado("procesando");
    startPolling(claseId);
  };

  const ocupado = estado === "guardando" || estado === "procesando";

  return (
    <div className="rounded-[14px] bg-[var(--crema-2)] p-4">
      <label htmlFor={`vimeo-link-${claseId}`} className="mb-1 block font-[family-name:var(--font-ui)] text-[.8rem] font-medium text-[var(--vino)]">
        O pegar el link de un video ya subido en vimeo.com
      </label>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id={`vimeo-link-${claseId}`}
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          disabled={ocupado}
          placeholder="https://vimeo.com/123456789"
          className="flex-1 rounded-lg border border-[var(--linea)] px-3 py-2 text-sm outline-none focus:border-[var(--carmin)]"
        />
        <button
          type="submit"
          disabled={ocupado || !link.trim()}
          className="rounded-full bg-[var(--vino)] px-5 py-2 font-[family-name:var(--font-ui)] text-[.85rem] text-white disabled:opacity-50"
        >
          Vincular
        </button>
      </form>

      <div role="status" aria-live="polite" className="mt-2">
        {estado === "guardando" && <p className="text-sm text-[var(--tinta-suave)]">Verificando con Vimeo…</p>}
        {estado === "procesando" && (
          <p className="text-sm text-[var(--tinta-suave)]">Vinculado. Esperando a que Vimeo termine de procesarlo…</p>
        )}
        {estado === "listo" && (
          <p className="text-sm font-medium text-[var(--vino)]">Listo. El video ya se puede reproducir.</p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-[var(--dorado-osc)]">
          {error}
        </p>
      )}
    </div>
  );
}
