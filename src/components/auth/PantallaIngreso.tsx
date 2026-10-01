import { LoginForm } from "@/components/auth/LoginForm";
import { CampusLogo } from "@/components/campus/ui";
import { Suspense } from "react";

// Pantalla 1 de la maqueta "Campus NUTFEM" (docs/maqueta-campus.md): sin
// header, aro malva grande arriba a la derecha, logo centrado, tarjeta de
// bienvenida con el formulario. Es la home (`/`) y también `/cuenta/login`
// (que conserva `?next=` para volver a la página pedida).
export function PantallaIngreso() {
  return (
    <div className="tema-campus relative flex min-h-svh flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 -top-44 h-[560px] w-[560px] rounded-full border-[78px] border-[var(--malva)] opacity-70"
      />

      <main id="contenido-principal" className="relative flex flex-1 flex-col items-center px-4 py-10">
        {/* my-auto (no items-center en el padre): centra cuando sobra alto, pero
            nunca recorta la parte de arriba en pantallas bajas. */}
        <div className="entrada my-auto flex w-full max-w-[400px] flex-col items-center">
          <CampusLogo apilado />

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
