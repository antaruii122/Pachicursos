import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// No guardar este cliente en una variable global: se crea uno nuevo
// por cada función/request (recomendación oficial de Supabase para SSR).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se llamó setAll desde un Server Component (sin acceso a escribir
            // cookies). Se puede ignorar si el middleware refresca la sesión.
          }
        },
      },
    },
  );
}
