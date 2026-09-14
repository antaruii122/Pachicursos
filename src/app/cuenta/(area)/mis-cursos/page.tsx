import { cursosConProgresoDelUsuario } from "@/lib/progreso";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const card = "rounded-[18px] bg-white shadow-[0_12px_30px_rgba(78,15,38,.1)]";

export default async function MisCursosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login?next=/cuenta/mis-cursos");

  const cursosConProgreso = await cursosConProgresoDelUsuario(supabase, user.id);

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-[1.8rem] font-semibold text-[var(--vino)]">
        Mis cursos
      </h1>

      {cursosConProgreso.length === 0 ? (
        <p className="text-sm text-[var(--tinta-suave)]">
          Todavía no tenés cursos.{" "}
          <Link href="/" className="text-[var(--carmin)] underline">
            Ver cursos disponibles
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cursosConProgreso.map((c) => {
            const pct =
              c.totalClases > 0 ? Math.round((c.clasesCompletadas / c.totalClases) * 100) : 0;
            const completado = c.totalClases > 0 && c.clasesCompletadas === c.totalClases;

            return (
              <div key={c.courseId} className={`${card} overflow-hidden`}>
                <div className="relative flex aspect-video items-center justify-center bg-[linear-gradient(160deg,var(--rosa),var(--dorado))]">
                  {c.coverImageUrl ? (
                    <Image
                      src={c.coverImageUrl}
                      alt={c.titulo}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--vino)" strokeWidth="1.2">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                  {completado && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[var(--vino)] px-2.5 py-1 font-[family-name:var(--font-ui)] text-[.68rem] font-semibold uppercase tracking-wide text-white shadow-[var(--sombra-sm)]">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      Completado
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="mb-2 font-[family-name:var(--font-ui)] text-[.95rem] font-medium text-[var(--tinta)]">
                    {c.titulo}
                  </h2>
                  <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-[var(--rosa)]">
                    <div className="h-full rounded-full bg-[var(--vino)]" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mb-4 text-[.78rem] text-[var(--tinta-suave)]">{pct}% completado</p>
                  <Link
                    href={`/cursos/${c.slug}/clase/${c.siguienteOrden}`}
                    className="inline-flex w-full items-center justify-center rounded-full bg-[var(--vino)] px-5 py-2.5 font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-white hover:bg-[var(--vino-claro)]"
                  >
                    {completado ? "Repasar" : "Continuar"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
