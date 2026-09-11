"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
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
      <h1 className="text-2xl font-semibold text-[#3B1420]">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-[#8A5C68]">
        Entra con tu email y contraseña.
      </p>

      <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
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

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-[#3B1420]">
              Contraseña
            </label>
            <Link href="/cuenta/olvide-password" className="text-xs text-[#C31C44] underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-[#EFD6DC] px-3 py-2 text-sm outline-none focus:border-[#C31C44]"
          />
        </div>

        {error && <p className="text-sm text-[#EF5950]">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-full bg-[#4E0F26] px-6 py-2 text-sm font-medium text-white hover:bg-[#7A1533] disabled:opacity-60"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[#8A5C68]">
        ¿No tienes cuenta?{" "}
        <Link href="/cuenta/registro" className="text-[#C31C44] underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
