"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const input =
  "w-full rounded-lg border border-[var(--linea)] px-3 py-2 text-sm outline-none focus:border-[var(--carmin)]";
const label = "mb-1 block text-[.85rem] font-medium text-[var(--vino)]";

// Misma llamada que ActualizarPasswordForm.tsx (flujo de "olvidé mi
// contraseña"), pero embebida acá para que un usuario ya logueado pueda
// cambiar su contraseña directamente, sin el viaje de ida y vuelta por
// email — antes esa era la única forma de hacerlo.
export function CambiarPasswordForm() {
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    if (password !== repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setCargando(false);

    if (error) {
      setError(error.message);
      return;
    }
    setMensaje("Contraseña actualizada.");
    setPassword("");
    setRepetir("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="nueva-password" className={label}>Nueva contraseña</label>
        <input
          id="nueva-password"
          type="password"
          required
          minLength={6}
          className={input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="repetir-password" className={label}>Repetir contraseña</label>
        <input
          id="repetir-password"
          type="password"
          required
          className={input}
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
        />
      </div>
      {error && <p role="alert" className="text-sm text-[var(--dorado-osc)]">{error}</p>}
      {mensaje && <p className="text-sm font-medium text-[var(--vino)]">{mensaje}</p>}
      <button
        type="submit"
        disabled={cargando}
        className="self-start rounded-full bg-[var(--vino)] px-5 py-2 font-[family-name:var(--font-ui)] text-[.85rem] text-white hover:bg-[var(--vino-claro)] disabled:opacity-50"
      >
        {cargando ? "Guardando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}
