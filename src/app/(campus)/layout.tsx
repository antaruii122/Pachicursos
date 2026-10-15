import { CampusFooter } from "@/components/campus/CampusFooter";
import { CampusHeader } from "@/components/campus/CampusHeader";

// Shell de las pantallas principales del campus (diseño NUTFEM 2027, Pachi
// 2026-10-16): Inicio · Módulos · Mis programas. Cada página pone su propio
// contenedor porque la portada ocupa todo el ancho. La sesión la exige cada
// página con `cargarCampus` (src/lib/campus.ts).
export default function CampusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tema-campus flex min-h-svh flex-col">
      <CampusHeader />
      <main id="contenido-principal" className="flex-1">
        {children}
      </main>
      <CampusFooter />
    </div>
  );
}
