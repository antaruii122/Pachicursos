"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function OlvidePasswordPage() {
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
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-semibold text-[#3B1420]">Revisa tu email</h1>
          <p className="mt-2 text-sm text-[#8A5C68]">
            Si existe una cuenta con <strong>{email}</strong>, te enviamos un link
            para crear una nueva contraseña.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[#3B1420]">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-[#8A5C68]">
          Te enviamos un link a tu email para crear una nueva contraseña.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-[#3B1420]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-[#EFD6DC] px-3 py-2 text-sm outline-none focus:border-[#C31C44]"
            />
          </div>

          {error && <p className="text-sm text-[#EF5950]">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-[#4E0F26] px-6 py-2 text-sm font-medium text-white hover:bg-[#7A1533] disabled:opacity-60"
          >
            {isLoading ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      </div>
    </div>
  );
}
