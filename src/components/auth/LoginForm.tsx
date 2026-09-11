"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos.");
      setIsLoading(false);
      return;
    }

    const next = searchParams.get("next") ?? "/";
    router.push(next);
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-[var(--tinta)]">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-[var(--tinta-suave)]">Entra con tu email y contraseña.</p>

      <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
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

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-[var(--tinta)]">
              Contraseña
            </label>
            <Link href="/cuenta/olvide-password" className="text-xs text-[var(--carmin)] underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-[var(--linea)] px-3 py-2 text-sm outline-none focus:border-[var(--carmin)]"
          />
        </div>

        {error && <p role="alert" className="text-sm text-[var(--dorado-osc)]">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-full bg-[var(--vino)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--vino-claro)] disabled:opacity-60"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--tinta-suave)]">
        ¿No tienes cuenta?{" "}
        <Link href="/cuenta/registro" className="text-[var(--carmin)] underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
