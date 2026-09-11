import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

// Estructura genérica reutilizada por las 3 páginas legales (ver
// docs/cursos.md, Parte E): el desarrollo solo arma el layout — el texto
// real lo escribe Marcela o su asesor legal antes del lanzamiento (Parte G).
export function LegalPage({
  titulo,
  actualizado,
  children,
}: {
  titulo: string;
  actualizado: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema)]">
      <SiteHeader />
      <main id="contenido-principal" className="mx-auto w-[min(760px,90vw)] flex-1 py-14">
        <div className="mb-8 rounded-[14px] border border-[var(--dorado)] bg-[var(--rosa)] p-4 font-[family-name:var(--font-ui)] text-[.85rem] text-[var(--vino)]">
          [PLACEHOLDER] Este texto es una estructura genérica, no es contenido legal real todavía.
          Marcela (o su asesor legal) tiene que reemplazarlo antes del lanzamiento.
        </div>
        <h1 className="mb-2 text-[2rem]">{titulo}</h1>
        <p className="mb-8 text-[.85rem] text-[var(--tinta-suave)]">Última actualización: {actualizado}</p>
        <div className="flex flex-col gap-6 text-[.95rem] leading-relaxed text-[var(--tinta)]">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
