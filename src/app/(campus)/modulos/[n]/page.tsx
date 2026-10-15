import { ListaClases } from "@/components/campus/ListaClases";
import { Eyebrow } from "@/components/campus/ui";
import { ETIQUETA_ESTADO, cargarCampus, estadoModulo, numero2, pct } from "@/lib/campus";
import { PROGRAMA } from "@/lib/programa";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

// Un módulo del programa (diseño "Campus académico"): sub-pestañas
// Módulo 01…06, encabezado con título y cifras, y la lista de clases con su
// estado. Pendiente de sus tablas: pregunta clínica, calendario del módulo y
// foro del módulo (EJECUCION.md, "Siguiente").
export default async function ModuloPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const numero = Number(n);
  if (!Number.isInteger(numero) || numero < 0) notFound();

  const { principal } = await cargarCampus(`/modulos/${numero}`);
  if (!principal) redirect("/modulos");

  // Las clases sin módulo (p. ej. una bienvenida) forman la pestaña
  // "Introducción", en /modulos/0.
  const intro = principal.modulos.find((m) => m.numero === null);
  const modulos = principal.modulos.filter((m) => m.numero !== null);
  if (modulos.length === 0) redirect("/modulos");
  const modulo = numero === 0 ? intro : modulos.find((m) => m.numero === numero);
  if (!modulo) notFound();

  const estado = estadoModulo(modulo, principal);
  const avance = pct(modulo.completadas, modulo.total);

  return (
    <div className="entrada">
      <div className="border-b border-[var(--linea)] bg-[var(--crema-2)]">
        <nav
          aria-label="Módulos del programa"
          className="mx-auto flex w-[min(1180px,92vw)] gap-1 overflow-x-auto"
        >
          {[...(intro ? [intro] : []), ...modulos].map((m) => {
            const activo = (m.numero ?? 0) === numero;
            const est = estadoModulo(m, principal);
            return (
              <Link
                key={m.id ?? "intro"}
                href={`/modulos/${m.numero ?? 0}`}
                aria-current={activo ? "page" : undefined}
                className={`shrink-0 border-b-[3px] px-4 py-3 font-[family-name:var(--font-ui)] transition-colors duration-[var(--dur)] ${
                  activo ? "border-[var(--vino)]" : "border-transparent hover:border-[var(--rosa)]"
                }`}
              >
                <span className={`block text-[.88rem] font-bold ${activo ? "text-[var(--vino)]" : "text-[var(--tinta)]"}`}>
                  {m.numero === null ? "Introducción" : `Módulo ${numero2(m.numero)}`}
                </span>
                <span className="block text-[.72rem] text-[var(--tinta-suave)]">{ETIQUETA_ESTADO[est]}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mx-auto w-[min(1180px,92vw)] pt-12">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="min-w-0 max-w-[44rem]">
            <Eyebrow>
              {numero === 0 ? "Introducción" : `Módulo ${numero2(numero)}`} · {ETIQUETA_ESTADO[estado]}
            </Eyebrow>
            <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.1]">{modulo.titulo}</h1>
            <p className="mt-3 font-[family-name:var(--font-ui)] text-[.88rem] text-[var(--tinta-suave)]">
              {principal.titulo} · {PROGRAMA.generacion}
            </p>
          </div>
          <dl className="flex gap-3 font-[family-name:var(--font-ui)]">
            <div className="min-w-[7.5rem] bg-[var(--crema-2)] p-4">
              <dd className="text-[1.9rem] font-bold leading-none text-[var(--vino)]">{modulo.total}</dd>
              <dt className="mt-2 text-[.74rem] leading-tight text-[var(--tinta-suave)]">Clases</dt>
            </div>
            <div className="min-w-[7.5rem] bg-[var(--crema-2)] p-4">
              <dd className="text-[1.9rem] font-bold leading-none text-[var(--vino)]">{avance} %</dd>
              <dt className="mt-2 text-[.74rem] leading-tight text-[var(--tinta-suave)]">Avance</dt>
            </div>
          </dl>
        </div>

        <h2 className="mb-5 mt-12 text-[1.5rem]">Clases del módulo</h2>
        <ListaClases slug={principal.slug} clases={modulo.clases} siguienteOrden={principal.siguiente?.orden ?? null} />
      </div>
    </div>
  );
}
