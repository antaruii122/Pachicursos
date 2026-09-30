"use server";

import { mensajeError } from "@/lib/errores";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Requiere rol admin");

  return { supabase, adminId: user.id };
}

// TODO (bloqueado en Parte A): el plan pide avisarle por email al alumno
// cuando se le otorga acceso manual, igual que en una compra normal — eso
// necesita la cuenta de Resend, que todavía no existe. El acceso se otorga
// igual; el email queda pendiente hasta que exista RESEND_API_KEY.
export async function grantAccess(
  courseId: string,
  email: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const { supabase } = await requireAdmin();

    const { data: alumno } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    if (!alumno) {
      return { error: "No existe ninguna cuenta con ese email. Créala primero desde Alumnas y usuarios." };
    }
    return await grantAccessToUser(courseId, alumno.id);
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

// Mismo acceso manual, pero directo por id de usuaria — lo usa la lista de
// "Alumnas y usuarios" para asignar un curso con un click, sin tipear email.
export async function grantAccessToUser(
  courseId: string,
  userId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const { supabase, adminId } = await requireAdmin();

    const { data: existente } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("estado", "pagado")
      .maybeSingle();
    if (existente) {
      return { error: "Esa persona ya tiene acceso a este curso." };
    }

    const { error } = await supabase.from("purchases").insert({
      user_id: userId,
      course_id: courseId,
      monto: 0,
      moneda: "CLP",
      proveedor_pago: "manual",
      estado: "pagado",
      otorgado_por: adminId,
    });
    if (error) throw error;

    revalidatePath(`/admin/cursos/${courseId}/accesos`);
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

export async function updatePurchaseEstado(
  courseId: string,
  purchaseId: string,
  estado: "revocado" | "reembolsado",
): Promise<{ ok: true } | { error: string }> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("purchases").update({ estado }).eq("id", purchaseId);
    if (error) throw error;
    revalidatePath(`/admin/cursos/${courseId}/accesos`);
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}
