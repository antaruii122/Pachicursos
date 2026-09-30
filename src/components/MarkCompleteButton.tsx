"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

// "Marcar como completada y seguir" (pantalla 3 de la maqueta). Se suma al
// completado automático de ClassPlayer (90% visto / evento `ended`), no lo
// reemplaza: sirve para la alumna que salta el final o ya vio la clase en
// otro momento. Mismo upsert que ClassPlayer — solo pisa `completed` y
// `actualizado_en`, nunca resetea la posición guardada del video.
export function MarkCompleteButton({
  videoId,
  yaCompletada,
  siguienteHref,
}: {
  videoId: string;
  yaCompletada: boolean;
  siguienteHref: string | null;
}) {
  const [estado, setEstado] = useState<"idle" | "guardando" | "error">("idle");

  const handleClick = async () => {
    setEstado("guardando");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setEstado("error");
      return;
    }
    if (!yaCompletada) {
      const { error } = await supabase.from("lesson_progress").upsert(
        { user_id: user.id, video_id: videoId, completed: true, actualizado_en: new Date().toISOString() },
        { onConflict: "user_id,video_id" },
      );
      if (error) {
        setEstado("error");
        return;
      }
    }
    // Navegación dura: el sidebar/Mi Campus son Server Components y tienen
    // que releer el avance recién guardado.
    window.location.href = siguienteHref ?? "/cuenta/mis-cursos";
  };

  const texto = yaCompletada
    ? siguienteHref
      ? "Siguiente clase"
      : "Volver a Mi Campus"
    : siguienteHref
      ? "Marcar como completada y seguir"
      : "Marcar como completada";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={estado === "guardando"}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--vino)] px-6 py-2.5 font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-white shadow-[var(--sombra-sm)] transition-[background-color,transform,box-shadow] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-0.5 hover:bg-[var(--vino-claro)] hover:shadow-[var(--sombra-md)] disabled:translate-y-0 disabled:opacity-60"
      >
        {estado === "guardando" ? "Guardando..." : texto}
        {estado !== "guardando" && <span aria-hidden="true">→</span>}
      </button>
      <span role="status" className="text-[.8rem] text-[var(--tinta-suave)]">
        {estado === "error"
          ? "No se pudo guardar. Revisa tu conexión e intenta de nuevo."
          : yaCompletada
            ? "Ya completaste esta clase."
            : "Tu avance también se guarda automáticamente."}
      </span>
    </div>
  );
}
