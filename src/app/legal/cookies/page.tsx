import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Aviso de Cookies — Alimenta Tu Fertilidad" };

export default function CookiesPage() {
  return (
    <LegalPage titulo="Aviso de Cookies" actualizado="[FECHA]">
      <section>
        <h2 className="mb-2 text-[1.15rem]">1. Cookies de sesión</h2>
        <p>[PLACEHOLDER: cookies de Supabase Auth necesarias para mantener la sesión iniciada.]</p>
      </section>
      <section>
        <h2 className="mb-2 text-[1.15rem]">2. Cookies de marketing</h2>
        <p>[PLACEHOLDER: Meta Pixel — usado para medir campañas y hacer retargeting a quien visitó la landing/clase gratis sin comprar (ver docs/cursos.md, sección &ldquo;Marketing y adquisición&rdquo;).]</p>
      </section>
      <section>
        <h2 className="mb-2 text-[1.15rem]">3. Cómo desactivarlas</h2>
        <p>[PLACEHOLDER: instrucciones o link a configuración del navegador.]</p>
      </section>
    </LegalPage>
  );
}
