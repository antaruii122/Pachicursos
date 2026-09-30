import { redirect } from "next/navigation";

// "Seguridad" ahora es una sección dentro de Mi perfil (2026-09-30). Esta
// ruta queda solo para que los links viejos sigan funcionando.
export default function SeguridadPage() {
  redirect("/cuenta/perfil#seguridad");
}
