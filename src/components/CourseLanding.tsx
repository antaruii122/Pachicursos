import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Course, ClaseResumen, formatCLP, formatDuracion, toBullets } from "@/lib/types";

const card = "rounded-[18px] bg-white shadow-[0_18px_44px_rgba(78,15,38,.13)]";
const btnSolid =
  "inline-flex items-center gap-2 rounded-full bg-[var(--vino)] px-8 py-3.5 font-[family-name:var(--font-ui)] text-[.92rem] font-medium text-white transition hover:-translate-y-0.5 hover:bg-[var(--vino-claro)]";
const btnLine =
  "inline-flex items-center gap-2 rounded-full border-[1.4px] border-[var(--carmin)] px-8 py-3.5 font-[family-name:var(--font-ui)] text-[.92rem] font-medium text-[var(--carmin)] transition hover:-translate-y-0.5 hover:bg-[var(--carmin)] hover:text-white";
const eyebrow =
  "mb-4 block font-[family-name:var(--font-ui)] text-[.72rem] font-semibold uppercase tracking-[.26em] text-[var(--carmin)]";

// Plantilla de landing ÚNICA y compartida (ver docs/cursos.md, "Plantilla de
// landing reutilizable") — cualquier curso pasa por acá, nunca un diseño
// ad-hoc. Las 10 secciones van siempre en el mismo orden; una sección se
// omite solo si el curso no tiene ese contenido cargado.
export function CourseLanding({
  course,
  clases,
}: {
  course: Course;
  clases: ClaseResumen[];
}) {
  const paraQuienEs = toBullets(course.para_quien_es);
  const paraQuienNoEs = toBullets(course.para_quien_no_es);
  const claseGratis = clases.find((c) => c.is_free_intro);
  const testimonios = course.testimonios ?? [];

  return (
    <div className="flex min-h-svh flex-col bg-[var(--crema)]">
      <SiteHeader />

      {/* 1. Hero */}
      <section className="pt-14 pb-16 md:pt-20">
        <div className="mx-auto grid w-[min(1160px,90vw)] items-center gap-14 md:grid-cols-[1.05fr_.95fr]">
          <div>
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
            className={`${card} flex aspect-[4/5] items-center justify-center overflow-hidden bg-[linear-gradient(160deg,var(--rosa),var(--dorado))]`}
          >
            {course.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.cover_image_url}
                alt={course.titulo}
                className="h-full w-full object-cover"
              />
            ) : (
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--vino)" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 3v18M3 12h18" strokeOpacity=".3" />
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
                <div className={`${card} min-w-[280px] flex-1 border-l-4 border-[var(--vino)] p-8`}>
                  <h3 className="mb-4 font-[family-name:var(--font-ui)] text-[1.05rem] text-[var(--vino)]">
                    Es para ti si
                  </h3>
                  <ul className="flex flex-col gap-3 text-[.95rem] text-[var(--tinta-suave)]">
                    {paraQuienEs.map((item, i) => (
                      <li key={i} className="flex gap-2.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--carmin)" strokeWidth="2" className="mt-0.5 shrink-0">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {paraQuienNoEs.length > 0 && (
                <div className={`${card} min-w-[280px] flex-1 border-l-4 border-[var(--tinta-suave)] p-8`}>
                  <h3 className="mb-4 font-[family-name:var(--font-ui)] text-[1.05rem] text-[var(--tinta-suave)]">
                    No es para ti si
                  </h3>
                  <ul className="flex flex-col gap-3 text-[.95rem] text-[var(--tinta-suave)]">
                    {paraQuienNoEs.map((item, i) => (
                      <li key={i} className="flex gap-2.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--tinta-suave)" strokeWidth="2" className="mt-0.5 shrink-0">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
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
              className={`${card} relative mx-auto flex aspect-video max-w-[820px] items-center justify-center overflow-hidden bg-[var(--vino-osc)]`}
            >
              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white/92">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--vino)">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="absolute bottom-4 left-4 rounded-full bg-black/35 px-3 py-1.5 font-[family-name:var(--font-ui)] text-[.78rem] text-white">
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
                <div key={i} className={`${card} p-7`}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--carmin)" strokeWidth="1.6" className="mb-3.5">
                    <path d="M4 12l6 6 10-12" />
                  </svg>
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
              {clases.map((c) => (
                <div
                  key={c.id}
                  className={`${card} flex items-center gap-4 px-6 py-4.5 ${
                    c.is_free_intro ? "border-[1.5px] border-[var(--carmin)]" : "opacity-85"
                  }`}
                >
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
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Autoridad/instructor — contenido fijo de marca, no por curso */}
      <section className="bg-[var(--crema-2)] py-16 md:py-20">
        <div className="mx-auto grid w-[min(1160px,90vw)] items-center gap-12 md:grid-cols-[.85fr_1.15fr]">
          <div className="flex aspect-square items-center justify-center rounded-[18px] bg-[linear-gradient(160deg,var(--dorado),var(--rosa))] shadow-[0_18px_44px_rgba(78,15,38,.13)]">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--vino)" strokeWidth="1.2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" />
            </svg>
          </div>
          <div>
            <span className={eyebrow}>Quién te enseña</span>
            <h2 className="text-[clamp(1.7rem,3.4vw,2.3rem)]">Marcela Calderón</h2>
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
                <div key={i} className={`${card} p-7`}>
                  <p className="mb-4 font-[family-name:var(--font-heading)] italic text-[var(--vino)]">
                    “{t.texto}”
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
      <section id="precio" className="bg-[var(--vino)] py-16 text-white md:py-20">
        <div className="mx-auto w-[min(760px,90vw)] text-center">
          <span className={`${eyebrow} !text-[var(--dorado)]`}>Inversión</span>
          <h2 className="!text-white">{course.titulo}</h2>
          <div className="my-5 font-[family-name:var(--font-heading)] text-[2.6rem] font-semibold">
            {formatCLP(course.precio)}
            {course.precio_original && (
              <span className="ml-3 text-[1.4rem] font-normal text-white/50 line-through">
                {formatCLP(course.precio_original)}
              </span>
            )}
          </div>
          <p className="mb-7 text-white/75">
            Pago único · con cuotas sin interés disponibles · acceso sin
            vencimiento
          </p>
          <a href="/checkout" className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-[family-name:var(--font-ui)] text-[.92rem] font-medium text-[var(--vino)] transition hover:-translate-y-0.5">
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
                <details key={i} className={`${card} px-6 py-5`}>
                  <summary className="cursor-pointer list-none font-[family-name:var(--font-ui)] text-[1.05rem] font-semibold text-[var(--vino)]">
                    {item.pregunta}
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

      <SiteFooter />
    </div>
  );
}
