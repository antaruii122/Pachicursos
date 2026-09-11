export function SiteFooter() {
  return (
    <footer className="bg-[var(--vino-osc)] py-10 text-[rgba(255,255,255,.6)]">
      <div className="mx-auto flex w-[min(1160px,90vw)] flex-wrap items-center justify-between gap-4 font-[family-name:var(--font-ui)] text-[.8rem]">
        <span>© Alimenta tu Fertilidad</span>
        <div className="flex gap-6">
          <a href="/legal/terminos" className="text-[rgba(255,255,255,.75)] hover:text-white">
            Términos
          </a>
          <a href="/legal/privacidad" className="text-[rgba(255,255,255,.75)] hover:text-white">
            Privacidad
          </a>
          <a href="/legal/cookies" className="text-[rgba(255,255,255,.75)] hover:text-white">
            Cookies
          </a>
        </div>
      </div>
    </footer>
  );
}
