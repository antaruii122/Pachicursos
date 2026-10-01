import { LoginForm } from "@/components/auth/LoginForm";
import { CampusLogo } from "@/components/campus/ui";
import Link from "next/link";
import { Suspense } from "react";

// Ingreso al campus — pantalla 1 de la maqueta (docs/maqueta-campus.md):
// sin header de sitio, logo de aro centrado, tarjeta de bienvenida, aro
// decorativo malva arriba a la derecha. Solo estilo; la lógica vive intacta
// en LoginForm.
export default function LoginPage() {
  return (
    <div className="tema-campus relative flex min-h-svh flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 -top-44 h-[560px] w-[560px] rounded-full border-[78px] border-[var(--malva)] opacity-70"
      />

      <Link
        href="/"
        className="relative z-10 m-5 inline-flex w-fit items-center gap-1.5 font-[family-name:var(--font-ui)] text-[.78rem] text-[var(--tinta-suave)] hover:text-[var(--vino)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Volver al sitio
      </Link>

      <main id="contenido-principal" className="relative flex flex-1 flex-col items-center px-4 pb-10">
        {/* my-auto (no items-center en el padre): centra cuando sobra alto, pero
            nunca recorta la parte de arriba en pantallas bajas. */}
        <div className="entrada my-auto flex w-full max-w-[400px] flex-col items-center">
          <Link href="/" aria-label="NUTFEM — inicio">
            <CampusLogo apilado />
          </Link>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-center text-[.75rem] text-[var(--tinta-suave)]">
            Plataforma privada para alumnas y equipo docente de NUTFEM.
          </p>
        </div>
      </main>
    </div>
  );
}
