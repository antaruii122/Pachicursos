import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getFlowPaymentStatus } from "@/lib/flow";
import { createClient } from "@/lib/supabase/server";

const card = "w-full max-w-sm rounded-[18px] bg-white p-8 text-center shadow-[0_12px_30px_rgba(78,15,38,.1)]";

// Flow redirige acá después del pago (urlReturn). El estado real de la
// compra lo actualiza el webhook (/api/webhooks/flow), no esta página —
// acá solo se le muestra al alumno qué pasó, re-consultando el estado a
// Flow con nuestra propia firma (nunca se confía en nada que venga en la URL
// salvo el token, que es solo un identificador opaco).
export default async function CheckoutRetornoPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Layout>
        <h1 className="mb-2 text-xl font-semibold text-[var(--tinta)]">Falta información</h1>
        <p className="text-sm text-[var(--tinta-suave)]">No encontramos el pago. Volvé a intentar desde el curso.</p>
      </Layout>
    );
  }

  let estado: "pagado" | "pendiente" | "rechazado" | "anulado" | "error" = "error";
  let slug: string | null = null;

  try {
    const status = await getFlowPaymentStatus(token);
    estado = status.status;

    if (status.commerceOrder) {
      const supabase = await createClient();
      const { data: purchase } = await supabase
        .from("purchases")
        .select("courses(slug)")
        .eq("id", status.commerceOrder)
        .maybeSingle();
      const courses = purchase?.courses;
      const course = Array.isArray(courses) ? courses[0] : courses;
      slug = course?.slug ?? null;
    }
  } catch {
    estado = "error";
  }

  if (estado === "pagado") {
    return (
      <Layout>
        <h1 className="mb-2 text-xl font-semibold text-[var(--vino)]">¡Gracias por tu compra!</h1>
        <p className="mb-6 text-sm text-[var(--tinta-suave)]">
          Ya podés acceder a tu curso. Te enviamos también un email de confirmación.
        </p>
        <a
          href="/cuenta/mis-cursos"
          className="inline-flex items-center justify-center rounded-full bg-[var(--vino)] px-6 py-2.5 font-[family-name:var(--font-ui)] text-[.9rem] font-medium text-white hover:bg-[var(--vino-claro)]"
        >
          Ir a Mis cursos
        </a>
      </Layout>
    );
  }

  if (estado === "pendiente") {
    return (
      <Layout>
        <h1 className="mb-2 text-xl font-semibold text-[var(--tinta)]">Pago en proceso</h1>
        <p className="text-sm text-[var(--tinta-suave)]">
          Tu pago está siendo confirmado (algunos medios, como pago en efectivo, tardan un poco más).
          Te avisamos por email cuando esté listo.
        </p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="mb-2 text-xl font-semibold text-[var(--tinta)]">El pago no se completó</h1>
      <p className="mb-6 text-sm text-[var(--tinta-suave)]">
        No te preocupes, no se realizó ningún cargo. Podés intentar de nuevo cuando quieras.
      </p>
      {slug && (
        <a
          href={`/checkout/${slug}`}
          className="inline-flex items-center justify-center rounded-full bg-[var(--vino)] px-6 py-2.5 font-[family-name:var(--font-ui)] text-[.9rem] font-medium text-white hover:bg-[var(--vino-claro)]"
        >
          Reintentar pago
        </a>
      )}
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema-2)]">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className={card}>{children}</div>
      </div>
      <SiteFooter />
    </div>
  );
}
