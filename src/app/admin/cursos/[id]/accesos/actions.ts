"use server";

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
    const { supabase, adminId } = await requireAdmin();

    const { data: alumno } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    if (!alumno) {
      return { error: "No existe ninguna cuenta con ese email. El alumno tiene que registrarse primero." };
    }

    const { data: existente } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", alumno.id)
      .eq("course_id", courseId)
      .eq("estado", "pagado")
      .maybeSingle();
    if (existente) {
      return { error: "Ese alumno ya tiene acceso pagado a este curso." };
    }

    const { error } = await supabase.from("purchases").insert({
      user_id: alumno.id,
      course_id: courseId,
      monto: 0,
      moneda: "CLP",
      proveedor_pago: "manual",
      estado: "pagado",
      otorgado_por: adminId,
    });
    if (error) throw error;

    revalidatePath(`/admin/cursos/${courseId}/accesos`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
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
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
