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
}

export interface ClaseResumen {
  id: string;
  orden: number;
  titulo: string;
  duracion: number | null;
  is_free_intro: boolean;
  estado_procesamiento: "subiendo" | "procesando" | "listo";
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
