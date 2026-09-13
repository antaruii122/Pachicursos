import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { formatCLP } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

const card = "rounded-[var(--radio-md)] bg-white shadow-[var(--sombra-md)]";

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
      <main id="contenido-principal" className="relative mx-auto w-[min(1160px,90vw)] flex-1 py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,var(--rosa)_0%,transparent_70%)] opacity-60"
        />
        <div className="entrada relative">
          <h1 className="mb-2 text-[clamp(1.9rem,4vw,2.6rem)]">Cursos disponibles</h1>
          <p className="mb-10 max-w-[60ch] text-[1.05rem] text-[var(--tinta-suave)]">
            Nutrición y fertilidad femenina, con Marcela Calderón.
          </p>
        </div>

        {!cursos || cursos.length === 0 ? (
          <p className="text-sm text-[var(--tinta-suave)]">
            Todavía no hay cursos publicados. Volvé pronto.
          </p>
        ) : (
          <div className="relative grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {cursos.map((c) => (
              <Link
                key={c.slug}
                href={`/cursos/${c.slug}`}
                className={`${card} group overflow-hidden transition-[transform,box-shadow] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-1 hover:shadow-[var(--sombra-xl)]`}
              >
                <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-[linear-gradient(160deg,var(--rosa),var(--dorado))]">
                  {c.cover_image_url ? (
                    <Image
                      src={c.cover_image_url}
                      alt={c.titulo}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[calc(var(--dur)*2)] ease-[var(--ease)] group-hover:scale-105"
                    />
                  ) : (
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--vino)" strokeWidth="1.1" opacity=".55">
                      <path d="M12 21c-4-3-7-6.5-7-10.2C5 7 7.2 5 10 5c1 0 1.7.4 2 1 .3-.6 1-1 2-1 2.8 0 5 2 5 5.8 0 3.7-3 7.2-7 10.2z" />
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
      </main>
      <SiteFooter />
    </div>
  );
}
