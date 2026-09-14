"use client";

import { updateNombre } from "@/app/cuenta/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EditableNombre({ nombreInicial }: { nombreInicial: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(nombreInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuardar = async () => {
    setGuardando(true);
    setError(null);
    const result = await updateNombre(nombre);
    setGuardando(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setEditando(false);
    router.refresh();
  };

  if (!editando) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold text-[var(--vino)]">
          {nombreInicial}
        </h1>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-[.8rem] text-[var(--carmin)] underline"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        autoFocus
        className="rounded-lg border border-[var(--linea)] px-3 py-1.5 text-[1.1rem] outline-none focus:border-[var(--carmin)]"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleGuardar()}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando || !nombre.trim()}
          className="rounded-full bg-[var(--vino)] px-4 py-1.5 text-[.82rem] text-white disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditando(false);
            setNombre(nombreInicial);
            setError(null);
          }}
          className="rounded-full border border-[var(--linea)] px-4 py-1.5 text-[.82rem] text-[var(--tinta-suave)]"
        >
          Cancelar
        </button>
      </div>
      {error && <p role="alert" className="text-[.8rem] text-[var(--dorado-osc)]">{error}</p>}
    </div>
  );
}
