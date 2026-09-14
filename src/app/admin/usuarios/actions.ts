"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";

// Mismo criterio de defensa en profundidad que admin/cursos/actions.ts:
// cada server action vuelve a chequear el rol acá, aunque el layout de
// /admin ya lo haya validado.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Requiere rol admin");

  return user;
}

// Cambiar `role` requiere service_role — 0002_profiles_role_column_protection.sql
// revocó ese UPDATE para el cliente normal (incluso para admins), justo para
// que nadie pueda auto-promoverse. Antes de esta acción, la única forma de
// hacer esto era correr scripts/set-admin-role.mjs a mano en una terminal.
export async function setUserRole(
  userId: string,
  role: "admin" | "alumno",
): Promise<{ ok: true } | { error: string }> {
  try {
    const admin = await requireAdmin();

    if (userId === admin.id && role === "alumno") {
      return { error: "No podés quitarte el rol de admin a vos mismo — pedile a otro admin que lo haga." };
    }

    const serviceRole = createServiceRoleClient();
    const { error } = await serviceRole.from("profiles").update({ role }).eq("id", userId);
    if (error) throw error;

    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
