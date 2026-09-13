// Tipos que reflejan el modelo de datos de docs/cursos.md (tablas courses y
// course_videos). No son 1:1 con el esquema completo de la DB — solo los
// campos que la landing y el reproductor necesitan mostrar.

export interface Course {
  id: string;
  slug: string;
  titulo: string;
  subtitulo_corto: string | null;
  promesa_principal: string | null;
  descripcion: string | null;
  precio: number;
  precio_original: number | null;
  estado: "borrador" | "publicado" | "despublicado" | "archivado";
  cover_image_url: string | null;
  background_image_url: string | null;
  para_quien_es: string | null;
  para_quien_no_es: string | null;
  que_vas_a_aprender: string[];
  requisitos: string | null;
  faq: { pregunta: string; respuesta: string }[];
  testimonios: { texto: string; autor: string }[] | null;
  seo_titulo: string | null;
  seo_descripcion: string | null;
  instructor_nombre: string | null;
  instructor_bio: string | null;
  instructor_foto_url: string | null;
}

export interface ClaseResumen {
  id: string;
  orden: number;
  titulo: string;
  duracion: number | null;
  is_free_intro: boolean;
  estado_procesamiento: "subiendo" | "procesando" | "listo";
  // Se llena server-side (ver cursos/[slug]/page.tsx) leyendo vimeo_id con
  // service_role — nunca viaja el vimeo_id en sí al cliente, solo esta URL
  // de imagen ya resuelta.
  thumbnailUrl?: string | null;
}

export function formatCLP(monto: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(monto);
}

export function formatDuracion(segundos: number | null): string {
  if (!segundos) return "";
  const min = Math.round(segundos / 60);
  return `${min} min`;
}

// para_quien_es / para_quien_no_es se escriben en el admin como un bullet
// por línea (ver docs/cursos.md: "texto corto"). Acá se parsean a lista.
export function toBullets(texto: string | null): string[] {
  if (!texto) return [];
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca tildes/diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Indicador de completitud del panel admin (ver docs/cursos.md, Parte E):
// bloquea publicar solo por lo estrictamente necesario; el resto son
// advertencias que no bloquean.
export interface CompletitudResultado {
  bloqueantes: string[];
  advertencias: string[];
}

export function calcularCompletitud(
  course: Pick<Course, "titulo" | "precio" | "faq" | "testimonios" | "que_vas_a_aprender">,
  clases: { estado_procesamiento: string }[],
): CompletitudResultado {
  const bloqueantes: string[] = [];
  const advertencias: string[] = [];

  if (!course.titulo?.trim()) bloqueantes.push("Falta el título");
  if (!course.precio || course.precio <= 0) bloqueantes.push("Falta el precio");
  if (clases.length === 0) bloqueantes.push("Necesita al menos 1 clase");
  const noListas = clases.filter((c) => c.estado_procesamiento !== "listo");
  if (clases.length > 0 && noListas.length > 0) {
    bloqueantes.push(`${noListas.length} clase(s) sin terminar de procesar`);
  }

  if (course.que_vas_a_aprender.length === 0) advertencias.push("Sin lista de \"qué vas a aprender\"");
  if (course.faq.length === 0) advertencias.push("Sin preguntas frecuentes (FAQ)");
  if (!course.testimonios || course.testimonios.length === 0) advertencias.push("Sin testimonios");

  return { bloqueantes, advertencias };
}
