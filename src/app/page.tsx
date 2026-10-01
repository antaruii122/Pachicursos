import { PantallaIngreso } from "@/components/auth/PantallaIngreso";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Home = ingreso (pedido de Pachi 2026-10-01: plataforma 100% privada; la
// página inicial es el login, sin cursos ni contenido antes de iniciar
// sesión). Diseño: pantalla 1 de la maqueta Campus NUTFEM. Con sesión se va
// directo a su campus (o al panel si es admin).
export default async function Home() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (userId) {
    const { data: perfil } = await supabase.from("profiles").select("role").eq("id", userId).single();
    redirect(perfil?.role === "admin" ? "/admin" : "/cuenta/mis-cursos");
  }

  return <PantallaIngreso />;
}
