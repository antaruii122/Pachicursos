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
      "id, slug, titulo, subtitulo_corto, promesa_principal, descripcion, precio, precio_original, estado, cover_image_url, background_image_url, para_quien_es, para_quien_no_es, que_vas_a_aprender, requisitos, faq, testimonios",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!course) return null;

  const { data: clases } = await supabase
    .from("course_videos")
    .select("id, orden, titulo, duracion, is_free_intro, estado_procesamiento")
    .eq("course_id", course.id)
    .order("orden", { ascending: true });

  // Miniatura real de la clase gratis embebida en la landing (hallazgo
  // repetido de Ricardo, 2026-09-14 — ver src/lib/vimeo.ts). `vimeo_id` está
  // bloqueado por columna para el cliente normal (0001_init.sql), así que se
  // lee acá con service_role — seguro porque la clase gratis es pública por
  // diseño, no hace falta validar acceso primero como con el player real.
  let claseGratisThumbnailUrl: string | null = null;
  const claseGratis = clases?.find((c) => c.is_free_intro);
  if (claseGratis) {
    const serviceRole = createServiceRoleClient();
    const { data: claseConVimeo } = await serviceRole
      .from("course_videos")
      .select("vimeo_id")
      .eq("id", claseGratis.id)
      .maybeSingle();
    if (claseConVimeo?.vimeo_id) {
      claseGratisThumbnailUrl = await getVimeoThumbnailUrl(claseConVimeo.vimeo_id).catch(() => null);
    }
  }

  return {
    course: course as Course,
    clases: (clases ?? []) as ClaseResumen[],
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

  const title = `${data.course.titulo} — Alimenta Tu Fertilidad`;
  const description = data.course.descripcion ?? data.course.subtitulo_corto ?? undefined;
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
