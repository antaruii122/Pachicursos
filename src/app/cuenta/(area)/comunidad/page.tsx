import { HiloPregunta } from "@/components/ClassQuestions";
import { campusCard, Eyebrow } from "@/components/campus/ui";
import { armarHilos, esTablaFaltante, type Pregunta } from "@/lib/preguntas";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

// "Comunidad" del menú principal (pestaña de la maqueta: "Preguntas y
// conversación"). Junta las preguntas de TODAS las clases a las que la
// alumna tiene acceso — RLS de 0007 ya filtra qué puede ver cada una. Se
// pregunta desde la clase (la pregunta siempre queda ligada a una clase).
const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "mias", label: "Mis preguntas" },
  { id: "sin-responder", label: "Sin respuesta del equipo" },
] as const;

export default async function ComunidadPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro = "todas" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login?next=/cuenta/comunidad");

  const { data, error } = await supabase
    .from("class_questions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error && !esTablaFaltante(error)) throw new Error(`No se pudieron cargar las preguntas: ${error.message}`);

  const [{ data: clases }, { data: cursos }, { data: perfil }] = await Promise.all([
    supabase.from("course_videos").select("id, orden, titulo, course_id"),
    supabase.from("courses").select("id, slug, titulo"),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);
  const claseDe = new Map((clases ?? []).map((c) => [c.id, c]));
  const cursoDe = new Map((cursos ?? []).map((c) => [c.id, c]));
  const esAdmin = perfil?.role === "admin";

  const hilos = armarHilos(((data ?? []) as Pregunta[]).filter((p) => !p.oculto));
  const visibles =
    filtro === "mias"
      ? hilos.filter((h) => h.user_id === user.id)
      : filtro === "sin-responder"
        ? hilos.filter((h) => !h.respondida && !h.es_equipo)
        : hilos;

  return (
    <div>
      <Eyebrow>Mi campus</Eyebrow>
      <h1 className="mt-1 text-[1.9rem] font-normal">Comunidad</h1>
      <p className="mb-6 mt-1 max-w-[62ch] text-[.92rem] text-[var(--tinta-suave)]">
        Preguntas y conversación de tus clases. Para preguntar algo nuevo, entra a la clase y escribe al final, en
        &quot;Preguntas de la clase&quot;.
      </p>

      <nav aria-label="Filtrar" className="mb-5 flex flex-wrap gap-1.5 font-[family-name:var(--font-ui)] text-[.82rem]">
        {FILTROS.map((f) => (
          <Link
            key={f.id}
            href={`/cuenta/comunidad?filtro=${f.id}`}
            aria-current={filtro === f.id ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              filtro === f.id ? "bg-[var(--rosa)] font-medium text-[var(--vino)]" : "text-[var(--tinta-suave)] hover:bg-white"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {visibles.length === 0 ? (
        <div className={`${campusCard} p-8 text-center`}>
          <p className="text-[var(--tinta-suave)]">
            {filtro === "mias"
              ? "Todavía no has hecho preguntas."
              : filtro === "sin-responder"
                ? "No hay preguntas esperando respuesta."
                : "Todavía no hay preguntas en tus clases. ¡Sé la primera!"}
          </p>
          <Link
            href="/cuenta/mis-cursos"
            className="mt-4 inline-flex rounded-full bg-[var(--vino)] px-6 py-2.5 font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-white hover:bg-[var(--vino-claro)]"
          >
            Ir a mis clases
          </Link>
        </div>
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
                    <Link href={`/cursos/${curso.slug}/clase/${clase.orden}#preguntas-clase`} className="text-[var(--vino)] underline underline-offset-4">
                      Clase {clase.orden}: {clase.titulo}
                    </Link>
                  ) : (
                    "Clase"
                  )}
                </p>
                <HiloPregunta hilo={h} userId={user.id} esAdmin={esAdmin} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
