import { CourseLanding } from "@/components/CourseLanding";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ClaseResumen, Course } from "@/lib/types";
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

  const { data: clases } = await supabase
    .from("course_videos")
    .select("id, orden, titulo, duracion, is_free_intro, estado_procesamiento")
    .eq("course_id", course.id)
    .order("orden", { ascending: true });

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
  const title = data.course.seo_titulo || `${data.course.titulo} — Alimenta Tu Fertilidad`;
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

  return (
    <CourseLanding
      course={data.course}
      clases={data.clases}
      claseGratisThumbnailUrl={data.claseGratisThumbnailUrl}
    />
  );
}
