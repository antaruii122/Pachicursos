import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { campusCard } from "@/components/campus/ui";
import { Logo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

// Home = puerta de entrada del campus (pedido de Marcela 2026-10-01): esta
// plataforma NO vende. La venta y el pago ocurren antes, en la landing de
// venta; después el equipo le da acceso a cada alumna. Aquí solo se entra.
// Con sesión iniciada no hay nada que mostrar: se va directo a su campus
// (o al panel si es admin).
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: perfil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    redirect(perfil?.role === "admin" ? "/admin" : "/cuenta/mis-cursos");
  }

  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema)]">
      <SiteHeader />
      <main id="contenido-principal" className="relative flex flex-1 items-center overflow-hidden py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,var(--rosa)_0%,transparent_70%)] opacity-70"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-32 h-[420px] w-[420px] rounded-full border-[28px] border-[var(--dorado)] opacity-40"
        />
        <div className="entrada relative mx-auto w-[min(560px,90vw)] text-center">
          <div className="mb-8 flex justify-center">
            <Logo apilado />
          </div>
          <h1 className="mb-3 text-[clamp(1.9rem,4vw,2.5rem)] font-normal">Bienvenida al Campus NUTFEM</h1>
          <p className="mx-auto mb-9 max-w-[46ch] text-[1.02rem] text-[var(--tinta-suave)]">
            Aquí están tus clases, tu progreso, los materiales y las preguntas con el equipo docente.
          </p>

          <div className={`${campusCard} p-7 sm:p-9`}>
            <Link
              href="/cuenta/login"
              className="flex w-full items-center justify-center rounded-full bg-[var(--vino)] px-8 py-4 font-[family-name:var(--font-ui)] text-[1rem] font-semibold text-white shadow-[var(--sombra-md)] transition-colors hover:bg-[var(--vino-claro)]"
            >
              Ingresa aquí como alumna
            </Link>
            <p className="mt-5 text-[.85rem] text-[var(--tinta-suave)]">
              Usa el correo y la contraseña que te enviamos al darte acceso.
            </p>
          </div>

          <p className="mx-auto mt-8 max-w-[48ch] text-[.82rem] text-[var(--tinta-suave)]">
            ¿Aún no eres alumna? La inscripción se hace en la página del curso; después de tu compra el equipo activa
            tu acceso a este campus.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
