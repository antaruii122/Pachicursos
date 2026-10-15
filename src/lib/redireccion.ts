// Valida el parámetro `?next=` antes de redirigir. Solo se aceptan rutas
// internas ("/algo"). Sin esto, un link armado como
// `/cuenta/login?next=javascript:...` ejecutaba código en el sitio después
// del login (LoginForm hace `window.location.href = next`), y
// `?next=https://otro-sitio` mandaba a la alumna fuera del campus
// (revisión de seguridad 2026-10-06).
export function rutaInternaSegura(next: string | null, porDefecto: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return porDefecto;
  }
  return next;
}
