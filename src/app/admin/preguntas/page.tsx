import { HiloPregunta } from "@/components/ClassQuestions";
import { campusCard } from "@/components/campus/ui";
import { armarHilos, esTablaFaltante, type Pregunta } from "@/lib/preguntas";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

// Bandeja de preguntas de TODAS las clases (patrón Teachable "responder desde
// el admin sin navegar" + filtros de moderación de Hotmart). Por defecto
// muestra primero lo que espera respuesta del equipo.
const FILTROS = [
  { id: "pendientes", label: "Sin responder" },
  { id: "todas", label: "Todas" },
  { id: "ocultas", label: "Ocultas" },
] as const;

export default async function AdminPreguntasPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro = "pendientes" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("class_questions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (esTablaFaltante(error)) {
    return (
      <div>
        <h1 className="mb-4 text-[1.9rem] font-normal">Preguntas</h1>
        <p className={`${campusCard} p-6 text-sm text-[var(--tinta-suave)]`}>
          Las preguntas por clase todavía no están activadas: falta correr la migración
          <code className="mx-1">0007_class_questions.sql</code> en Supabase.
        </p>
      </div>
    );
  }
  if (error) throw new Error(`No se pudieron cargar las preguntas: ${error.message}`);

  const filas = (data ?? []) as Pregunta[];
  const [{ data: clases }, { data: cursos }] = await Promise.all([
    supabase.from("course_videos").select("id, orden, titulo, course_id"),
    supabase.from("courses").select("id, slug, titulo"),
  ]);
  const claseDe = new Map((clases ?? []).map((c) => [c.id, c]));
  const cursoDe = new Map((cursos ?? []).map((c) => [c.id, c]));

  const hilos = armarHilos(filas);
  const pendientes = hilos.filter((h) => !h.respondida && !h.oculto && !h.es_equipo);
  const visibles =
    filtro === "todas" ? hilos : filtro === "ocultas" ? hilos.filter((h) => h.oculto) : pendientes;

  return (
    <div>
      <h1 className="mb-1 text-[1.9rem] font-normal">Preguntas</h1>
      <p className="mb-6 text-[.88rem] text-[var(--tinta-suave)]">
        Lo que preguntan tus alumnas en cada clase. Responde aquí mismo; tu respuesta aparece como{" "}
        <b className="text-[var(--vino)]">Equipo docente</b>.
      </p>

      <nav aria-label="Filtrar preguntas" className="mb-5 flex flex-wrap gap-1.5 font-[family-name:var(--font-ui)] text-[.82rem]">
        {FILTROS.map((f) => (
          <Link
            key={f.id}
            href={`/admin/preguntas?filtro=${f.id}`}
            aria-current={filtro === f.id ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              filtro === f.id ? "bg-[var(--rosa)] font-medium text-[var(--vino)]" : "text-[var(--tinta-suave)] hover:bg-white"
            }`}
          >
            {f.label}
            {f.id === "pendientes" && pendientes.length > 0 && (
              <span className="ml-1.5 rounded-full bg-[var(--vino)] px-1.5 text-[.7rem] text-white">{pendientes.length}</span>
            )}
          </Link>
        ))}
      </nav>

      {visibles.length === 0 ? (
        <p className={`${campusCard} p-6 text-sm text-[var(--tinta-suave)]`}>
          {filtro === "pendientes" ? "¡Todo respondido! No hay preguntas esperando." : "No hay preguntas aquí."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {visibles.map((h) => {
            const clase = claseDe.get(h.video_id);
            const curso = cursoDe.get(h.course_id);
            return (
              <li key={h.id}>
                <p className="mb-1.5 font-[family-name:var(--font-ui)] text-[.74rem] text-[var(--tinta-suave)]">
                  {curso?.titulo ?? "Curso"} ·{" "}
                  {clase && curso ? (
                    <Link href={`/cursos/${curso.slug}/clase/${clase.orden}`} className="text-[var(--vino)] underline underline-offset-4">
                      Clase {clase.orden}: {clase.titulo}
                    </Link>
                  ) : (
                    "Clase"
                  )}
                </p>
                <HiloPregunta hilo={h} userId={user?.id ?? ""} esAdmin abrirRespuesta={!h.respondida} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
