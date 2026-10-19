import { campusDelUsuario, type CursoCampus, type ModuloProgreso } from "@/lib/progreso";
import { getSesion } from "@/lib/sesion";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type EstadoModulo = "completado" | "en_curso" | "proximamente";

export function pct(hechas: number, total: number): number {
  return total > 0 ? Math.round((hechas / total) * 100) : 0;
}

// Estado de un módulo según el avance real de la alumna (no hay fechas aún):
// completado = todas sus clases hechas; en curso = tiene alguna hecha o es el
// módulo de la "siguiente clase"; el resto, próximamente.
export function estadoModulo(m: ModuloProgreso, curso: CursoCampus): EstadoModulo {
  if (m.total > 0 && m.completadas === m.total) return "completado";
  if (m.completadas > 0 || (m.numero !== null && curso.siguiente?.moduloNumero === m.numero)) return "en_curso";
  return "proximamente";
}

export const ETIQUETA_ESTADO: Record<EstadoModulo, string> = {
  completado: "Completado",
  en_curso: "En curso",
  proximamente: "Próximamente",
};

export function numero2(n: number | null): string {
  return String(n ?? 0).padStart(2, "0");
}

// Carga común de las pantallas del campus: exige sesión y trae los programas
// de la alumna con su avance. El programa principal es el de actividad más
// reciente (campusDelUsuario ya los ordena así).
export async function cargarCampus(rutaActual: string) {
  const sesion = await getSesion();
  if (!sesion) redirect(`/cuenta/login?next=${encodeURIComponent(rutaActual)}`);
  const supabase = await createClient();
  const esAdmin = sesion.role === "admin";
  const cursos = await campusDelUsuario(supabase, sesion.userId, { comoAdmin: esAdmin });
  return { supabase, userId: sesion.userId, esAdmin, cursos, principal: cursos[0] ?? null };
}
