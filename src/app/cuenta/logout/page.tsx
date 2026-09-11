import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LogoutRedirect } from "@/components/auth/LogoutRedirect";

// Cierra sesión y vuelve al login. Vive en su propia ruta para poder
// enlazarla desde cualquier header/nav una vez que existan (Parte C).
export default function LogoutPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema)]">
      <SiteHeader />
      <main id="contenido-principal" className="flex flex-1 items-center justify-center p-6">
        <LogoutRedirect />
      </main>
      <SiteFooter />
    </div>
  );
}
