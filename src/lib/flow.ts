import { createHmac } from "node:crypto";

// Cliente de la API de Flow.cl, server-only. Patrón de firma y endpoints
// verificados contra una implementación real ya validada contra el sandbox
// de Flow (la doc oficial developers.flow.cl es una SPA que bloquea scraping
// automático) — no adivinado:
// - Firma: params ordenados alfabéticamente (excluyendo "s"), concatenados
//   como "nombre"+"valor" sin separador, HMAC-SHA256 con el secretKey, hex.
// - payment/create: campos commerceOrder, subject, currency, amount, email,
//   urlConfirmation, urlReturn, paymentMethod (9 = todos los medios,
//   incluye Webpay con cuotas ya habilitadas en la config del comercio).
//   Respuesta: { url, token, flowOrder } — el link de pago real es
//   `${url}?token=${token}`.
// - payment/getStatus: mismo patrón de firma, devuelve status numérico:
//   1 pendiente, 2 PAGADA, 3 rechazada, 4 anulada (a veces viene como
//   string, siempre convertir con Number() antes de comparar).
// - El webhook de Flow (urlConfirmation) NO manda un payload firmado: manda
//   solo { token }. La confianza viene de volver a consultar payment/getStatus
//   con nuestra propia firma — nunca confiar en el status que "dice" venir
//   en el POST.

type FlowParams = Record<string, string | number>;

function flowConfig() {
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  const apiBase = (process.env.FLOW_API_URL || "https://sandbox.flow.cl/api").replace(/\/+$/, "");
  if (!apiKey || !secretKey) throw new Error("Faltan FLOW_API_KEY / FLOW_SECRET_KEY");
  return { apiKey, secretKey, apiBase };
}

function signFlowParams(params: FlowParams, secretKey: string): string {
  const toSign = Object.keys(params)
    .filter((k) => k !== "s")
    .sort()
    .reduce((acc, k) => acc + k + String(params[k]), "");
  return createHmac("sha256", secretKey).update(toSign, "utf8").digest("hex");
}

async function flowPost(service: string, params: FlowParams): Promise<Record<string, unknown>> {
  const { apiKey, secretKey, apiBase } = flowConfig();
  const withKey = { ...params, apiKey };
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(withKey)) body.append(k, String(v));
  body.append("s", signFlowParams(withKey, secretKey));

  const res = await fetch(`${apiBase}/${service}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Flow ${service} respondió ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function flowGet(service: string, params: FlowParams): Promise<Record<string, unknown>> {
  const { apiKey, secretKey, apiBase } = flowConfig();
  const withKey = { ...params, apiKey };
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(withKey)) usp.append(k, String(v));
  usp.append("s", signFlowParams(withKey, secretKey));

  const res = await fetch(`${apiBase}/${service}?${usp.toString()}`);
  const text = await res.text();
  if (!res.ok) throw new Error(`Flow ${service} respondió ${res.status}: ${text}`);
  return JSON.parse(text);
}

export async function createFlowPayment(params: {
  commerceOrder: string;
  subject: string;
  amountClp: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
}): Promise<{ paymentUrl: string; token: string; flowOrder: string }> {
  const res = await flowPost("payment/create", {
    commerceOrder: params.commerceOrder,
    subject: params.subject,
    currency: "CLP",
    amount: params.amountClp,
    email: params.email,
    paymentMethod: 9,
    urlConfirmation: params.urlConfirmation,
    urlReturn: params.urlReturn,
  });

  const url = res.url != null ? String(res.url) : null;
  const token = res.token != null ? String(res.token) : null;
  if (!url || !token) throw new Error("Flow payment/create: sin url/token en la respuesta");

  return { paymentUrl: `${url}?token=${token}`, token, flowOrder: String(res.flowOrder ?? "") };
}

export type FlowPaymentStatus = "pendiente" | "pagado" | "rechazado" | "anulado";

export interface FlowStatusResult {
  status: FlowPaymentStatus;
  commerceOrder: string | null;
  flowOrder: string | null;
  amount: number | null;
}

// status: Flow a veces serializa números como string — SIEMPRE Number() antes de comparar.
function mapFlowStatus(status: unknown): FlowPaymentStatus {
  const s = status == null ? null : Number(status);
  if (s === 2) return "pagado";
  if (s === 1) return "pendiente";
  if (s === 4) return "anulado";
  return "rechazado"; // 3 rechazada, o cualquier valor desconocido
}

export async function getFlowPaymentStatus(token: string): Promise<FlowStatusResult> {
  const res = await flowGet("payment/getStatus", { token });
  return {
    status: mapFlowStatus(res.status),
    commerceOrder: res.commerceOrder != null ? String(res.commerceOrder) : null,
    flowOrder: res.flowOrder != null ? String(res.flowOrder) : null,
    amount: res.amount != null ? Number(res.amount) : null,
  };
}
