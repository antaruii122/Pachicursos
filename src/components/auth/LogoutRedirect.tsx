"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

// Navegación dura a propósito, no router.push (ver el mismo cambio y su
// motivo en LoginForm.tsx) — mismo tipo de cambio de sesión, mismo riesgo.
export function LogoutRedirect() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.signOut().then(() => {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intencional, ver comentario arriba
      window.location.href = "/cuenta/login";
    });
  }, []);

  return (
    <p role="status" className="text-sm text-[var(--tinta-suave)]">
      Cerrando sesión...
    </p>
  );
}
