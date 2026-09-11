import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Términos y Condiciones — Alimenta Tu Fertilidad" };

export default function TerminosPage() {
  return (
    <LegalPage titulo="Términos y Condiciones" actualizado="[FECHA]">
      <section>
        <h2 className="mb-2 text-[1.15rem]">1. Sobre estos cursos</h2>
        <p>[PLACEHOLDER: describir qué es la plataforma, quién la opera (Marcela Calderón / razón social), y qué se vende.]</p>
      </section>
      <section>
        <h2 className="mb-2 text-[1.15rem]">2. Acceso y cuentas</h2>
        <p>[PLACEHOLDER: condiciones de registro, uso personal de la cuenta.]</p>
      </section>
      <section>
        <h2 className="mb-2 text-[1.15rem]">3. Precios y pago</h2>
        <p>[PLACEHOLDER: moneda (CLP), medios de pago, cuotas, confirmación de compra.]</p>
      </section>
      <section>
        <h2 className="mb-2 text-[1.15rem]">4. Política de reembolsos</h2>
        <p>[PLACEHOLDER: confirmado en el plan del proyecto que la política actual es sin reembolsos — este texto debe reflejarlo formalmente, redactado por Marcela/asesor legal.]</p>
      </section>
      <section>
        <h2 className="mb-2 text-[1.15rem]">5. Propiedad intelectual</h2>
        <p>[PLACEHOLDER: el contenido de los cursos es propiedad de Alimenta Tu Fertilidad, prohibida su redistribución.]</p>
      </section>
      <section>
        <h2 className="mb-2 text-[1.15rem]">6. Contacto</h2>
        <p>[PLACEHOLDER: email de contacto.]</p>
      </section>
    </LegalPage>
  );
}
