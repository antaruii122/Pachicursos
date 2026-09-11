import { ClassNotes } from "@/components/ClassNotes";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { formatDuracion } from "@/lib/types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const card = "rounded-[18px] bg-white shadow-[0_12px_30px_rgba(78,15,38,.1)]";

// Shell del reproductor (Parte C): estados bloqueado/desbloqueado/notas.
// El embed real de Vimeo (pedido server-side, validado, nunca vimeo_id
// expuesto al cliente) se agrega en la Parte D — acá el área de video es
// un placeholder visual que respeta el mismo gate de acceso.
export default async function ClasePage({
  params,
}: {
  params: Promise<{ slug: string; n: string }>;
}) {
  const { slug, n } = await params;
  const orden = Number(n);
  if (!Number.isInteger(orden)) notFound();

  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, titulo")
    .eq("slug", slug)
    .maybeSingle();
  if (!course) notFound();

  const { data: clases } = await supabase
    .from("course_videos")
    .select("id, orden, titulo, duracion, is_free_intro")
    .eq("course_id", course.id)
    .order("orden", { ascending: true });
  if (!clases) notFound();

  const clase = clases.find((c) => c.orden === orden);
  if (!clase) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentPath = `/cursos/${slug}/clase/${orden}`;

  if (!clase.is_free_intro && !user) {
    redirect(`/cuenta/login?next=${encodeURIComponent(currentPath)}`);
  }

  let tieneAcceso = clase.is_free_intro;
  if (!tieneAcceso && user) {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("estado", "pagado")
      .maybeSingle();
    tieneAcceso = !!purchase;
  }

  let notaExistente = "";
  if (tieneAcceso && user) {
    const { data: nota } = await supabase
      .from("video_notes")
      .select("contenido")
      .eq("user_id", user.id)
      .eq("video_id", clase.id)
      .maybeSingle();
    notaExistente = nota?.contenido ?? "";
  }

  return (
    <div className="min-h-svh bg-[var(--crema-2)]">
      <SiteHeader />
      <div className="mx-auto max-w-[920px] px-6 py-10">
        <Link
          href={`/cursos/${slug}`}
          className="mb-5 flex items-center gap-2 font-[family-name:var(--font-ui)] text-[.85rem] text-[var(--tinta-suave)] hover:text-[var(--vino)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {course.titulo}
        </Link>

        <div className={`${card} relative mb-6 aspect-video overflow-hidden bg-[var(--vino-osc)]`}>
          {tieneAcceso ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-[78px] w-[78px] items-center justify-center rounded-full bg-white/92">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--vino)">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <span className="absolute bottom-4 left-4 rounded-full bg-black/35 px-3 py-1.5 font-[family-name:var(--font-ui)] text-[.78rem] text-white">
                Clase {clase.orden} {clase.is_free_intro ? "· Gratis" : ""}
              </span>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(160deg,var(--vino),var(--vino-osc))] opacity-90" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-[1.5px] border-white/40 bg-white/12">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 018 0v3" />
                  </svg>
                </div>
                <div>
                  <b className="mb-1 block font-[family-name:var(--font-ui)] text-white">
                    Esta clase es parte del curso completo
                  </b>
                  <span className="text-[.88rem] text-white/70">
                    Cómprala junto al resto para desbloquearla
                  </span>
                </div>
                <a
                  href={`/cursos/${slug}#precio`}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--vino)] px-7 py-3 font-[family-name:var(--font-ui)] text-[.9rem] font-medium text-white"
                >
                  Comprar curso
                </a>
              </div>
            </>
          )}
        </div>

        <div className="mb-8">
          <span className="font-[family-name:var(--font-ui)] text-[.68rem] font-semibold uppercase tracking-[.2em] text-[var(--carmin)]">
            Clase {clase.orden}
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-heading)] text-[1.5rem] font-semibold text-[var(--vino)]">
            {clase.titulo}
          </h1>
          {clase.duracion && (
            <span className="text-[.85rem] text-[var(--tinta-suave)]">
              {formatDuracion(clase.duracion)}
            </span>
          )}
        </div>

        {tieneAcceso && <ClassNotes videoId={clase.id} initialContent={notaExistente} />}
      </div>
    </div>
  );
}
