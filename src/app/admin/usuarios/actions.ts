"use server";

import { mensajeError } from "@/lib/errores";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// Mismo criterio de defensa en profundidad que admin/cursos/actions.ts:
// cada server action vuelve a chequear el rol acá, aunque el layout de
// /admin ya lo haya validado.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Requiere rol admin");

  return user;
}

// Cambiar `role` requiere service_role — 0002_profiles_role_column_protection.sql
// revocó ese UPDATE para el cliente normal (incluso para admins), justo para
// que nadie pueda auto-promoverse. Antes de esta acción, la única forma de
// hacer esto era correr scripts/set-admin-role.mjs a mano en una terminal.
export async function setUserRole(
  userId: string,
  role: "admin" | "alumno",
): Promise<{ ok: true } | { error: string }> {
  try {
    const admin = await requireAdmin();

    if (userId === admin.id && role === "alumno") {
      return { error: "No puedes quitarte el rol de admin a ti mismo — pídele a otro admin que lo haga." };
    }

    const serviceRole = createServiceRoleClient();
    const { error } = await serviceRole.from("profiles").update({ role }).eq("id", userId);
    if (error) throw error;

    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

// ---------------------------------------------------------------------------
// Crear usuaria directo desde el admin (pantalla 4 de la maqueta) y asignar
// contraseña nueva. Hoy es la ÚNICA forma confiable de dar acceso: el correo
// de "olvidé mi contraseña" no llega a las alumnas porque el SMTP por
// defecto de Supabase solo envía a miembros del equipo del proyecto
// (confirmado en supabase.com/docs/guides/auth/auth-smtp, 2026-09-30).

// Contraseña legible para dictar/copiar (estilo de la maqueta:
// "Ciclo 7kq2 M9xw"), sin caracteres ambiguos (0/O, 1/l/I).
const PALABRAS = ["Ciclo", "Semilla", "Raiz", "Luna", "Brote", "Nido", "Savia", "Trigo", "Avena", "Flor"];
const ALFABETO = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generarContrasena(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  const trozo = (from: number) =>
    Array.from(bytes.slice(from, from + 4), (b) => ALFABETO[b % ALFABETO.length]).join("");
  return `${PALABRAS[bytes[8] % PALABRAS.length]}-${trozo(0)}-${trozo(4)}`;
}

async function urlDelCampus(): Promise<string> {
  // Se usa el dominio desde donde está trabajando el admin (no
  // NEXT_PUBLIC_SITE_URL: apunta a cursos.alimentatufertilidad.com, cuyo DNS
  // todavía no está conectado — el link del mensaje no funcionaría).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "pachicursos.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function mensajeBienvenida(p: { nombre: string; email: string; password: string; url: string; curso: string | null }) {
  const primer = p.nombre.trim().split(/\s+/)[0] || "";
  return [
    `¡Hola${primer ? ` ${primer}` : ""}! 🌸`,
    p.curso
      ? `Ya tienes acceso a "${p.curso}" en el campus de Alimenta tu Fertilidad.`
      : "Ya tienes tu cuenta en el campus de Alimenta tu Fertilidad.",
    "",
    `Ingresa aquí: ${p.url}/cuenta/login`,
    `Correo: ${p.email}`,
    `Contraseña: ${p.password}`,
    "",
    "Te recomendamos cambiar la contraseña al entrar (Mi perfil → Seguridad).",
  ].join("\n");
}

export type ResultadoAcceso =
  | { ok: true; email: string; password: string; url: string; mensaje: string; aviso?: string }
  | { error: string };

export async function crearUsuaria(input: {
  nombre: string;
  email: string;
  password: string;
  rol: "alumno" | "admin";
  courseId: string | null;
}): Promise<ResultadoAcceso> {
  try {
    const admin = await requireAdmin();
    const nombre = input.nombre.trim();
    const email = input.email.trim().toLowerCase();
    if (!nombre) return { error: "Escribe el nombre completo." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Ese correo no es válido." };
    const password = input.password.trim() || generarContrasena();
    if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres (o déjala vacía para generarla)." };

    const sr = createServiceRoleClient();
    const { data: creado, error: errCrear } = await sr.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // la crea el admin: no hace falta confirmar por correo
      user_metadata: { nombre },
    });
    if (errCrear || !creado.user) {
      if (/already|registered|exists/i.test(errCrear?.message ?? "")) {
        return { error: "Ya existe una cuenta con ese correo. Búscala en Alumnas y usuarios y asígnale el curso desde ahí." };
      }
      throw errCrear ?? new Error("No se pudo crear la cuenta");
    }
    const userId = creado.user.id;

    // El trigger handle_new_user crea el perfil (nombre + email). El rol solo
    // se puede cambiar con service_role (0002).
    if (input.rol === "admin") {
      const { error } = await sr.from("profiles").update({ role: "admin" }).eq("id", userId);
      if (error) throw error;
    }

    let curso: string | null = null;
    let aviso: string | undefined;
    if (input.courseId) {
      const { data: c } = await sr.from("courses").select("titulo").eq("id", input.courseId).single();
      curso = c?.titulo ?? null;
      const { error } = await sr.from("purchases").insert({
        user_id: userId,
        course_id: input.courseId,
        monto: 0,
        moneda: "CLP",
        proveedor_pago: "manual",
        estado: "pagado",
        otorgado_por: admin.id,
      });
      // La cuenta ya existe: no se revierte; se avisa para asignarlo a mano.
      if (error) aviso = `La cuenta se creó, pero no se pudo asignar el curso: ${mensajeError(error)}. Asígnalo desde la lista.`;
    }

    revalidatePath("/admin/usuarios");
    const url = await urlDelCampus();
    return { ok: true, email, password, url, mensaje: mensajeBienvenida({ nombre, email, password, url, curso }), aviso };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}

export async function asignarContrasenaNueva(userId: string): Promise<ResultadoAcceso> {
  try {
    await requireAdmin();
    const sr = createServiceRoleClient();
    const { data: perfil, error: errPerfil } = await sr.from("profiles").select("nombre, email").eq("id", userId).single();
    if (errPerfil || !perfil?.email) throw errPerfil ?? new Error("No se encontró la cuenta");
    const password = generarContrasena();
    const { error } = await sr.auth.admin.updateUserById(userId, { password });
    if (error) throw error;
    const url = await urlDelCampus();
    const mensaje = [
      `¡Hola${perfil.nombre ? ` ${perfil.nombre.trim().split(/\s+/)[0]}` : ""}! Te dejamos una contraseña nueva para el campus de Alimenta tu Fertilidad.`,
      "",
      `Ingresa aquí: ${url}/cuenta/login`,
      `Correo: ${perfil.email}`,
      `Contraseña: ${password}`,
      "",
      "Puedes cambiarla al entrar (Mi perfil → Seguridad).",
    ].join("\n");
    return { ok: true, email: perfil.email, password, url, mensaje };
  } catch (err) {
    return { error: mensajeError(err) };
  }
}
