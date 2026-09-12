"use client";

import { createClient } from "@/lib/supabase/client";
import Player from "@vimeo/player";
import { useEffect, useRef, useState } from "react";

const card = "rounded-[18px] bg-white shadow-[0_12px_30px_rgba(78,15,38,.1)]";

// Cada cuántos segundos de reproducción real se guarda el avance — no en
// cada `timeupdate` (dispara varias veces por segundo), para no saturar la
// base con writes.
const GUARDADO_INTERVALO_SEGUNDOS = 10;

// Pide el embed real al endpoint validado server-side (Parte D) — el
// vimeo_id nunca llega a este componente ni al HTML inicial, solo la URL
// de embed final, y solo si el endpoint confirmó que hay acceso.
//
// Hallazgo de Ricardo (2026-09-12): nada en la app escribía nunca
// `lesson_progress` — el % de avance en "Mis cursos" y el botón "Continuar"
// dependían de una tabla que nadie llenaba. Este componente ahora usa el SDK
// oficial de Vimeo (`@vimeo/player`, wrapper sobre su postMessage API) para
// escuchar la reproducción real y guardar avance/completado.
export function ClassPlayer({
  courseSlug,
  videoId,
  estadoProcesamiento,
  initialProgressSeconds = 0,
}: {
  courseSlug: string;
  videoId: string;
  estadoProcesamiento: "subiendo" | "procesando" | "listo";
  initialProgressSeconds?: number;
}) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastSavedSecondRef = useRef(0);
  const completedRef = useRef(false);

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

  useEffect(() => {
    if (!embedUrl || !iframeRef.current) return;

    const player = new Player(iframeRef.current);
    let cancelado = false;

    const guardarAvance = async (segundos: number, completed: boolean) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const fila = {
        user_id: user.id,
        video_id: videoId,
        progress_seconds: Math.floor(segundos),
        actualizado_en: new Date().toISOString(),
        ...(completed ? { completed: true } : {}),
      };
      await supabase.from("lesson_progress").upsert(fila, { onConflict: "user_id,video_id" });
    };

    player
      .ready()
      .then(() => {
        if (cancelado) return;
        if (initialProgressSeconds > 5) {
          player.setCurrentTime(initialProgressSeconds).catch(() => {});
        }
      })
      .catch(() => {});

    player.on("timeupdate", ({ seconds, percent }: { seconds: number; percent: number }) => {
      if (cancelado || completedRef.current) return;
      if (seconds - lastSavedSecondRef.current >= GUARDADO_INTERVALO_SEGUNDOS) {
        lastSavedSecondRef.current = seconds;
        // 90% visto ya cuenta como completada — muchos alumnos nunca llegan
        // al último frame exacto (créditos, scrub antes del final).
        const completed = percent >= 0.9;
        if (completed) completedRef.current = true;
        guardarAvance(seconds, completed);
      }
    });

    player.on("ended", () => {
      if (cancelado) return;
      completedRef.current = true;
      guardarAvance(lastSavedSecondRef.current, true);
    });

    return () => {
      cancelado = true;
      player.unload().catch(() => {});
    };
  }, [embedUrl, videoId, initialProgressSeconds]);

  if (estadoProcesamiento !== "listo") {
    return (
      <div className={`${card} flex aspect-video flex-col items-center justify-center gap-3 bg-[var(--crema-2)] p-6 text-center`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rosa)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--carmin)" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        </div>
        <p className="text-sm text-[var(--tinta-suave)]">
          Esta clase todavía está procesándose, disponible pronto.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${card} flex aspect-video flex-col items-center justify-center gap-3 bg-[var(--crema-2)] p-6 text-center`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rosa)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--dorado-osc)" strokeWidth="1.8">
            <rect x="2" y="6" width="14" height="12" rx="2" />
            <path d="M16 10l6-3v10l-6-3" />
            <path d="M3 3l18 18" />
          </svg>
        </div>
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
        ref={iframeRef}
        src={embedUrl}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
        title="Reproductor de la clase"
      />
    </div>
  );
}
