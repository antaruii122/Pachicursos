"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

    // Navegación dura (no router.push) a propósito: hallazgo real (2026-09-14,
    // probado con un browser real) — en una conexión fría, el login a veces
    // dispara el request de auth dos veces y el router de Next se queda
    // pegado en /cuenta/login aunque Supabase ya haya autenticado bien. Una
    // recarga completa siempre ve la cookie de sesión ya escrita, sin la
    // carrera entre el estado del cliente y el server.
    // Sin ?next, se entra directo al campus (no al catálogo de venta).
    const next = searchParams.get("next") ?? "/cuenta/mis-cursos";
    window.location.href = next;
  };

  const input =
    "w-full rounded-[var(--radio-sm)] border border-[var(--linea)] bg-white px-3.5 py-2.5 text-[.95rem] outline-none transition-[border-color,box-shadow] duration-[var(--dur)] ease-[var(--ease)] placeholder:text-[var(--tinta-suave)]/60 focus:border-[var(--carmin)] focus:shadow-[0_0_0_3px_var(--rosa)]";
  const label = "font-[family-name:var(--font-ui)] text-[.8rem] font-medium text-[var(--tinta)]";

  return (
    <div className="mt-7 w-full rounded-[var(--radio-lg)] border border-[var(--linea)] bg-white px-7 py-8 shadow-[var(--sombra-lg)] sm:px-8">
      <h1 className="text-center text-[1.55rem] font-normal">Te damos la bienvenida</h1>
      <p className="mt-1 text-center text-[.9rem] leading-snug text-[var(--tinta-suave)]">
        Un espacio para entender tu fertilidad y cuidarla con información clara.
      </p>

      <form onSubmit={handleLogin} className="mt-7 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={label}>
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nombre@correo.cl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={label}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
          />
        </div>

        {error && <p role="alert" className="text-sm text-[var(--dorado-osc)]">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 w-full rounded-full bg-[var(--vino)] px-6 py-3 font-[family-name:var(--font-ui)] text-[.9rem] font-medium text-white shadow-[var(--sombra-sm)] transition-[background-color,transform,box-shadow] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-0.5 hover:bg-[var(--vino-claro)] hover:shadow-[var(--sombra-md)] disabled:translate-y-0 disabled:opacity-60"
        >
          {isLoading ? "Ingresando..." : "Ingresar"}
        </button>

        <Link
          href="/cuenta/olvide-password"
          className="text-center text-[.82rem] text-[var(--vino)] underline decoration-[var(--linea)] underline-offset-4 hover:decoration-[var(--vino)]"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </form>

      {/* No está en la maqueta (ahí las cuentas las crea el admin), pero quien
          compra por la web hoy se registra sola — sacarlo rompería esa compra. */}
      <p className="mt-6 border-t border-[var(--linea)] pt-5 text-center text-[.8rem] text-[var(--tinta-suave)]">
        ¿Compraste un curso y aún no tienes cuenta?{" "}
        <Link href="/cuenta/registro" className="text-[var(--carmin)] underline underline-offset-4">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
