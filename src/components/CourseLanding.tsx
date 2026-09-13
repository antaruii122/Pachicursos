import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Course, ClaseResumen, formatCLP, formatDuracion, toBullets } from "@/lib/types";

const card = "rounded-[var(--radio-md)] bg-white shadow-[var(--sombra-lg)]";
const btnSolid =
  "inline-flex items-center gap-2 rounded-full bg-[var(--vino)] px-8 py-3.5 font-[family-name:var(--font-ui)] text-[.92rem] font-medium text-white shadow-[var(--sombra-md)] transition-[transform,box-shadow,background-color] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-[3px] hover:bg-[var(--vino-claro)] hover:shadow-[var(--sombra-lg)] active:translate-y-0";
const btnLine =
  "inline-flex items-center gap-2 rounded-full border-[1.4px] border-[var(--carmin)] px-8 py-3.5 font-[family-name:var(--font-ui)] text-[.92rem] font-medium text-[var(--carmin)] transition-[transform,box-shadow,background-color,color] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-[3px] hover:bg-[var(--carmin)] hover:text-white hover:shadow-[var(--sombra-md)] active:translate-y-0";
const eyebrow =
  "mb-4 block font-[family-name:var(--font-ui)] text-[.72rem] font-semibold uppercase tracking-[.26em] text-[var(--carmin)]";
const cardHover =
  "transition-[transform,box-shadow] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-1 hover:shadow-[var(--sombra-xl)]";

// Plantilla de landing ÚNICA y compartida (ver docs/cursos.md, "Plantilla de
// landing reutilizable") — cualquier curso pasa por acá, nunca un diseño
// ad-hoc. Las 10 secciones van siempre en el mismo orden; una sección se
// omite solo si el curso no tiene ese contenido cargado.
export function CourseLanding({
  course,
  clases,
  claseGratisThumbnailUrl,
}: {
  course: Course;
  clases: ClaseResumen[];
  claseGratisThumbnailUrl?: string | null;
}) {
  const paraQuienEs = toBullets(course.para_quien_es);
  const paraQuienNoEs = toBullets(course.para_quien_no_es);
  const claseGratis = clases.find((c) => c.is_free_intro);
  const testimonios = course.testimonios ?? [];

  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema)]">
      <SiteHeader />

      <main id="contenido-principal">
      {/* 1. Hero */}
      <section className="relative overflow-hidden pt-14 pb-16 md:pt-20">
        {/* Forma decorativa de fondo, solo para dar profundidad al hero —
            mismos tokens de marca, nunca un color nuevo. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,var(--rosa)_0%,transparent_70%)] opacity-70"
        />
        <div className="relative mx-auto grid w-[min(1160px,90vw)] items-center gap-14 md:grid-cols-[1.05fr_.95fr]">
          <div className="entrada">
            <span className={eyebrow}>
              Curso en línea · Nutrición &amp; Fertilidad Femenina
            </span>
            <h1 className="mb-5 text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.14]">
              {course.promesa_principal ?? course.titulo}
            </h1>
            {course.descripcion && (
              <p className="mb-7 max-w-[60ch] text-[1.05rem] text-[var(--tinta-suave)]">
                {course.descripcion}
              </p>
            )}
            <div className="flex flex-wrap gap-3.5">
              {claseGratis && (
                <a href="#clase-gratis" className={btnLine}>
                  Ver la clase 1 gratis
                </a>
              )}
              <a href="#precio" className={btnSolid}>
                Comprar el curso
              </a>
            </div>
          </div>
          <div
            className={`${card} entrada relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-[linear-gradient(160deg,var(--rosa),var(--dorado))]`}
            style={{ animationDelay: "90ms" }}
          >
            {course.cover_image_url ? (
              <Image
                src={course.cover_image_url}
                alt={course.titulo}
                fill
                sizes="(min-width: 768px) 45vw, 90vw"
                className="object-cover"
                priority
              />
            ) : (
              <svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="var(--vino)" strokeWidth="1.1" opacity=".55">
                <path d="M12 21c-4-3-7-6.5-7-10.2C5 7 7.2 5 10 5c1 0 1.7.4 2 1 .3-.6 1-1 2-1 2.8 0 5 2 5 5.8 0 3.7-3 7.2-7 10.2z" />
              </svg>
            )}
          </div>
        </div>
      </section>

      {/* 2. Para quién es / no es */}
      {(paraQuienEs.length > 0 || paraQuienNoEs.length > 0) && (
        <section className="bg-[var(--crema-2)] py-16 md:py-20">
          <div className="mx-auto w-[min(1160px,90vw)]">
            <span className={eyebrow}>Antes de inscribirte</span>
            <h2 className="max-w-[26ch] text-[clamp(1.7rem,3.4vw,2.3rem)]">
              Este curso es para ti si… (y no lo es si…)
            </h2>
            <div className="mt-9 flex flex-wrap gap-6">
              {paraQuienEs.length > 0 && (
                <div className={`${card} ${cardHover} min-w-[280px] flex-1 border-l-4 border-[var(--vino)] p-8`}>
                  <h3 className="mb-4 font-[family-name:var(--font-ui)] text-[1.05rem] text-[var(--vino)]">
                    Es para ti si
                  </h3>
                  <ul className="flex flex-col gap-3.5 text-[.95rem] text-[var(--tinta-suave)]">
                    {paraQuienEs.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--rosa)]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--carmin)" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {paraQuienNoEs.length > 0 && (
                <div className={`${card} ${cardHover} min-w-[280px] flex-1 border-l-4 border-[var(--tinta-suave)] p-8`}>
                  <h3 className="mb-4 font-[family-name:var(--font-ui)] text-[1.05rem] text-[var(--tinta-suave)]">
                    No es para ti si
                  </h3>
                  <ul className="flex flex-col gap-3.5 text-[.95rem] text-[var(--tinta-suave)]">
                    {paraQuienNoEs.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--crema-2)]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tinta-suave)" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. Clase gratis embebida */}
      {claseGratis && (
        <section id="clase-gratis" className="py-16 md:py-20">
          <div className="mx-auto w-[min(760px,90vw)] text-center">
            <span className={eyebrow}>Clase 1 · Gratis</span>
            <h2 className="text-[clamp(1.7rem,3.4vw,2.3rem)]">
              Mira la primera clase antes de decidir
            </h2>
            <p className="mx-auto mb-8 max-w-[60ch] text-[1.05rem] text-[var(--tinta-suave)]">
              Sin registrarte. Así sabes exactamente cómo enseña Marcela antes de
              comprar el resto del curso.
            </p>
          </div>
          <div className="mx-auto w-[min(1160px,90vw)]">
            <Link
              href={`/cursos/${course.slug}/clase/${claseGratis.orden}`}
              className={`${card} group relative mx-auto flex aspect-video max-w-[820px] items-center justify-center overflow-hidden bg-[linear-gradient(160deg,var(--vino),var(--vino-osc))] transition-shadow duration-[var(--dur)] ease-[var(--ease)] hover:shadow-[var(--sombra-xl)]`}
            >
              {claseGratisThumbnailUrl && (
                <>
                  <Image
                    src={claseGratisThumbnailUrl}
                    alt=""
                    fill
                    sizes="(min-width: 820px) 820px, 90vw"
                    className="object-cover transition-transform duration-[calc(var(--dur)*2)] ease-[var(--ease)] group-hover:scale-105"
                  />
                  {/* Oscurece la miniatura real lo justo para que el botón de
                      play blanco y el label siempre se lean, sin importar
                      cuán clara sea la miniatura que Vimeo generó. */}
                  <div className="absolute inset-0 bg-black/25" />
                </>
              )}
              <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white/92 shadow-[var(--sombra-md)] transition-transform duration-[var(--dur)] ease-[var(--ease)] group-hover:scale-110">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--vino)">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="absolute bottom-4 left-4 rounded-full bg-black/65 px-3 py-1.5 font-[family-name:var(--font-ui)] text-[.78rem] text-white">
                Clase {claseGratis.orden} · {claseGratis.titulo}
                {claseGratis.duracion ? ` · ${formatDuracion(claseGratis.duracion)}` : ""}
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* 4. Qué vas a aprender */}
      {course.que_vas_a_aprender.length > 0 && (
        <section className="bg-[var(--crema-2)] py-16 md:py-20">
          <div className="mx-auto w-[min(1160px,90vw)]">
            <span className={eyebrow}>Resultados esperados</span>
            <h2 className="max-w-[24ch] text-[clamp(1.7rem,3.4vw,2.3rem)]">
              Qué vas a poder hacer al terminar el curso
            </h2>
            <div className="mt-9 grid gap-6 md:grid-cols-3">
              {course.que_vas_a_aprender.map((item, i) => (
                <div key={i} className={`${card} ${cardHover} p-7`}>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--rosa)]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--carmin)" strokeWidth="2">
                      <path d="M4 12l6 6 10-12" />
                    </svg>
                  </div>
                  <p className="font-[family-name:var(--font-ui)] text-[.94rem] text-[var(--tinta)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Curriculum */}
      {clases.length > 0 && (
        <section id="curriculum" className="py-16 md:py-20">
          <div className="mx-auto w-[min(1160px,90vw)]">
            <span className={eyebrow}>Contenido del curso</span>
            <h2 className="max-w-[22ch] text-[clamp(1.7rem,3.4vw,2.3rem)]">
              {clases.length} clases, a tu ritmo
            </h2>
            <div className="mt-8 flex max-w-[700px] flex-col gap-3.5">
              {clases.map((c) => {
                const rowClass = `rounded-[var(--radio-md)] shadow-[var(--sombra-lg)] flex items-center gap-4 px-6 py-4.5 ${
                  c.is_free_intro
                    ? "bg-white border-[1.5px] border-[var(--carmin)] transition-[transform,box-shadow] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-0.5 hover:shadow-[var(--sombra-xl)]"
                    : "bg-[var(--crema-2)] shadow-[var(--sombra-sm)]"
                }`;
                const content = (
                  <>
                    <div
                      className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full ${
                        c.is_free_intro ? "bg-[var(--rosa)]" : "bg-[var(--crema-2)]"
                      }`}
                    >
                      {c.is_free_intro ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--carmin)">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tinta-suave)" strokeWidth="1.8">
                          <rect x="5" y="10" width="14" height="10" rx="2" />
                          <path d="M8 10V7a4 4 0 018 0v3" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 font-[family-name:var(--font-ui)] text-[.94rem]">
                      {c.orden}. {c.titulo}
                    </div>
                    {c.is_free_intro ? (
                      <span className="font-[family-name:var(--font-ui)] text-[.72rem] uppercase tracking-[.08em] text-[var(--carmin)]">
                        Gratis{c.duracion ? ` · ${formatDuracion(c.duracion)}` : ""}
                      </span>
                    ) : (
                      c.duracion && (
                        <span className="font-[family-name:var(--font-ui)] text-[.78rem] text-[var(--tinta-suave)]">
                          {formatDuracion(c.duracion)}
                        </span>
                      )
                    )}
                  </>
                );

                return c.is_free_intro ? (
                  <Link key={c.id} href={`/cursos/${course.slug}/clase/${c.orden}`} className={rowClass}>
                    {content}
                  </Link>
                ) : (
                  <div key={c.id} className={rowClass}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 6. Autoridad/instructor — editable por curso desde 2026-09-14
          (hallazgo real: antes era contenido fijo en el código, sin ningún
          campo en el admin para cambiar la foto o la bio). Si el curso no
          tiene nada cargado, cae en el texto de marca original. */}
      <section className="bg-[var(--crema-2)] py-16 md:py-20">
        <div className="mx-auto grid w-[min(1160px,90vw)] items-center gap-12 md:grid-cols-[.85fr_1.15fr]">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[var(--radio-lg)] bg-[linear-gradient(160deg,var(--dorado),var(--rosa))] shadow-[var(--sombra-lg)] ring-1 ring-[var(--linea)]">
            {course.instructor_foto_url ? (
              <Image
                src={course.instructor_foto_url}
                alt={course.instructor_nombre ?? "Marcela Calderón"}
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-cover"
              />
            ) : (
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--vino)" strokeWidth="1.1" opacity=".55">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" />
              </svg>
            )}
          </div>
          <div>
            <span className={eyebrow}>Quién te enseña</span>
            <h2 className="text-[clamp(1.7rem,3.4vw,2.3rem)]">
              {course.instructor_nombre ?? "Marcela Calderón"}
            </h2>
            {course.instructor_bio ? (
              <p className="max-w-[60ch] whitespace-pre-line text-[1.05rem] text-[var(--tinta-suave)]">
                {course.instructor_bio}
              </p>
            ) : (
              <>
                <p className="mb-4 max-w-[60ch] text-[1.05rem] text-[var(--tinta-suave)]">
                  Nutricionista clínica, especializada en nutrición hormonal y
                  fertilidad femenina. Fundadora de Alimenta tu Fertilidad y de
                  Academia NUTFEM, donde forma a otros profesionales de la
                  nutrición en salud hormonal con enfoque no peso-céntrico.
                </p>
                <p className="max-w-[60ch] text-[1.05rem] text-[var(--tinta-suave)]">
                  Ha acompañado a cientos de mujeres a entender su ciclo y
                  preparar su cuerpo para la maternidad desde la alimentación, con
                  base clínica y sin dietas de moda.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 7. Testimonios (opcional) */}
      {testimonios.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="mx-auto w-[min(1160px,90vw)]">
            <span className={eyebrow}>Lo que dicen las alumnas</span>
            <h2 className="max-w-[20ch] text-[clamp(1.7rem,3.4vw,2.3rem)]">Testimonios</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {testimonios.map((t, i) => (
                <div key={i} className={`${card} ${cardHover} p-7`}>
                  <svg width="28" height="22" viewBox="0 0 32 24" fill="var(--rosa)" className="mb-3">
                    <path d="M9.5 0C4.3 0 0 4.6 0 10.3 0 15 3.1 18 7 18c-.4 4-3 5.6-5 6l1 3c5-1 9-4.8 9-11.5C12 8 9.7 5 6.5 5c.3-2 2-3 5-3.4L9.5 0zm18 0c-5.2 0-9.5 4.6-9.5 10.3 0 4.7 3.1 7.7 7 7.7-.4 4-3 5.6-5 6l1 3c5-1 9-4.8 9-11.5 0-6.5-2.3-9.5-5.5-9.5.3-2 2-3 5-3.4L27.5 0z" />
                  </svg>
                  <p className="mb-4 font-[family-name:var(--font-heading)] italic text-[var(--vino)]">
                    {t.texto}
                  </p>
                  <span className="font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--tinta-suave)]">
                    — {t.autor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Precio + CTA — sin garantía/reembolso (política del negocio) */}
      <section id="precio" className="relative overflow-hidden bg-[var(--vino)] py-16 text-white md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--vino-claro)_0%,transparent_60%)] opacity-60"
        />
        <div className="relative mx-auto w-[min(760px,90vw)] text-center">
          <span className={`${eyebrow} !text-[var(--dorado)]`}>Inversión</span>
          <h2 className="!text-white">{course.titulo}</h2>
          <div className="my-6 inline-flex items-baseline gap-3 rounded-[var(--radio-lg)] border border-white/15 bg-white/[.06] px-8 py-5 font-[family-name:var(--font-heading)] text-[2.6rem] font-semibold shadow-[var(--sombra-lg)]">
            {formatCLP(course.precio)}
            {course.precio_original && (
              <span className="text-[1.4rem] font-normal text-white/50 line-through">
                {formatCLP(course.precio_original)}
              </span>
            )}
          </div>
          <p className="mb-7 text-white/75">
            Pago único · con cuotas sin interés disponibles · acceso sin
            vencimiento
          </p>
          <a
            href={`/checkout/${course.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)] shadow-[var(--sombra-lg)] transition-[transform,box-shadow] duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-[3px] hover:shadow-[var(--sombra-xl)] active:translate-y-0"
          >
            Comprar el curso
          </a>
        </div>
      </section>

      {/* 9. FAQ */}
      {course.faq.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="mx-auto w-[min(760px,90vw)]">
            <span className={eyebrow}>Preguntas frecuentes</span>
            <h2 className="text-[clamp(1.7rem,3.4vw,2.3rem)]">FAQ</h2>
            <div className="mt-7 flex flex-col gap-3">
              {course.faq.map((item, i) => (
                <details key={i} className={`${card} group px-6 py-5 transition-shadow duration-[var(--dur)] ease-[var(--ease)] open:shadow-[var(--sombra-xl)]`}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-[family-name:var(--font-ui)] text-[1.05rem] font-semibold text-[var(--vino)]">
                    {item.pregunta}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--carmin)"
                      strokeWidth="2.5"
                      className="shrink-0 transition-transform duration-[var(--dur)] ease-[var(--ease)] group-open:rotate-45"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-[.93rem] text-[var(--tinta-suave)]">{item.respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. CTA final */}
      <section className="bg-[var(--rosa)] py-16 md:py-20">
        <div className="mx-auto w-[min(760px,90vw)] text-center">
          <h2 className="text-[clamp(1.7rem,3.4vw,2.3rem)]">
            Empieza a entender tu ciclo hoy
          </h2>
          {claseGratis && (
            <>
              <p className="mx-auto mb-7 max-w-[60ch] text-[1.05rem] text-[var(--tinta-suave)]">
                La clase 1 es gratis. Sin apuro, a tu ritmo.
              </p>
              <a href="#clase-gratis" className={btnSolid}>
                Ver la clase gratis
              </a>
            </>
          )}
        </div>
      </section>
      </main>

      <SiteFooter />
    </div>
  );
}
