"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Actualiza solo el propio nombre del usuario logueado. El cliente normal
// (no service_role) alcanza porque 0002_profiles_role_column_protection.sql
// ya deja `nombre` editable por su dueño vía GRANT de columna — `role` es
// el único campo bloqueado a service_role, no hace falta nada especial acá.
export async function updateNombre(nombre: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const limpio = nombre.trim();
  if (!limpio) return { error: "El nombre no puede quedar vacío" };

  const { error } = await supabase.from("profiles").update({ nombre: limpio }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/cuenta/perfil");
  return { ok: true };
}
