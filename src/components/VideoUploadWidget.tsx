"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "tus-js-client";

type Estado = "idle" | "pidiendo-link" | "subiendo" | "procesando" | "listo" | "error";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60; // ~5 minutos

// Widget de subida (Parte C: subida TUS; Parte D: seguimiento de estado).
// El archivo viaja directo navegador → Vimeo, nunca pasa por nuestro
// servidor. Vimeo no tiene webhook de fin de transcoding (ver docs/cursos.md,
// corrección 2026-09-11) — mientras esta página está abierta, se hace
// polling a /api/vimeo/status/:id cada 5s hasta que quede "listo" (decisión
// confirmada con Ricardo: polling desde el navegador del admin, sin
// infraestructura nueva).
//
// Hallazgo 2026-09-14: antes recibía TODAS las clases y un <select> para
// elegir cuál — Ricardo tenía que bajar hasta un widget compartido y elegir
// de un dropdown en vez de actuar directo sobre la clase que estaba mirando.
// Ahora vive scopeado a una sola clase (claseId), embebido en su propia fila.
export function VideoUploadWidget({ claseId }: { claseId: string }) {
  const [estado, setEstado] = useState<Estado>("idle");
  const [progreso, setProgreso] = useState(0);
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

  const handleFile = async (file: File) => {
    setEstado("pidiendo-link");
    setError(null);
    setProgreso(0);

    try {
      const res = await fetch("/api/vimeo/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: claseId, filename: file.name, filesize: file.size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo iniciar la subida");

      setEstado("subiendo");

      const upload = new Upload(file, {
        uploadUrl: data.uploadLink,
        retryDelays: [0, 1000, 3000, 5000],
        onProgress(bytesSent, bytesTotal) {
          setProgreso(Math.round((bytesSent / bytesTotal) * 100));
        },
        onSuccess() {
          setEstado("procesando");
          startPolling(claseId);
        },
        onError(err) {
          setError(err.message);
          setEstado("error");
        },
      });
      upload.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setEstado("error");
    }
  };

  const ocupado = estado === "subiendo" || estado === "pidiendo-link" || estado === "procesando";

  return (
    <div className="rounded-[14px] bg-[var(--crema-2)] p-4">
      <label htmlFor={`video-file-${claseId}`} className="mb-1 block font-[family-name:var(--font-ui)] text-[.8rem] font-medium text-[var(--vino)]">
        Subir archivo de video
      </label>
      <input
        id={`video-file-${claseId}`}
        type="file"
        accept="video/*"
        disabled={ocupado}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="mb-3 block w-full text-sm"
      />

      {(estado === "subiendo" || estado === "procesando" || estado === "listo") && (
        <div
          role="progressbar"
          aria-valuenow={estado === "subiendo" ? progreso : 100}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mb-2 h-2 overflow-hidden rounded-full bg-[var(--rosa)]"
        >
          <div
            className="h-full rounded-full bg-[var(--vino)] transition-all"
            style={{ width: `${estado === "subiendo" ? progreso : 100}%` }}
          />
        </div>
      )}

      <div role="status" aria-live="polite">
        {estado === "pidiendo-link" && (
          <p className="text-sm text-[var(--tinta-suave)]">Preparando la subida…</p>
        )}

        {estado === "subiendo" && (
          <p className="text-sm text-[var(--tinta-suave)]">Subiendo… {progreso}%</p>
        )}

        {estado === "procesando" && (
          <p className="text-sm text-[var(--tinta-suave)]">
            Subida completa. Procesando en Vimeo…
          </p>
        )}

        {estado === "listo" && (
          <p className="text-sm font-medium text-[var(--vino)]">Listo. El video ya se puede reproducir.</p>
        )}
      </div>

      {estado === "error" && (
        <p role="alert" className="text-sm text-[var(--dorado-osc)]">
          {error}
        </p>
      )}
    </div>
  );
}
