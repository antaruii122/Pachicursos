// Materiales descargables por clase (PDF/PPT/…) — guardados en
// `course_videos.resources` (jsonb, columna que existía desde 0001 sin UI).
// Los archivos viven en el bucket PRIVADO `materiales`; nunca se guarda ni
// se entrega una URL pública, solo el `path` interno.

export type TipoRecurso = "pdf" | "ppt" | "doc" | "xls" | "img" | "zip" | "link";

export interface Recurso {
  id: string;
  nombre: string;
  tipo: TipoRecurso;
  path?: string; // archivo en el bucket `materiales`
  url?: string; // enlace externo (solo http/https)
  tamano?: number; // bytes
}

export const TIPO_RECURSO: Record<TipoRecurso, { badge: string; detalle: string; accion: string }> = {
  pdf: { badge: "PDF", detalle: "PDF", accion: "Descargar" },
  ppt: { badge: "PPT", detalle: "Presentación", accion: "Descargar" },
  doc: { badge: "DOC", detalle: "Documento", accion: "Descargar" },
  xls: { badge: "XLS", detalle: "Planilla", accion: "Descargar" },
  img: { badge: "IMG", detalle: "Imagen", accion: "Ver" },
  zip: { badge: "ZIP", detalle: "Archivo comprimido", accion: "Descargar" },
  link: { badge: "LIN", detalle: "Enlace", accion: "Abrir" },
};

export const EXTENSIONES_PERMITIDAS = ".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip";
export const TAMANO_MAXIMO = 50 * 1024 * 1024; // mismo límite que el bucket

export function tipoDesdeNombre(nombre: string): TipoRecurso {
  const ext = nombre.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "ppt" || ext === "pptx") return "ppt";
  if (ext === "doc" || ext === "docx") return "doc";
  if (ext === "xls" || ext === "xlsx") return "xls";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "img";
  if (ext === "zip") return "zip";
  return "doc";
}

export function formatTamano(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function parseRecursos(valor: unknown): Recurso[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter(
    (r): r is Recurso =>
      !!r && typeof r === "object" && typeof (r as Recurso).id === "string" && typeof (r as Recurso).nombre === "string",
  );
}
