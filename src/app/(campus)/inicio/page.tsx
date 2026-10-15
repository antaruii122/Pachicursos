import { Eyebrow, ProgressBar, ProgressRing, campusCard } from "@/components/campus/ui";
import { ETIQUETA_ESTADO, cargarCampus, estadoModulo, numero2, pct } from "@/lib/campus";
import { PROGRAMA } from "@/lib/programa";
import type { CursoCampus } from "@/lib/progreso";
import Image from "next/image";
import Link from "next/link";
import portada from "./portada.jpg";

// Inicio del campus (diseño "Campus académico", Pachi 2026-10-16): portada
// burdeos, "continuar con la siguiente clase", avance del programa.
// Pendiente de sus propias tablas (se agregan una a una, ver EJECUCION.md):
// próxima sesión en vivo, avisos académicos y calendario del mes.
export default async function InicioPage() {
  const { principal } = await cargarCampus("/inicio");

  return (
    <div className="entrada">
      <Portada curso={principal} />
      {principal ? (
        <div className="mx-auto w-[min(1180px,92vw)] pb-4 pt-10">
          <Continuar curso={principal} />
          <AvancePrograma curso={principal} />
        </div>
      ) : (
        <div className="mx-auto w-[min(1180px,92vw)] py-12">
          <div className={`${campusCard} p-8 text-center`}>
            <p className="text-[var(--tinta-suave)]">
              Todavía no tienes programas activos. Si crees que es un error, escríbele al equipo de NUTFEM.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Portada({ curso }: { curso: CursoCampus | null }) {
  const moduloActual = curso?.siguiente?.moduloNumero ?? (curso?.tieneModulos ? 1 : null);
  const hrefModulo = curso ? (curso.tieneModulos ? `/modulos/${moduloActual ?? 1}` : "/modulos") : "/programas";
  return (
    <section className="bg-[var(--vino)] text-white">
      <div className="mx-auto grid w-[min(1180px,92vw)] lg:grid-cols-[1.15fr_1fr]">
        <div className="py-14 sm:py-16 lg:py-20 lg:pr-10">
          <p className="max-w-[60ch] font-[family-name:var(--font-ui)] text-[.7rem] font-bold uppercase leading-relaxed tracking-[.12em] text-[var(--rosa-fuerte)]">
            {curso ? `${curso.titulo} · ${PROGRAMA.generacion}` : `Academia NUTFEM · ${PROGRAMA.generacion}`}
          </p>
          <h1 className="mt-4 max-w-[16ch] text-[clamp(2.2rem,5vw,3.4rem)] font-medium leading-[1.08] text-white">
            Bienvenida al <span className="font-semibold text-[var(--rosa-fuerte)]">Campus Virtual NUTFEM</span>
          </h1>
          <p className="mt-5 max-w-[52ch] text-[1.05rem] leading-relaxed text-white/85">
            Espacio académico del Diplomado. Aquí encuentras tus clases y materiales, módulo por módulo.
          </p>
          {curso && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={hrefModulo} className="btn btn-rosa">
                Ir al módulo en curso
              </Link>
            </div>
          )}
        </div>
        {/* Foto del diseño de Pachi. [VERIFY: licencia de la foto] — viene del
            archivo de la diseñadora, probablemente de banco de imágenes. */}
        <div className="relative -mx-[4vw] min-h-[260px] sm:min-h-[320px] lg:mx-0 lg:min-h-full">
          <Image
            src={portada}
            alt="Alumna estudiando frente a su computador"
            fill
            priority
            sizes="(min-width: 1024px) 540px, 100vw"
            className="object-cover object-[70%_center]"
          />
        </div>
      </div>
    </section>
  );
}

function Continuar({ curso }: { curso: CursoCampus }) {
  const avance = pct(curso.clasesCompletadas, curso.totalClases);
  const completado = curso.totalClases > 0 && curso.clasesCompletadas === curso.totalClases;
  const empezado = curso.ultimaActividad > 0;
  const siguiente = curso.siguiente;
  const href = siguiente ? `/cursos/${curso.slug}/clase/${siguiente.orden}` : `/cursos/${curso.slug}`;
  const modulosReales = curso.modulos.filter((m) => m.numero !== null);
  const modulosHechos = modulosReales.filter((m) => m.total > 0 && m.completadas === m.total).length;

  return (
    <section aria-label="Tu siguiente paso" className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="border-t-[3px] border-[var(--rosa-fuerte)] bg-white p-7 shadow-[var(--sombra-sm)] ring-1 ring-[var(--linea)] sm:p-8">
        <Eyebrow>
          {completado ? "Programa completado" : empezado ? "Continuar con la siguiente clase" : "Empieza tu programa"}
        </Eyebrow>
        {siguiente?.moduloNumero ? (
          <p className="mt-3 font-[family-name:var(--font-ui)] text-[.85rem] text-[var(--tinta-suave)]">
            Módulo {numero2(siguiente.moduloNumero)}
            {siguiente.moduloTitulo ? ` · ${siguiente.moduloTitulo}` : ""}
          </p>
        ) : (
          <p className="mt-3 font-[family-name:var(--font-ui)] text-[.85rem] text-[var(--tinta-suave)]">{curso.titulo}</p>
        )}
        <h2 className="mt-1 max-w-[34ch] text-[clamp(1.25rem,2.4vw,1.65rem)] font-semibold leading-snug">
          {siguiente?.titulo ?? curso.titulo}
        </h2>
        {siguiente?.visualizadoPct != null && (
          <div className="mt-5 flex items-center gap-4">
            <ProgressBar pct={siguiente.visualizadoPct} className="flex-1" />
            <span className="shrink-0 font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--tinta-suave)]">
              {siguiente.visualizadoPct} % visualizado
            </span>
          </div>
        )}
        <Link href={href} className="btn btn-rosa mt-6">
          {completado ? "Repasar el programa" : empezado ? "Continuar clase" : "Comenzar"}
        </Link>
      </div>

      <div className={`${campusCard} flex items-center gap-6 p-6`}>
        <ProgressRing pct={avance} segmentos={modulosReales.length} />
        <div className="flex flex-col gap-3 font-[family-name:var(--font-ui)] text-[.85rem]">
          <div>
            <span className="block text-[.66rem] font-semibold uppercase tracking-[.14em] text-[var(--tinta-suave)]">
              Clases completadas
            </span>
            <span className="font-semibold text-[var(--tinta)]">
              {curso.clasesCompletadas} de {curso.totalClases}
            </span>
          </div>
          {modulosReales.length > 0 && (
            <div>
              <span className="block text-[.66rem] font-semibold uppercase tracking-[.14em] text-[var(--tinta-suave)]">
                Módulos completados
              </span>
              <span className="font-semibold text-[var(--tinta)]">
                {modulosHechos} de {modulosReales.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AvancePrograma({ curso }: { curso: CursoCampus }) {
  const modulos = curso.modulos.filter((m) => m.numero !== null);
  if (modulos.length === 0) return null;
  return (
    <section className="mt-14" aria-labelledby="avance-programa">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="avance-programa" className="text-[1.7rem]">
            Avance del programa
          </h2>
          <p className="mt-1 font-[family-name:var(--font-ui)] text-[.9rem] text-[var(--tinta-suave)]">
            {modulos.length} módulos · {curso.totalClases} clases
          </p>
        </div>
        <Link href="/modulos" className="font-[family-name:var(--font-ui)] text-[.9rem] font-semibold text-[var(--carmin)] hover:underline">
          Ver módulos
        </Link>
      </div>

      <ol
        className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
        style={{ ["--n" as string]: modulos.length }}
      >
        {modulos.map((m, i) => {
          const estado = estadoModulo(m, curso);
          const p = pct(m.completadas, m.total);
          return (
            <li key={m.id} className="relative">
              {i < modulos.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-10 top-5 hidden h-[2px] w-[calc(100%-1.5rem)] lg:block ${
                    estado === "completado" ? "bg-[var(--vino)]" : "bg-[var(--linea)]"
                  }`}
                />
              )}
              <Link href={`/modulos/${m.numero}`} className="group block">
                <span
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 font-[family-name:var(--font-ui)] text-[.82rem] font-bold ${
                    estado === "completado"
                      ? "border-[var(--vino)] bg-[var(--vino)] text-white"
                      : estado === "en_curso"
                        ? "border-[var(--rosa-fuerte)] bg-[var(--rosa-fuerte)] text-[var(--vino)]"
                        : "border-[var(--linea)] bg-white text-[var(--tinta-suave)]"
                  }`}
                >
                  {numero2(m.numero)}
                </span>
                <span className="mt-3 block max-w-[22ch] font-[family-name:var(--font-ui)] text-[.88rem] font-semibold leading-snug text-[var(--tinta)] group-hover:text-[var(--vino)]">
                  {m.titulo}
                </span>
                <span
                  className={`mt-1 block font-[family-name:var(--font-ui)] text-[.78rem] ${
                    estado === "completado"
                      ? "font-medium text-[var(--ok)]"
                      : estado === "en_curso"
                        ? "font-semibold text-[var(--carmin)]"
                        : "text-[var(--tinta-suave)]"
                  }`}
                >
                  {estado === "en_curso" ? `${ETIQUETA_ESTADO[estado]} · ${p} %` : ETIQUETA_ESTADO[estado]}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
