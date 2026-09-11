"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repetirPassword, setRepetirPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== repetirPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/`,
      },
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
            Te enviamos un link de confirmación a <strong>{email}</strong>. Ábrelo
            para activar tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[#3B1420]">Crear cuenta</h1>
        <p className="mt-1 text-sm text-[#8A5C68]">
          Regístrate para acceder a tus clases.
        </p>

        <form onSubmit={handleSignUp} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="nombre" className="text-sm font-medium text-[#3B1420]">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="rounded-lg border border-[#EFD6DC] px-3 py-2 text-sm outline-none focus:border-[#C31C44]"
            />
          </div>

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
            <label htmlFor="password" className="text-sm font-medium text-[#3B1420]">
              Contraseña
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
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#8A5C68]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/cuenta/login" className="text-[#C31C44] underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
