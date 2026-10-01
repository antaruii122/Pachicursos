import { CourseLanding } from "@/components/CourseLanding";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { calcularProgreso } from "@/lib/progreso";
import { ClaseResumen, Course, Modulo } from "@/lib/types";
import { getVimeoThumbnailUrl } from "@/lib/vimeo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

async function getCourseData(slug: string) {
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, slug, titulo, subtitulo_corto, promesa_principal, descripcion, precio, precio_original, estado, cover_image_url, background_image_url, para_quien_es, para_quien_no_es, que_vas_a_aprender, requisitos, faq, testimonios, seo_titulo, seo_descripcion, instructor_nombre, instructor_bio, instructor_foto_url",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!course) return null;

  const [{ data: clases }, { data: modulos }] = await Promise.all([
    supabase
      .from("course_videos")
      .select("id, orden, titulo, duracion, is_free_intro, estado_procesamiento, module_id")
      .eq("course_id", course.id)
      .order("orden", { ascending: true }),
    supabase.from("course_modules").select("id, orden, titulo").eq("course_id", course.id),
  ]);

  // Miniatura real por clase (hallazgo repetido de Ricardo, 2026-09-14 — ver
  // src/lib/vimeo.ts; primero se cerró solo para la clase gratis embebida,
  // después pidió el mismo criterio "con ojos de alumna" para toda la lista
  // del currículum). `vimeo_id` está bloqueado por columna para el cliente
  // normal (0001_init.sql) — se lee acá con service_role. Mostrar solo la
  // miniatura de una clase bloqueada no da acceso a reproducirla (coincide
  // con el criterio del plan: una clase bloqueada se ve normal, solo no se
  // puede reproducir), así que no hace falta validar compra antes de esto,
  // a diferencia del endpoint real del player.
  const clasesConThumbnail = (clases ?? []) as ClaseResumen[];
  let claseGratisThumbnailUrl: string | null = null;
  if (clasesConThumbnail.length > 0) {
    const serviceRole = createServiceRoleClient();
    const { data: vimeoIds } = await serviceRole
      .from("course_videos")
      .select("id, vimeo_id")
      .in(
        "id",
        clasesConThumbnail.map((c) => c.id),
      );
    const vimeoIdPorClase = new Map((vimeoIds ?? []).map((v) => [v.id, v.vimeo_id]));

    await Promise.all(
      clasesConThumbnail.map(async (c) => {
        const vimeoId = vimeoIdPorClase.get(c.id);
        if (!vimeoId) return;
        c.thumbnailUrl = await getVimeoThumbnailUrl(vimeoId).catch(() => null);
      }),
    );

    claseGratisThumbnailUrl =
      clasesConThumbnail.find((c) => c.is_free_intro)?.thumbnailUrl ?? null;
  }

  return {
    course: course as Course,
    clases: clasesConThumbnail as ClaseResumen[],
    modulos: (modulos ?? []) as Modulo[],
    claseGratisThumbnailUrl,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCourseData(slug);
  if (!data) return {};

  // `seo_titulo`/`seo_descripcion` — hallazgo real (2026-09-14): el admin
  // podía cargar estos dos campos y se guardaban bien, pero esta función
  // nunca los leía — el <title>/meta description/Open Graph siempre salían
  // de `titulo`/`descripcion` sin importar lo que dijera el form.
  const title = data.course.seo_titulo || `${data.course.titulo} — NUTFEM`;
  const description =
    data.course.seo_descripcion || data.course.descripcion || data.course.subtitulo_corto || undefined;
  const images = data.course.cover_image_url ? [{ url: data.course.cover_image_url }] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images, type: "website", locale: "es_CL" },
    twitter: { card: images ? "summary_large_image" : "summary", title, description, images },
  };
}

export default async function CursoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCourseData(slug);

  if (!data) notFound();

  // ¿Quien mira ya tiene este curso? → "Ir a mi curso" (a su próxima clase)
  // en vez de "Comprar". Admin también entra directo.
  let accesoHref: string | null = null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const [{ data: compra }, { data: perfil }] = await Promise.all([
      supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", data.course.id)
        .eq("estado", "pagado")
        .maybeSingle(),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);
    if (compra || perfil?.role === "admin") {
      const p = await calcularProgreso(supabase, user.id, data.course.id, data.course.slug, data.course.titulo, null);
      accesoHref = `/cursos/${data.course.slug}/clase/${p.siguienteOrden}`;
    }
  }

  return (
    <CourseLanding
      course={data.course}
      clases={data.clases}
      modulos={data.modulos}
      accesoHref={accesoHref}
      claseGratisThumbnailUrl={data.claseGratisThumbnailUrl}
    />
  );
}
