import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export interface Sesion {
  userId: string;
  email: string | null;
  role: "admin" | "alumno" | null;
  nombre: string | null;
  perfilEmail: string | null;
}

// Sesión + perfil de quien mira, UNA sola vez por request. El header del campus
// y la página corren en paralelo y los dos necesitan el rol: con `cache()` de
// React comparten la misma lectura en vez de repetirla. `getClaims()` verifica
// el token localmente (sin viaje de red a Supabase Auth, a diferencia de
// `getUser()`), así que el único viaje es la lectura de `profiles`.
// Lanza si Supabase falla (nunca se muestra "sin sesión" cuando en realidad
// falló la consulta). Devuelve null solo si NO hay sesión.
export const getSesion = cache(async (): Promise<Sesion | null> => {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getClaims();
  if (error) throw new Error(`No se pudo verificar tu sesión: ${error.message}`);
  const userId = auth?.claims?.sub;
  if (!userId) return null;

  const { data: perfil, error: errPerfil } = await supabase
    .from("profiles")
    .select("role, nombre, email")
    .eq("id", userId)
    .single();
  if (errPerfil) throw new Error(`No se pudo cargar tu perfil: ${errPerfil.message}`);

  const claimEmail = typeof auth.claims.email === "string" ? auth.claims.email : null;
  return {
    userId,
    email: claimEmail,
    role: perfil?.role ?? null,
    nombre: perfil?.nombre ?? null,
    perfilEmail: perfil?.email ?? null,
  };
});
