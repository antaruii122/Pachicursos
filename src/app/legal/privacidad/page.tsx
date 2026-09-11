import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Política de Privacidad — Alimenta Tu Fertilidad" };

export default function PrivacidadPage() {
  return (
    <LegalPage titulo="Política de Privacidad" actualizado="[FECHA]">
      <section>
        <h2 className="mb-2 text-[1.15rem]">1. Qué datos recolectamos</h2>
        <p>[PLACEHOLDER: email, nombre, datos de pago (procesados por Flow.cl/Stripe, no almacenados acá), progreso de curso, notas personales.]</p>
      </section>
      <section>
        <h2 className="mb-2 text-[1.15rem]">2. Para qué los usamos</h2>
        <p>[PLACEHOLDER: dar acceso a los cursos comprados, enviar emails transaccionales, mejorar la plataforma, marketing/retargeting vía Meta Pixel (ver sección de cookies).]</p>
      </section>
      <section>
        <h2 className="mb-2 text-[1.15rem]">3. Con quién los compartimos</h2>
        <p>[PLACEHOLDER: proveedores técnicos — Supabase (base de datos), Vimeo (video), Flow.cl/Stripe (pagos), Resend (email), Meta (publicidad).]</p>
      </section>
      <section>
        <h2 className="mb-2 text-[1.15rem]">4. Tus derechos</h2>
        <p>[PLACEHOLDER: acceso, rectificación, eliminación de datos — cómo solicitarlo.]</p>
      </section>
      <section>
        <h2 className="mb-2 text-[1.15rem]">5. Contacto</h2>
        <p>[PLACEHOLDER: email de contacto.]</p>
      </section>
    </LegalPage>
  );
}
