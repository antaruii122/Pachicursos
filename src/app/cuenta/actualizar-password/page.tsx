"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ActualizarPasswordPage() {
  const [password, setPassword] = useState("");
  const [repetirPassword, setRepetirPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== repetirPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    router.push("/cuenta/login");
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[#3B1420]">Nueva contraseña</h1>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-[#3B1420]">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-[#EFD6DC] px-3 py-2 text-sm outline-none focus:border-[#C31C44]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="repetir-password" className="text-sm font-medium text-[#3B1420]">
              Repetir contraseña
            </label>
            <input
              id="repetir-password"
              type="password"
              required
              value={repetirPassword}
              onChange={(e) => setRepetirPassword(e.target.value)}
              className="rounded-lg border border-[#EFD6DC] px-3 py-2 text-sm outline-none focus:border-[#C31C44]"
            />
          </div>

          {error && <p className="text-sm text-[#EF5950]">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-[#4E0F26] px-6 py-2 text-sm font-medium text-white hover:bg-[#7A1533] disabled:opacity-60"
          >
            {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
