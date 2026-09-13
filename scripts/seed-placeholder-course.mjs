// Curso placeholder para probar el flujo completo (Parte C, ver docs/cursos.md):
// landing → clase gratis → clase bloqueada → (compra en Parte F) → desbloqueo.
// Se inserta directo por script (no por UI — el CRUD admin es Parte E).
// Idempotente: usa upsert por slug, se puede correr de nuevo sin duplicar.
//
// Se debe borrar o despublicar antes del lanzamiento real (Parte G).
//
// Uso: npm run seed:placeholder

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables de entorno. Corré con: node --env-file=.env.local scripts/seed-placeholder-course.mjs",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// El título/subtítulo NUNCA deben tener texto tipo "[PLACEHOLDER]" o "curso de
// prueba" — este curso está `publicado` para poder probar el sitio real, así
// que ese texto termina en el <title>, el Open Graph, y la card del home
// (hallazgo 2026-09-12: quedó así varias horas en producción, visible en
// cualquier link compartido). El marcador de "esto es de prueba" vive acá,
// en el comentario del script, no en ningún campo que se renderice.
const CURSO_PLACEHOLDER = {
  slug: "placeholder-regula-tu-ciclo",
  titulo: "Regula tu Ciclo, Recupera tu Fertilidad",
  subtitulo_corto: null,
  promesa_principal: "Regula tu ciclo, recupera tu fertilidad",
  descripcion:
    "Un programa de 8 semanas para entender tu ciclo, corregir la alimentación que lo está desregulando y prepararte con base científica para buscar embarazo.",
  precio: 49990,
  precio_original: 69990,
  estado: "publicado",
  para_quien_es:
    "Llevas meses (o años) con el ciclo irregular y nadie te ha explicado por qué.\nEstás buscando embarazo y quieres preparar tu cuerpo con alimentación, no solo con suplementos.\nQuieres entender el porqué detrás de cada recomendación, no una dieta genérica.",
  para_quien_no_es:
    "Buscas un plan de comidas genérico sin contexto clínico.\nTu diagnóstico requiere seguimiento médico individual (este curso complementa, no reemplaza a tu médico).",
  que_vas_a_aprender: [
    "Leer tu propio ciclo e identificar tus fases hormonales",
    "Armar tu plato antiinflamatorio sin dietas restrictivas",
    "Preparar tu cuerpo para buscar embarazo con una estrategia de al menos 3 ciclos",
  ],
  faq: [
    {
      pregunta: "¿Necesito diagnóstico médico previo?",
      respuesta:
        "No es obligatorio, el curso te ayuda a entender tu ciclo independiente de si ya tienes un diagnóstico o no.",
    },
    {
      pregunta: "¿Por cuánto tiempo tengo acceso?",
      respuesta: "Acceso sin vencimiento una vez comprado.",
    },
  ],
  testimonios: [],
};

// Sin `duracion` ni `estado_procesamiento` acá a propósito (hallazgo real de
// Ricardo, 2026-09-14): antes este script forzaba "listo" + una duración
// inventada en TODAS las clases, aunque nunca hubiera un video real subido —
// el admin veía "LISTO" en clases sin ningún video, un dato directamente
// falso. Sin estos dos campos, una clase nueva cae en el default real de la
// tabla (`estado_procesamiento = 'subiendo'`, `duracion = null`), y una clase
// que ya tiene un video real vinculado (como la 1, ver abajo) no se pisa,
// porque un campo ausente en el objeto no se toca en el upsert.
const CLASES_PLACEHOLDER = [
  { orden: 1, titulo: "Introducción: tu ciclo, tu mapa", is_free_intro: true },
  { orden: 2, titulo: "Hormonas y ciclo: lo que nadie te explicó" },
  { orden: 3, titulo: "Plato antiinflamatorio para tu fase folicular" },
  { orden: 4, titulo: "Ovulación: cómo apoyarla con alimentación" },
];

async function main() {
  console.log("Insertando/actualizando curso placeholder...");
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .upsert(CURSO_PLACEHOLDER, { onConflict: "slug" })
    .select()
    .single();

  if (courseError) throw new Error(`No se pudo crear el curso: ${courseError.message}`);
  console.log(`Curso listo: ${course.slug} (id ${course.id})`);

  for (const clase of CLASES_PLACEHOLDER) {
    const { error } = await supabase
      .from("course_videos")
      .upsert(
        { ...clase, course_id: course.id, estado_procesamiento: "listo" },
        { onConflict: "course_id,orden" },
      );
    if (error) throw new Error(`No se pudo crear la clase ${clase.orden}: ${error.message}`);
    console.log(`  Clase ${clase.orden}: ${clase.titulo}${clase.is_free_intro ? " (gratis)" : ""}`);
  }

  console.log(`\nListo. Landing en /cursos/${course.slug}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
