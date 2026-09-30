"use client";

import { mensajeError } from "@/lib/errores";
import { createClient } from "@/lib/supabase/client";
import Player from "@vimeo/player";
import { useEffect, useRef, useState } from "react";


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
        if (!cancelado) setError(mensajeError(err));
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

  // Superficie oscura de video en todos los estados (pantalla 3 de la
  // maqueta): mientras Vimeo carga, o si la clase no está lista, se ve el
  // mismo marco ciruela en vez de un recuadro blanco vacío.
  const marco =
    "relative flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden rounded-[var(--radio-lg)] bg-[var(--video,var(--vino-osc))] p-6 text-center shadow-[var(--sombra-md)]";
  const icono = "flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10";

  if (estadoProcesamiento !== "listo") {
    return (
      <div className={marco}>
        <div className={icono}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        </div>
        <p className="text-sm text-white/75">Esta clase todavía está procesándose, disponible pronto.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={marco}>
        <div className={icono}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" aria-hidden="true">
            <rect x="2" y="6" width="14" height="12" rx="2" />
            <path d="M16 10l6-3v10l-6-3" />
            <path d="M3 3l18 18" />
          </svg>
        </div>
        <p className="max-w-[40ch] text-sm text-white/80">{error}</p>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className={marco}>
        <div className={`${icono} animate-pulse`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <p className="text-[.8rem] text-white/60">Cargando la clase…</p>
      </div>
    );
  }

  return (
    <div className="aspect-video overflow-hidden rounded-[var(--radio-lg)] bg-[var(--video,var(--vino-osc))] shadow-[var(--sombra-md)]">
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
