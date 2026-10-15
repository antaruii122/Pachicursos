import { PROGRAMA } from "@/lib/programa";

// Pie del campus (diseño NUTFEM 2027): marca a la izquierda, soporte a la
// derecha. Si aún no hay correo de soporte ([VERIFY: Pachi]) la línea no se
// muestra; los enlaces legales se mantienen.
export function CampusFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--linea)] bg-white py-7">
      <div className="mx-auto flex w-[min(1180px,92vw)] flex-wrap items-center justify-between gap-x-8 gap-y-3 font-[family-name:var(--font-ui)] text-[.74rem] text-[var(--tinta-suave)]">
        <span className="uppercase tracking-[.04em]">Academia NUTFEM · Diplomado NUTFEM 2027</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href="/legal/terminos" className="hover:text-[var(--vino)]">
            Términos
          </a>
          <a href="/legal/privacidad" className="hover:text-[var(--vino)]">
            Privacidad
          </a>
          <a href="/legal/cookies" className="hover:text-[var(--vino)]">
            Cookies
          </a>
          {PROGRAMA.soporteEmail && (
            <span>
              Soporte académico:{" "}
              <a href={`mailto:${PROGRAMA.soporteEmail}`} className="font-medium text-[var(--carmin)] underline underline-offset-2">
                {PROGRAMA.soporteEmail}
              </a>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
