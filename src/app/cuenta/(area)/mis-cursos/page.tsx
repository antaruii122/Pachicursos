import { redirect } from "next/navigation";

// "Mi Campus" ahora es /inicio (diseño NUTFEM 2027, 2026-10-16). Esta ruta
// queda solo para no romper enlaces guardados ni correos antiguos.
export default function MisCursosPage() {
  redirect("/inicio");
}
