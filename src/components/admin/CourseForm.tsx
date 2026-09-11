"use client";

import { CourseFormData, deleteCourse, saveCourse, setCourseEstado } from "@/app/admin/cursos/actions";
import { calcularCompletitud, Course, slugify } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

const input =
  "w-full rounded-lg border border-[var(--linea)] px-3 py-2 text-sm outline-none focus:border-[var(--carmin)]";
const label = "mb-1 block font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-[var(--vino)]";
const card = "rounded-[14px] bg-white p-6 shadow-[0_8px_20px_rgba(78,15,38,.08)]";

export function CourseForm({
  initialCourse,
  clases,
}: {
  initialCourse: Course | null;
  clases: { estado_procesamiento: string }[];
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(initialCourse?.titulo ?? "");
  const [slug, setSlug] = useState(initialCourse?.slug ?? "");
  const [slugTocado, setSlugTocado] = useState(!!initialCourse);
  const [subtituloCorto, setSubtituloCorto] = useState(initialCourse?.subtitulo_corto ?? "");
  const [promesaPrincipal, setPromesaPrincipal] = useState(initialCourse?.promesa_principal ?? "");
  const [descripcion, setDescripcion] = useState(initialCourse?.descripcion ?? "");
  const [precio, setPrecio] = useState(initialCourse?.precio?.toString() ?? "");
  const [precioOriginal, setPrecioOriginal] = useState(
    initialCourse?.precio_original?.toString() ?? "",
  );
  const [paraQuienEs, setParaQuienEs] = useState(initialCourse?.para_quien_es ?? "");
  const [paraQuienNoEs, setParaQuienNoEs] = useState(initialCourse?.para_quien_no_es ?? "");
  const [queVasAAprender, setQueVasAAprender] = useState<string[]>(
    initialCourse?.que_vas_a_aprender ?? [],
  );
  const [requisitos, setRequisitos] = useState(initialCourse?.requisitos ?? "");
  const [faq, setFaq] = useState(initialCourse?.faq ?? []);
  const [testimonios, setTestimonios] = useState(initialCourse?.testimonios ?? []);
  const [seoTitulo, setSeoTitulo] = useState("");
  const [seoDescripcion, setSeoDescripcion] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState(initialCourse?.cover_image_url ?? "");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(
    initialCourse?.background_image_url ?? "",
  );

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completitud = calcularCompletitud(
    {
      titulo,
      precio: Number(precio) || 0,
      faq,
      testimonios,
      que_vas_a_aprender: queVasAAprender,
    },
    clases,
  );

  const handleTituloChange = (value: string) => {
    setTitulo(value);
    if (!slugTocado) setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setMensaje(null);

    const data: CourseFormData = {
      id: initialCourse?.id,
      slug,
      titulo,
      subtitulo_corto: subtituloCorto,
      promesa_principal: promesaPrincipal,
      descripcion,
      precio: Number(precio) || 0,
      precio_original: precioOriginal ? Number(precioOriginal) : null,
      para_quien_es: paraQuienEs,
      para_quien_no_es: paraQuienNoEs,
      que_vas_a_aprender: queVasAAprender.filter((b) => b.trim()),
      requisitos,
      faq: faq.filter((f) => f.pregunta.trim() && f.respuesta.trim()),
      testimonios: testimonios.filter((t) => t.texto.trim()),
      seo_titulo: seoTitulo,
      seo_descripcion: seoDescripcion,
      cover_image_url: coverImageUrl,
      background_image_url: backgroundImageUrl,
    };

    const result = await saveCourse(data);
    setGuardando(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    if (!initialCourse) {
      router.push(`/admin/cursos/${result.id}/editar`);
      return;
    }
    setMensaje("Guardado.");
  };

  const handleEstado = async (estado: "publicado" | "despublicado" | "archivado") => {
    if (!initialCourse) return;
    setError(null);
    const result = await setCourseEstado(initialCourse.id, estado);
    if ("error" in result) setError(result.error);
    else router.refresh();
  };

  const handleDelete = async () => {
    if (!initialCourse) return;
    if (!confirm(`¿Borrar "${initialCourse.titulo}"? Esta acción no se puede deshacer.`)) return;
    const result = await deleteCourse(initialCourse.id);
    if ("error" in result) setError(result.error);
    else router.push("/admin/cursos");
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_280px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className={card}>
          <h2 className="mb-4 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
            Información básica
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className={label}>Título *</label>
              <input className={input} value={titulo} onChange={(e) => handleTituloChange(e.target.value)} required />
            </div>
            <div>
              <label className={label}>Slug (URL) *</label>
              <input
                className={input}
                value={slug}
                onChange={(e) => {
                  setSlugTocado(true);
                  setSlug(slugify(e.target.value));
                }}
                required
              />
              <p className="mt-1 text-xs text-[var(--tinta-suave)]">/cursos/{slug || "..."}</p>
            </div>
            <div>
              <label className={label}>Promesa principal</label>
              <input
                className={input}
                value={promesaPrincipal}
                onChange={(e) => setPromesaPrincipal(e.target.value)}
                placeholder='Ej: "Regula tu ciclo en 8 semanas"'
              />
            </div>
            <div>
              <label className={label}>Subtítulo corto</label>
              <input className={input} value={subtituloCorto} onChange={(e) => setSubtituloCorto(e.target.value)} />
            </div>
            <div>
              <label className={label}>Descripción</label>
              <textarea
                className={`${input} min-h-[100px]`}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Precio (CLP) *</label>
                <input
                  type="number"
                  className={input}
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  required
                  min={0}
                />
              </div>
              <div>
                <label className={label}>Precio original (opcional, tachado)</label>
                <input
                  type="number"
                  className={input}
                  value={precioOriginal}
                  onChange={(e) => setPrecioOriginal(e.target.value)}
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={card}>
          <h2 className="mb-4 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
            Para quién es
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Es para ti si (un punto por línea)</label>
              <textarea
                className={`${input} min-h-[110px]`}
                value={paraQuienEs}
                onChange={(e) => setParaQuienEs(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>No es para ti si (un punto por línea)</label>
              <textarea
                className={`${input} min-h-[110px]`}
                value={paraQuienNoEs}
                onChange={(e) => setParaQuienNoEs(e.target.value)}
              />
            </div>
          </div>
        </div>

        <ListaEditable
          titulo="Qué vas a aprender"
          items={queVasAAprender}
          onChange={setQueVasAAprender}
          renderItem={(item, onChange) => (
            <input className={input} value={item} onChange={(e) => onChange(e.target.value)} placeholder="Beneficio o resultado" />
          )}
          nuevoItem=""
        />

        <div className={card}>
          <label className={label}>Requisitos</label>
          <textarea className={`${input} min-h-[80px]`} value={requisitos} onChange={(e) => setRequisitos(e.target.value)} />
        </div>

        <ListaEditable
          titulo="FAQ"
          items={faq}
          onChange={setFaq}
          renderItem={(item, onChange) => (
            <div className="flex flex-col gap-2">
              <input
                className={input}
                value={item.pregunta}
                onChange={(e) => onChange({ ...item, pregunta: e.target.value })}
                placeholder="Pregunta"
              />
              <textarea
                className={`${input} min-h-[60px]`}
                value={item.respuesta}
                onChange={(e) => onChange({ ...item, respuesta: e.target.value })}
                placeholder="Respuesta"
              />
            </div>
          )}
          nuevoItem={{ pregunta: "", respuesta: "" }}
        />

        <ListaEditable
          titulo="Testimonios (opcional)"
          items={testimonios}
          onChange={setTestimonios}
          renderItem={(item, onChange) => (
            <div className="flex flex-col gap-2">
              <textarea
                className={`${input} min-h-[60px]`}
                value={item.texto}
                onChange={(e) => onChange({ ...item, texto: e.target.value })}
                placeholder="Texto del testimonio"
              />
              <input
                className={input}
                value={item.autor}
                onChange={(e) => onChange({ ...item, autor: e.target.value })}
                placeholder="Nombre de la alumna"
              />
            </div>
          )}
          nuevoItem={{ texto: "", autor: "" }}
        />

        <div className={card}>
          <h2 className="mb-4 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
            Imágenes y SEO
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className={label}>URL imagen de portada</label>
              <input className={input} value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
            </div>
            <div>
              <label className={label}>URL imagen de fondo</label>
              <input
                className={input}
                value={backgroundImageUrl}
                onChange={(e) => setBackgroundImageUrl(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Título SEO</label>
              <input className={input} value={seoTitulo} onChange={(e) => setSeoTitulo(e.target.value)} />
            </div>
            <div>
              <label className={label}>Descripción SEO</label>
              <textarea
                className={`${input} min-h-[70px]`}
                value={seoDescripcion}
                onChange={(e) => setSeoDescripcion(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-[var(--dorado-osc)]">{error}</p>}
        {mensaje && <p className="text-sm font-medium text-[var(--vino)]">{mensaje}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="rounded-full bg-[var(--vino)] px-6 py-3 font-[family-name:var(--font-ui)] text-[.92rem] font-medium text-white hover:bg-[var(--vino-claro)] disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </form>

      <aside className="flex flex-col gap-4">
        <div className={card}>
          <h3 className="mb-3 font-[family-name:var(--font-ui)] text-[.85rem] font-semibold text-[var(--vino)]">
            Completitud
          </h3>
          {completitud.bloqueantes.length === 0 && completitud.advertencias.length === 0 ? (
            <p className="text-sm text-[var(--vino)]">✓ Todo listo para publicar</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {completitud.bloqueantes.map((m) => (
                <li key={m} className="text-[var(--dorado-osc)]">✗ {m}</li>
              ))}
              {completitud.advertencias.map((m) => (
                <li key={m} className="text-[var(--tinta-suave)]">⚠ {m}</li>
              ))}
            </ul>
          )}
        </div>

        {initialCourse && (
          <div className={card}>
            <h3 className="mb-3 font-[family-name:var(--font-ui)] text-[.85rem] font-semibold text-[var(--vino)]">
              Estado: {initialCourse.estado}
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href={`/admin/cursos/${initialCourse.id}/preview`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[var(--carmin)] px-4 py-2 text-center text-sm text-[var(--carmin)] hover:bg-[var(--carmin)] hover:text-white"
              >
                Vista previa
              </a>
              <a
                href={`/admin/cursos/${initialCourse.id}/clases`}
                className="rounded-full border border-[var(--linea)] px-4 py-2 text-center text-sm text-[var(--tinta)] hover:border-[var(--carmin)]"
              >
                Gestionar clases
              </a>
              {initialCourse.estado !== "publicado" ? (
                <button
                  type="button"
                  disabled={completitud.bloqueantes.length > 0}
                  onClick={() => handleEstado("publicado")}
                  className="rounded-full bg-[var(--vino)] px-4 py-2 text-sm text-white disabled:opacity-40"
                  title={completitud.bloqueantes.length > 0 ? "Resolvé lo bloqueante primero" : ""}
                >
                  Publicar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleEstado("despublicado")}
                  className="rounded-full bg-[var(--tinta-suave)] px-4 py-2 text-sm text-white"
                >
                  Despublicar
                </button>
              )}
              <button
                type="button"
                onClick={() => handleEstado("archivado")}
                className="rounded-full border border-[var(--linea)] px-4 py-2 text-sm text-[var(--tinta-suave)]"
              >
                Archivar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full border border-[var(--dorado-osc)] px-4 py-2 text-sm text-[var(--dorado-osc)]"
              >
                Borrar
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function ListaEditable<T>({
  titulo,
  items,
  onChange,
  renderItem,
  nuevoItem,
}: {
  titulo: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, onChange: (item: T) => void) => React.ReactNode;
  nuevoItem: T;
}) {
  return (
    <div className={card}>
      <h2 className="mb-4 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
        {titulo}
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg border border-[var(--linea)] p-3">
            <div className="flex-1">
              {renderItem(item, (updated) => {
                const copy = [...items];
                copy[i] = updated;
                onChange(copy);
              })}
            </div>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-sm text-[var(--dorado-osc)]"
            >
              Quitar
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, nuevoItem])}
          className="self-start rounded-full border border-[var(--carmin)] px-4 py-1.5 text-sm text-[var(--carmin)]"
        >
          + Agregar
        </button>
      </div>
    </div>
  );
}
