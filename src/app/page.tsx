import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { formatCLP } from "@/lib/types";
import Link from "next/link";

const card = "rounded-[18px] bg-white shadow-[0_12px_30px_rgba(78,15,38,.1)]";

// Home del subdominio de cursos: catálogo de cursos publicados. No es la
// landing de marca del sitio principal (eso queda en alimentatufertilidad.com,
// fuera de este subdominio, tal cual el plan) — solo lista lo que hay para
// comprar acá.
export default async function Home() {
  const supabase = await createClient();
  const { data: cursos } = await supabase
    .from("courses")
    .select("slug, titulo, subtitulo_corto, precio, cover_image_url")
    .eq("estado", "publicado")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema)]">
      <SiteHeader />
      <div className="mx-auto w-[min(1160px,90vw)] flex-1 py-14">
        <h1 className="mb-2 text-[clamp(1.9rem,4vw,2.6rem)]">Cursos disponibles</h1>
        <p className="mb-10 max-w-[60ch] text-[1.05rem] text-[var(--tinta-suave)]">
          Nutrición y fertilidad femenina, con Marcela Calderón.
        </p>

        {!cursos || cursos.length === 0 ? (
          <p className="text-sm text-[var(--tinta-suave)]">
            Todavía no hay cursos publicados. Volvé pronto.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cursos.map((c) => (
              <Link
                key={c.slug}
                href={`/cursos/${c.slug}`}
                className={`${card} overflow-hidden transition hover:shadow-[0_16px_36px_rgba(78,15,38,.16)]`}
              >
                <div className="flex aspect-video items-center justify-center bg-[linear-gradient(160deg,var(--rosa),var(--dorado))]">
                  {c.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover_image_url} alt={c.titulo} className="h-full w-full object-cover" />
                  ) : (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--vino)" strokeWidth="1.2">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="mb-1 font-[family-name:var(--font-heading)] text-[1.1rem] font-semibold text-[var(--vino)]">
                    {c.titulo}
                  </h2>
                  {c.subtitulo_corto && (
                    <p className="mb-3 text-[.85rem] text-[var(--tinta-suave)]">{c.subtitulo_corto}</p>
                  )}
                  <p className="font-[family-name:var(--font-ui)] text-[.95rem] font-medium text-[var(--carmin)]">
                    {formatCLP(c.precio)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
