"use client";

import { useEffect, useState } from "react";

const card = "rounded-[18px] bg-white shadow-[0_12px_30px_rgba(78,15,38,.1)]";

// Pide el embed real al endpoint validado server-side (Parte D) — el
// vimeo_id nunca llega a este componente ni al HTML inicial, solo la URL
// de embed final, y solo si el endpoint confirmó que hay acceso.
export function ClassPlayer({
  courseSlug,
  videoId,
  estadoProcesamiento,
}: {
  courseSlug: string;
  videoId: string;
  estadoProcesamiento: "subiendo" | "procesando" | "listo";
}) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (estadoProcesamiento !== "listo") return;

    let cancelado = false;
    fetch(`/api/courses/${courseSlug}/videos/${videoId}/player`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo cargar el video");
        if (!cancelado) setEmbedUrl(data.embedUrl);
      })
      .catch((err) => {
        if (!cancelado) setError(err instanceof Error ? err.message : "Error desconocido");
      });

    return () => {
      cancelado = true;
    };
  }, [courseSlug, videoId, estadoProcesamiento]);

  if (estadoProcesamiento !== "listo") {
    return (
      <div className={`${card} flex aspect-video items-center justify-center bg-[var(--crema-2)]`}>
        <p className="text-sm text-[var(--tinta-suave)]">
          Esta clase todavía está procesándose, disponible pronto.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${card} flex aspect-video items-center justify-center bg-[var(--crema-2)] p-6 text-center`}>
        <p className="text-sm text-[var(--dorado-osc)]">{error}</p>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className={`${card} flex aspect-video items-center justify-center bg-[var(--vino-osc)]`}>
        <p className="text-sm text-white/70">Cargando video…</p>
      </div>
    );
  }

  return (
    <div className={`${card} aspect-video overflow-hidden`}>
      <iframe
        src={embedUrl}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
        title="Reproductor de la clase"
      />
    </div>
  );
}
