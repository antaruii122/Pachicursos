"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";

type SaveState = "idle" | "guardando" | "guardado";

// Una nota por alumno por clase, se sobrescribe (ver docs/cursos.md,
// tabla video_notes). Autoguardado con debounce, sin botón "Guardar".
export function ClassNotes({
  videoId,
  initialContent,
}: {
  videoId: string;
  initialContent: string;
}) {
  const [contenido, setContenido] = useState(initialContent);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = (value: string) => {
    setContenido(value);
    setSaveState("guardando");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("video_notes").upsert(
        {
          user_id: user.id,
          video_id: videoId,
          contenido: value,
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: "user_id,video_id" },
      );
      setSaveState("guardado");
    }, 800);
  };

  return (
    <div className="rounded-[18px] bg-white p-6 shadow-[0_12px_30px_rgba(78,15,38,.1)]">
      <div className="mb-1 flex items-center justify-between">
        <b className="font-[family-name:var(--font-ui)] text-[.92rem] text-[var(--vino)]">
          Tus notas de esta clase
        </b>
        {saveState !== "idle" && (
          <span className="text-[.75rem] text-[var(--tinta-suave)]">
            {saveState === "guardando" ? "Guardando..." : "Guardado"}
          </span>
        )}
      </div>
      <p className="mb-3.5 text-[.85rem] text-[var(--tinta-suave)]">
        Solo tú las ves. Se guardan automáticamente.
      </p>
      <textarea
        value={contenido}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Escribe aquí lo que quieras recordar de esta clase…"
        className="min-h-[110px] w-full rounded-[10px] border-[1.5px] border-[var(--linea)] p-4 text-[.92rem] text-[var(--tinta)] outline-none placeholder:text-[var(--tinta-suave)] focus:border-[var(--carmin)]"
      />
    </div>
  );
}
