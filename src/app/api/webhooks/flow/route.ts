import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getFlowPaymentStatus } from "@/lib/flow";
import { NextResponse } from "next/server";

// Webhook de Flow.cl (urlConfirmation). Flow solo manda { token } por POST —
// nunca un status firmado — así que la confianza viene de volver a
// consultar payment/getStatus con NUESTRA propia firma (ver lib/flow.ts).
// Nunca se confía en nada del body salvo el token. Procesado idempotente:
// si la compra ya está en un estado terminal, no se vuelve a tocar aunque
// Flow reintente la notificación (reintenta si no recibe 200 en <15s).
export async function POST(request: Request) {
  const admin = createServiceRoleClient();

  let token: FormDataEntryValue | null;
  try {
    const formData = await request.formData();
    token = formData.get("token");
  } catch {
    return NextResponse.json({ error: "Body no es form-urlencoded" }, { status: 400 });
  }
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Falta token" }, { status: 400 });
  }

  let statusResult;
  try {
    statusResult = await getFlowPaymentStatus(token);
  } catch (err) {
    // Falla de red/Flow: devolvemos error para que Flow reintente — no es
    // seguro asumir "no pagado" solo porque la consulta falló.
    await admin.from("payment_webhook_events").insert({
      proveedor: "flow",
      payload: { token, error: err instanceof Error ? err.message : "error desconocido" },
      procesado: false,
    });
    return NextResponse.json({ error: "No se pudo verificar el pago" }, { status: 502 });
  }

  await admin.from("payment_webhook_events").insert({
    proveedor: "flow",
    payload: { token, ...statusResult },
    procesado: true,
  });

  if (!statusResult.commerceOrder) {
    return NextResponse.json({ ok: true, note: "sin commerceOrder" });
  }

  const { data: purchase } = await admin
    .from("purchases")
    .select("id, estado")
    .eq("id", statusResult.commerceOrder)
    .eq("proveedor_pago", "flow")
    .maybeSingle();

  if (!purchase) {
    return NextResponse.json({ ok: true, note: "compra no encontrada" });
  }

  // Idempotencia: un estado terminal no se vuelve a mover, sin importar
  // cuántas veces Flow reintente la notificación.
  const yaEsTerminal = ["pagado", "fallido", "reembolsado", "revocado"].includes(purchase.estado);
  if (yaEsTerminal) {
    return NextResponse.json({ ok: true, note: "ya procesada" });
  }

  if (statusResult.status === "pagado") {
    await admin
      .from("purchases")
      .update({ estado: "pagado", id_transaccion: statusResult.flowOrder })
      .eq("id", purchase.id);
    // TODO (bloqueado en Parte A/G): acá van, cuando existan las cuentas:
    // - email de confirmación al alumno + bienvenida al curso (Resend)
    // - email de aviso de venta a Marcela (Resend)
    // - evento Purchase de Meta Pixel / Conversions API (Parte G)
  } else if (statusResult.status === "rechazado" || statusResult.status === "anulado") {
    await admin.from("purchases").update({ estado: "fallido" }).eq("id", purchase.id);
  }
  // "pendiente": no se toca, Flow puede volver a notificar más tarde
  // (medios asíncronos como pago en efectivo).

  return NextResponse.json({ ok: true });
}
