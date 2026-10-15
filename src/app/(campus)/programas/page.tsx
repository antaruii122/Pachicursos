import { ProgressBar, campusCard } from "@/components/campus/ui";
import { cargarCampus, pct } from "@/lib/campus";
import type { CursoCampus } from "@/lib/progreso";
import Link from "next/link";

// Mis programas (diseño "Campus académico"): una tarjeta por programa con su
// avance. Sin precios ni ofertas: el campus es privado y no vende. El diploma
// digital se agrega cuando exista (EJECUCION.md, "Siguiente").
export default async function ProgramasPage() {
  const { cursos } = await cargarCampus("/programas");

  return (
    <div className="entrada mx-auto w-[min(1180px,92vw)] pt-12">
      <h1 className="text-[clamp(2rem,4.5vw,3rem)]">Mis programas</h1>
      {cursos.length === 0 ? (
        <div className={`${campusCard} mt-8 p-8 text-center`}>
          <p className="text-[var(--tinta-suave)]">
            Todavía no tienes programas activos. Si crees que es un error, escríbele al equipo de NUTFEM.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cursos.map((c) => (
            <Tarjeta key={c.courseId} curso={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function Tarjeta({ curso }: { curso: CursoCampus }) {
  const avance = pct(curso.clasesCompletadas, curso.totalClases);
  const finalizado = curso.totalClases > 0 && curso.clasesCompletadas === curso.totalClases;
  const empezado = curso.ultimaActividad > 0 || curso.clasesCompletadas > 0;
  const modulosReales = curso.modulos.filter((m) => m.numero !== null);
  const href = curso.siguiente ? `/cursos/${curso.slug}/clase/${curso.siguiente.orden}` : `/cursos/${curso.slug}`;

  const cabecera = finalizado
    ? "bg-[var(--salvia)] text-[var(--ok)]"
    : empezado
      ? "bg-[var(--vino)] text-white"
      : "bg-[var(--crema-2)] text-[var(--vino)]";

  return (
    <article className="flex flex-col border border-[var(--linea)] bg-white">
      <div className={`p-6 ${cabecera}`}>
        <span className="font-[family-name:var(--font-ui)] text-[.66rem] font-bold uppercase tracking-[.14em] opacity-80">
          Programa
        </span>
        <h2 className={`mt-3 text-[1.35rem] font-semibold leading-snug ${empezado && !finalizado ? "text-white" : "text-current"}`}>
          {curso.titulo}
        </h2>
      </div>
      <div className="flex flex-1 flex-col p-6 font-[family-name:var(--font-ui)]">
        <div className="flex items-baseline justify-between gap-3 text-[.8rem]">
          <span className={finalizado ? "font-semibold text-[var(--ok)]" : empezado ? "font-semibold text-[var(--carmin)]" : "text-[var(--tinta-suave)]"}>
            {finalizado ? "Finalizado" : empezado ? `En curso · ${avance} %` : "Por iniciar"}
          </span>
          <span className="text-[var(--tinta-suave)]">
            {curso.siguiente?.moduloNumero && modulosReales.length > 0
              ? `Módulo ${String(curso.siguiente.moduloNumero).padStart(2, "0")} de ${String(modulosReales.length).padStart(2, "0")}`
              : `${curso.clasesCompletadas}/${curso.totalClases} clases`}
          </span>
        </div>
        <ProgressBar pct={avance} className="mt-3" />
        <div className="mt-auto pt-6">
          <Link href={href} className={`btn w-full ${finalizado ? "btn-borde" : "btn-rosa"}`}>
            {finalizado ? "Revisar el programa" : empezado ? "Continuar con la siguiente clase" : "Ingresar al programa"}
          </Link>
        </div>
      </div>
    </article>
  );
}
