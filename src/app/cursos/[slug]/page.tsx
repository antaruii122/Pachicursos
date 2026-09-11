import { CourseLanding } from "@/components/CourseLanding";
import { createClient } from "@/lib/supabase/server";
import { ClaseResumen, Course } from "@/lib/types";
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

  return { course: course as Course, clases: (clases ?? []) as ClaseResumen[] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCourseData(slug);
  if (!data) return {};

  return {
    title: `${data.course.titulo} — Alimenta Tu Fertilidad`,
    description: data.course.descripcion ?? data.course.subtitulo_corto ?? undefined,
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

  return <CourseLanding course={data.course} clases={data.clases} />;
}
