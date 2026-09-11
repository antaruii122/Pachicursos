import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const card = "rounded-[18px] bg-white shadow-[0_12px_30px_rgba(78,15,38,.1)]";

interface CursoConProgreso {
  courseId: string;
  slug: string;
  titulo: string;
  coverImageUrl: string | null;
  totalClases: number;
  clasesCompletadas: number;
  siguienteOrden: number;
}

async function calcularProgreso(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  slug: string,
  titulo: string,
  coverImageUrl: string | null,
): Promise<CursoConProgreso> {
  const { data: clases } = await supabase
    .from("course_videos")
    .select("id, orden")
    .eq("course_id", courseId)
    .order("orden", { ascending: true });

  const claseIds = (clases ?? []).map((c) => c.id);
  let clasesCompletadas = 0;
  let siguienteOrden = clases?.[0]?.orden ?? 1;

  if (claseIds.length > 0) {
    const { data: progreso } = await supabase
      .from("lesson_progress")
      .select("video_id, completed, actualizado_en")
      .eq("user_id", userId)
      .in("video_id", claseIds);

    clasesCompletadas = (progreso ?? []).filter((p) => p.completed).length;

    // "Continuar" apunta a la clase con actividad más reciente; si nunca
    // empezó, a la primera.
    const masReciente = (progreso ?? []).sort(
      (a, b) => new Date(b.actualizado_en).getTime() - new Date(a.actualizado_en).getTime(),
    )[0];
    if (masReciente) {
      const clase = clases?.find((c) => c.id === masReciente.video_id);
      if (clase) siguienteOrden = clase.orden;
    }
  }

  return {
    courseId,
    slug,
    titulo,
    coverImageUrl,
    totalClases: claseIds.length,
    clasesCompletadas,
    siguienteOrden,
  };
}

export default async function MisCursosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login?next=/cuenta/mis-cursos");

  const { data: purchasesRaw } = await supabase
    .from("purchases")
    .select("course_id, courses(id, slug, titulo, cover_image_url)")
    .eq("user_id", user.id)
    .eq("estado", "pagado");

  const cursosComprados = (purchasesRaw ?? [])
    .map((p) => (Array.isArray(p.courses) ? p.courses[0] : p.courses))
    .filter((c): c is { id: string; slug: string; titulo: string; cover_image_url: string | null } => !!c);

  const cursosConProgreso = await Promise.all(
    cursosComprados.map((c) =>
      calcularProgreso(supabase, user.id, c.id, c.slug, c.titulo, c.cover_image_url),
    ),
  );

  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema-2)]">
      <SiteHeader />
      <div className="mx-auto w-[min(1000px,90vw)] flex-1 py-10">
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
      <SiteFooter />
    </div>
  );
}
