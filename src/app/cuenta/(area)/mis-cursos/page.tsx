import { Eyebrow, ProgressBar, ProgressRing, ShortcutCard, StatBlock, campusCard } from "@/components/campus/ui";
import { campusDelUsuario, type CursoCampus } from "@/lib/progreso";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

// "Mi Campus" — pantalla 2 de la maqueta (docs/maqueta-campus.md): saludo,
// "Continúa donde quedaste", anillo de avance real y desglose por módulo.
// Todo sale de lesson_progress + course_modules; nada inventado.
export default async function MisCursosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login?next=/cuenta/mis-cursos");

  const [{ data: profile }, cursos] = await Promise.all([
    supabase.from("profiles").select("nombre").eq("id", user.id).single(),
    campusDelUsuario(supabase, user.id),
  ]);
  // Sin nombre cargado (cuentas creadas antes de pedirlo), se usa la parte
  // del correo antes de la @, capitalizada — "Hola" solo se veía roto.
  const base = (profile?.nombre || user.email?.split("@")[0] || "").trim().split(/\s+/)[0];
  const primerNombre = base ? base.charAt(0).toUpperCase() + base.slice(1) : "";

  const [destacado, ...otros] = cursos;

  return (
    <div className="entrada">
      <Eyebrow>Mi campus</Eyebrow>
      <h1 className="mt-1 text-[clamp(1.8rem,4vw,2.4rem)] font-normal">
        {primerNombre ? `Hola, ${primerNombre}` : "Hola"}
      </h1>

      {!destacado ? (
        <div className={`${campusCard} mt-8 p-8 text-center`}>
          <p className="text-[var(--tinta-suave)]">Todavía no tienes cursos activos.</p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-full bg-[var(--vino)] px-6 py-2.5 font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-white hover:bg-[var(--vino-claro)]"
          >
            Ver cursos disponibles
          </Link>
        </div>
      ) : (
        <>
          <CursoDestacado curso={destacado} />
          {otros.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-[1.35rem] font-normal">Tus otros cursos</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {otros.map((c) => (
                  <CursoCompacto key={c.courseId} curso={c} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function pct(hechas: number, total: number) {
  return total > 0 ? Math.round((hechas / total) * 100) : 0;
}

function CursoDestacado({ curso }: { curso: CursoCampus }) {
  const avance = pct(curso.clasesCompletadas, curso.totalClases);
  const completado = curso.totalClases > 0 && curso.clasesCompletadas === curso.totalClases;
  const empezado = curso.ultimaActividad > 0;
  const modulosReales = curso.modulos.filter((m) => m.numero !== null);
  const modulosHechos = modulosReales.filter((m) => m.total > 0 && m.completadas === m.total).length;
  const hrefSiguiente = curso.siguiente ? `/cursos/${curso.slug}/clase/${curso.siguiente.orden}` : `/cursos/${curso.slug}`;

  return (
    <section className="mt-8" aria-labelledby="curso-destacado">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="curso-destacado" className="text-[1.35rem] font-normal">
          Mi curso
        </h2>
        <span className="font-[family-name:var(--font-ui)] text-[.82rem] text-[var(--tinta-suave)]">{curso.titulo}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="relative overflow-hidden rounded-[var(--radio-lg)] bg-[var(--vino-osc)] p-7 text-white shadow-[var(--sombra-lg)] sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border-[36px] border-white/5"
          />
          <span className="relative font-[family-name:var(--font-ui)] text-[.66rem] font-semibold uppercase tracking-[.2em] text-[var(--dorado)]">
            {completado ? "Curso completado" : empezado ? "Continúa donde quedaste" : "Empieza tu curso"}
          </span>
          <h3 className="relative mt-2 max-w-[30ch] text-[clamp(1.25rem,2.6vw,1.6rem)] font-normal leading-snug text-white">
            {curso.siguiente?.titulo ?? curso.titulo}
          </h3>
          {curso.siguiente?.moduloTitulo && (
            <p className="relative mt-2 text-[.85rem] text-white/70">
              Módulo {curso.siguiente.moduloNumero} · {curso.siguiente.moduloTitulo}
            </p>
          )}
          <Link
            href={hrefSiguiente}
            className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-[var(--vino)] transition-[transform,box-shadow] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-0.5 hover:shadow-[var(--sombra-md)] sm:w-auto"
          >
            {completado ? "Repasar el curso" : empezado ? "Retomar la clase" : "Comenzar"}
          </Link>
        </div>

        <div className={`${campusCard} flex items-center gap-6 p-6`}>
          <ProgressRing pct={avance} segmentos={modulosReales.length} />
          <div className="flex flex-col gap-3">
            <StatBlock label="Progreso general" value={`${curso.clasesCompletadas} de ${curso.totalClases} clases`} />
            {modulosReales.length > 0 && (
              <StatBlock label="Módulos completados" value={`${modulosHechos} de ${modulosReales.length}`} />
            )}
            <StatBlock label="Clases pendientes" value={curso.totalClases - curso.clasesCompletadas} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ShortcutCard
          href={hrefSiguiente}
          titulo="Clases"
          detalle={
            modulosReales.length > 0
              ? `${curso.totalClases} clases en ${modulosReales.length} módulos`
              : `${curso.totalClases} clases`
          }
        />
        <ShortcutCard href="/cuenta/actividad" titulo="Actividad" detalle="Tu historial de clases" />
        <ShortcutCard href="/cuenta/perfil" titulo="Mi perfil" detalle="Datos y contraseña" />
      </div>

      {!curso.tieneModulos ? (
        <ListaClases curso={curso} />
      ) : (
      <>
      <h2 className="mb-4 mt-12 text-[1.35rem] font-normal">Módulos</h2>
      <ol className={`${campusCard} divide-y divide-[var(--linea)] overflow-hidden`}>
        {curso.modulos.map((m, i) => {
          const p = pct(m.completadas, m.total);
          const noIniciado = m.completadas === 0;
          const fila = (
            <>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-ui)] text-[.8rem] font-semibold ${
                  p === 100
                    ? "bg-[var(--vino)] text-white"
                    : noIniciado
                      ? "border border-[var(--linea)] text-[var(--tinta-suave)]"
                      : "bg-[var(--rosa)] text-[var(--vino)]"
                }`}
              >
                {p === 100 ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  (m.numero ?? i + 1)
                )}
              </span>
              <span className="min-w-0 flex-1">
                {m.numero !== null && (
                  <span className="block font-[family-name:var(--font-ui)] text-[.62rem] font-semibold uppercase tracking-[.16em] text-[var(--tinta-suave)]">
                    Módulo {m.numero}
                  </span>
                )}
                <span className="block font-[family-name:var(--font-heading)] text-[1rem] leading-snug text-[var(--tinta)]">
                  {m.titulo}
                </span>
              </span>
              <span className="w-full shrink-0 sm:w-[210px]">
                <ProgressBar pct={p} />
                <span className="mt-1.5 flex justify-between font-[family-name:var(--font-ui)] text-[.72rem]">
                  <span className={noIniciado ? "text-[var(--tinta-suave)]" : "font-medium text-[var(--vino)]"}>
                    {noIniciado ? "No iniciado" : p === 100 ? "Completado" : `${p} % completado`}
                  </span>
                  <span className="text-[var(--tinta-suave)]">
                    {m.completadas}/{m.total}
                  </span>
                </span>
              </span>
            </>
          );
          return (
            <li key={m.id ?? "sin-modulo"}>
              {m.primeraOrden !== null ? (
                <Link
                  href={`/cursos/${curso.slug}/clase/${m.primeraOrden}`}
                  className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors duration-[var(--dur)] hover:bg-[var(--crema-2)] sm:flex-nowrap"
                >
                  {fila}
                </Link>
              ) : (
                <div className="flex flex-wrap items-center gap-4 px-5 py-4 opacity-60 sm:flex-nowrap">{fila}</div>
              )}
            </li>
          );
        })}
      </ol>
      </>
      )}
    </section>
  );
}

// Curso sin módulos: cada clase con su estado, y la próxima resaltada.
function ListaClases({ curso }: { curso: CursoCampus }) {
  return (
    <>
      <h2 className="mb-4 mt-12 text-[1.35rem] font-normal">Clases</h2>
      <ol className={`${campusCard} divide-y divide-[var(--linea)] overflow-hidden`}>
        {curso.clases.map((c) => {
          const esSiguiente = curso.siguiente?.orden === c.orden && !c.completada;
          return (
            <li key={c.orden}>
              <Link
                href={`/cursos/${curso.slug}/clase/${c.orden}`}
                className={`flex items-center gap-4 px-5 py-4 transition-colors duration-[var(--dur)] hover:bg-[var(--crema-2)] ${
                  esSiguiente ? "bg-[var(--crema-2)]" : ""
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-ui)] text-[.8rem] font-semibold ${
                    c.completada
                      ? "bg-[var(--vino)] text-white"
                      : esSiguiente
                        ? "border-2 border-[var(--vino)] text-[var(--vino)]"
                        : "border border-[var(--linea)] text-[var(--tinta-suave)]"
                  }`}
                >
                  {c.completada ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-label="Completada">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    c.orden
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-[family-name:var(--font-heading)] text-[1rem] leading-snug text-[var(--tinta)]">
                    {c.titulo}
                  </span>
                  {c.duracion ? (
                    <span className="text-[.74rem] text-[var(--tinta-suave)]">{Math.round(c.duracion / 60)} min</span>
                  ) : null}
                </span>
                <span className="shrink-0 font-[family-name:var(--font-ui)] text-[.74rem]">
                  {c.completada ? (
                    <span className="text-[var(--ok)]">Completada</span>
                  ) : esSiguiente ? (
                    <span className="rounded-full bg-[var(--vino)] px-3 py-1 text-white">Sigue aquí</span>
                  ) : (
                    <span className="text-[var(--tinta-suave)]">Pendiente</span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function CursoCompacto({ curso }: { curso: CursoCampus }) {
  const avance = pct(curso.clasesCompletadas, curso.totalClases);
  return (
    <Link
      href={curso.siguiente ? `/cursos/${curso.slug}/clase/${curso.siguiente.orden}` : `/cursos/${curso.slug}`}
      className={`${campusCard} flex items-center gap-4 p-4 transition-[transform,box-shadow] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-0.5 hover:shadow-[var(--sombra-md)]`}
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[var(--radio-sm)] bg-[linear-gradient(160deg,var(--rosa),var(--dorado))]">
        {curso.coverImageUrl && (
          <Image src={curso.coverImageUrl} alt="" fill sizes="96px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-[family-name:var(--font-heading)] text-[1rem] text-[var(--tinta)]">{curso.titulo}</p>
        <ProgressBar pct={avance} className="mt-2" />
        <p className="mt-1 font-[family-name:var(--font-ui)] text-[.72rem] text-[var(--tinta-suave)]">
          {avance}% · {curso.clasesCompletadas}/{curso.totalClases} clases
        </p>
      </div>
    </Link>
  );
}
