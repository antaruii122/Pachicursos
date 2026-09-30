// Mensaje legible de CUALQUIER error. Los errores de Supabase
// (PostgrestError / StorageError / AuthError) son objetos con `message`
// pero no siempre `instanceof Error` — el patrón viejo
// `err instanceof Error ? err.message : "Error desconocido"` escondía el
// motivo real detrás de "Error desconocido" (bug 2026-09-30: un reordenamiento
// de clases falló y nadie pudo ver por qué).
const RED = /fetch failed|ConnectTimeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|network|UND_ERR/i;

export function mensajeError(err: unknown): string {
  const crudo = err instanceof Error ? `${err.message} ${String(err.cause ?? "")}` : JSON.stringify(err ?? "");
  // Un corte de conexión no es un error del usuario: se explica en simple
  // (bug 2026-09-30: el admin vio un volcado "TypeError: fetch failed …
  // ConnectTimeoutError …" en pantalla).
  if (RED.test(crudo)) return "Se cortó la conexión con el servidor. Revisa tu internet e intenta de nuevo en unos segundos.";
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; details?: unknown; hint?: unknown };
    if (typeof e.message === "string" && e.message) {
      return typeof e.details === "string" && e.details && e.details.length < 140
        ? `${e.message} (${e.details})`
        : e.message;
    }
  }
  if (typeof err === "string" && err) return err;
  return "Error desconocido";
}
