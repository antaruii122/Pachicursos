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
export function VideoUploadWidget({
  clases,
}: {
  clases: { id: string; orden: number; titulo: string }[];
}) {
  const [videoId, setVideoId] = useState(clases[0]?.id ?? "");
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
        body: JSON.stringify({ video_id: videoId, filename: file.name, filesize: file.size }),
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
          startPolling(videoId);
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
    <div className="rounded-[18px] bg-white p-6 shadow-[0_12px_30px_rgba(78,15,38,.1)]">
      <label className="mb-1 block font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-[var(--vino)]">
        Clase
      </label>
      <select
        value={videoId}
        onChange={(e) => setVideoId(e.target.value)}
        disabled={ocupado}
        className="mb-4 w-full rounded-lg border border-[var(--linea)] px-3 py-2 text-sm outline-none focus:border-[var(--carmin)]"
      >
        {clases.map((c) => (
          <option key={c.id} value={c.id}>
            {c.orden}. {c.titulo}
          </option>
        ))}
      </select>

      <input
        type="file"
        accept="video/*"
        disabled={ocupado}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="mb-4 block w-full text-sm"
      />

      {estado === "pidiendo-link" && (
        <p className="text-sm text-[var(--tinta-suave)]">Preparando la subida…</p>
      )}

      {(estado === "subiendo" || estado === "procesando" || estado === "listo") && (
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-[var(--rosa)]">
          <div
            className="h-full rounded-full bg-[var(--vino)] transition-all"
            style={{ width: `${estado === "subiendo" ? progreso : 100}%` }}
          />
        </div>
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

      {estado === "error" && <p className="text-sm text-[var(--dorado-osc)]">{error}</p>}
    </div>
  );
}
