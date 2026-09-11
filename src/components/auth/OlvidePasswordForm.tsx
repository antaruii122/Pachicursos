"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function OlvidePasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/cuenta/actualizar-password`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setEnviado(true);
    setIsLoading(false);
  };

  if (enviado) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold text-[var(--tinta)]">Revisa tu email</h1>
        <p className="mt-2 text-sm text-[var(--tinta-suave)]">
          Si existe una cuenta con <strong>{email}</strong>, te enviamos un link para crear una
          nueva contraseña.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-[var(--tinta)]">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-[var(--tinta-suave)]">
        Te enviamos un link a tu email para crear una nueva contraseña.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-[var(--tinta)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-[var(--linea)] px-3 py-2 text-sm outline-none focus:border-[var(--carmin)]"
          />
        </div>

        {error && <p role="alert" className="text-sm text-[var(--dorado-osc)]">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-full bg-[var(--vino)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--vino-claro)] disabled:opacity-60"
        >
          {isLoading ? "Enviando..." : "Enviar link"}
        </button>
      </form>
    </div>
  );
}
