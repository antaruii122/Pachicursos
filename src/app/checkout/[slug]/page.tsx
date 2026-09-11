import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { createFlowPayment } from "@/lib/flow";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

const card = "rounded-[18px] bg-white p-8 shadow-[0_12px_30px_rgba(78,15,38,.1)]";

// Inicia el checkout: crea la fila `purchases` en estado "pendiente" con el
// user_id ya guardado (ver docs/cursos.md — así el webhook sabe qué compra
// actualizar sin depender de que la sesión del navegador siga viva), y
// redirige a Flow.cl. El commerceOrder que Flow guarda es el id interno de
// esta fila, nunca algo que el cliente pueda inventar.
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/cuenta/login?next=${encodeURIComponent(`/checkout/${slug}`)}`);

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, titulo, precio, estado")
    .eq("slug", slug)
    .maybeSingle();
  if (!course || course.estado !== "publicado") notFound();

  // Ya tiene acceso pagado — no tiene sentido cobrarle de nuevo.
  const { data: yaComprado } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("estado", "pagado")
    .maybeSingle();
  if (yaComprado) redirect(`/cursos/${slug}/clase/1`);

  const { data: purchase, error: insertError } = await supabase
    .from("purchases")
    .insert({
      user_id: user.id,
      course_id: course.id,
      monto: course.precio,
      moneda: "CLP",
      proveedor_pago: "flow",
      estado: "pendiente",
    })
    .select("id")
    .single();

  if (insertError || !purchase) {
    return (
      <ErrorCheckout slug={slug} mensaje="No se pudo iniciar la compra. Probá de nuevo." />
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  // redirect() lanza internamente un error especial de Next.js para cortar
  // el render — nunca debe quedar atrapado por este catch, por eso solo la
  // llamada a Flow (lo que sí puede fallar de verdad) vive dentro del try.
  let paymentUrl: string;
  try {
    const result = await createFlowPayment({
      commerceOrder: purchase.id,
      subject: course.titulo,
      amountClp: course.precio,
      email: user.email!,
      urlConfirmation: `${siteUrl}/api/webhooks/flow`,
      urlReturn: `${siteUrl}/checkout/retorno`,
    });
    paymentUrl = result.paymentUrl;
  } catch {
    return (
      <ErrorCheckout
        slug={slug}
        mensaje="No se pudo conectar con la pasarela de pago. Probá de nuevo en un momento."
      />
    );
  }

  redirect(paymentUrl);
}

function ErrorCheckout({ slug, mensaje }: { slug: string; mensaje: string }) {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema-2)]">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className={`${card} w-full max-w-sm text-center`}>
          <h1 className="mb-2 text-xl font-semibold text-[var(--tinta)]">Algo salió mal</h1>
          <p className="mb-6 text-sm text-[var(--tinta-suave)]">{mensaje}</p>
          <a
            href={`/checkout/${slug}`}
            className="inline-flex items-center justify-center rounded-full bg-[var(--vino)] px-6 py-2.5 font-[family-name:var(--font-ui)] text-[.9rem] font-medium text-white hover:bg-[var(--vino-claro)]"
          >
            Reintentar pago
          </a>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
