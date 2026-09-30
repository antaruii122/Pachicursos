import { ClassMaterials } from "@/components/ClassMaterials";
import { ClassNotes } from "@/components/ClassNotes";
import { ClassQuestions } from "@/components/ClassQuestions";
import { preguntasDeClase } from "@/lib/preguntas";
import { parseRecursos } from "@/lib/recursos";
import { ClassPlayer } from "@/components/ClassPlayer";
import { ClassSidebar } from "@/components/ClassSidebar";
import { CampusHeader } from "@/components/campus/CampusHeader";
import { Eyebrow } from "@/components/campus/ui";
import { MarkCompleteButton } from "@/components/MarkCompleteButton";
import { createClient } from "@/lib/supabase/server";
import { formatDuracion } from "@/lib/types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const card = "rounded-[18px] bg-white shadow-[var(--sombra-md)]";

// Reproductor de clase. El estado bloqueado se resuelve acá mismo (server
// component); el video real se pide desde ClassPlayer al endpoint
// server-side validado de la Parte D — el vimeo_id nunca viaja en el HTML
// inicial de esta página, solo después de que ese endpoint confirma acceso.
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

  const [{ data: clases }, { data: modulos }] = await Promise.all([
    supabase
      .from("course_videos")
      .select("id, orden, titulo, duracion, is_free_intro, estado_procesamiento, module_id, resources")
      .eq("course_id", course.id)
      .order("orden", { ascending: true }),
    supabase.from("course_modules").select("id, orden, titulo").eq("course_id", course.id),
  ]);
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

  let hasPurchase = false;
  let esAdmin = false;
  if (user) {
    const { data: purchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("estado", "pagado")
      .maybeSingle();
    // Admin ve todas las clases (necesita revisar el curso como alumna sin
    // tener que "comprarlo"). Mismo criterio en /api/.../player y /recursos.
    const { data: perfil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    esAdmin = perfil?.role === "admin";
    hasPurchase = !!purchase || esAdmin;
  }
  const tieneAcceso = clase.is_free_intro || hasPurchase;

  let notaExistente = "";
  let progresoExistente = 0;
  let completedIds = new Set<string>();
  if (user) {
    const [{ data: nota }, { data: progreso }, { data: completados }] = await Promise.all([
      tieneAcceso
        ? supabase
            .from("video_notes")
            .select("contenido")
            .eq("user_id", user.id)
            .eq("video_id", clase.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      tieneAcceso
        ? supabase
            .from("lesson_progress")
            .select("progress_seconds")
            .eq("user_id", user.id)
            .eq("video_id", clase.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("lesson_progress")
        .select("video_id")
        .eq("user_id", user.id)
        .eq("completed", true)
        .in(
          "video_id",
          clases.map((c) => c.id),
        ),
    ]);
    notaExistente = nota?.contenido ?? "";
    progresoExistente = progreso?.progress_seconds ?? 0;
    completedIds = new Set((completados ?? []).map((p) => p.video_id));
  }

  // null = la función de preguntas aún no está activada (falta 0007).
  const hilos = user && tieneAcceso ? await preguntasDeClase(supabase, clase.id) : null;

  const ordenadas = [...clases].sort((a, b) => a.orden - b.orden);
  const siguiente = ordenadas.find((c) => c.orden > orden);
  const modulosOrdenados = [...(modulos ?? [])].sort((a, b) => a.orden - b.orden);
  const moduloActual = clase.module_id ? modulosOrdenados.find((m) => m.id === clase.module_id) : undefined;
  const numeroModulo = moduloActual ? modulosOrdenados.indexOf(moduloActual) + 1 : null;

  return (
    // Pantalla 3 de la maqueta (docs/maqueta-campus.md): tema del campus,
    // player + título + "marcar completada" a la izquierda, tarjeta del
    // módulo actual a la derecha. Sin pestañas. Sin sesión (clase gratis),
    // CampusHeader muestra el botón "Ingresar" en vez del menú de cuenta.
    <div className="tema-campus min-h-svh">
      <CampusHeader />
      <main id="contenido-principal" className="mx-auto w-[min(1180px,92vw)] py-8">
        <nav aria-label="Ruta" className="mb-5 flex flex-wrap items-center gap-1.5 font-[family-name:var(--font-ui)] text-[.78rem] text-[var(--tinta-suave)]">
          <Link href={hasPurchase ? "/cuenta/mis-cursos" : `/cursos/${slug}`} className="underline decoration-[var(--linea)] underline-offset-4 hover:text-[var(--vino)]">
            {course.titulo}
          </Link>
          {moduloActual && (
            <>
              <span aria-hidden="true">/</span>
              <span className="text-[var(--vino)]">Módulo {numeroModulo}</span>
            </>
          )}
        </nav>

        <div className="md:flex md:items-start md:gap-8">
        <ClassSidebar
          courseSlug={slug}
          courseTitulo={course.titulo}
          clases={clases}
          modulos={modulos ?? []}
          currentOrden={orden}
          hasPurchase={hasPurchase}
          completedIds={completedIds}
        />

        <div className="min-w-0 flex-1">
        {tieneAcceso ? (
          <div className="mb-6">
            <ClassPlayer
              courseSlug={slug}
              videoId={clase.id}
              estadoProcesamiento={clase.estado_procesamiento}
              initialProgressSeconds={progresoExistente}
            />
          </div>
        ) : (
          <div className={`${card} relative mb-6 aspect-video overflow-hidden bg-[var(--vino-osc)]`}>
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
          </div>
        )}

        <div className="mb-8">
          <Eyebrow className="!text-[var(--tinta-suave)]">
            Clase {clase.orden}
            {clase.duracion ? ` · ${formatDuracion(clase.duracion)}` : ""}
          </Eyebrow>
          <h1 className="mt-2 max-w-[34ch] text-[clamp(1.45rem,3vw,1.95rem)] font-normal leading-snug">
            {clase.titulo}
          </h1>
          {user && tieneAcceso && (
            <div className="mt-5">
              <MarkCompleteButton
                videoId={clase.id}
                yaCompletada={completedIds.has(clase.id)}
                siguienteHref={siguiente ? `/cursos/${slug}/clase/${siguiente.orden}` : null}
              />
            </div>
          )}
        </div>

        {tieneAcceso && (
          <ClassMaterials courseSlug={slug} videoId={clase.id} recursos={parseRecursos(clase.resources)} />
        )}

        {user && hilos && <ClassQuestions videoId={clase.id} hilos={hilos} userId={user.id} esAdmin={esAdmin} />}

        {tieneAcceso && <ClassNotes videoId={clase.id} initialContent={notaExistente} />}
        </div>
        </div>
      </main>
    </div>
  );
}
