import { AccesosManager } from "@/components/admin/AccesosManager";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AccesosCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("id, titulo").eq("id", id).maybeSingle();
  if (!course) notFound();

  const { data: purchasesRaw } = await supabase
    .from("purchases")
    .select("id, monto, proveedor_pago, estado, fecha, profiles(nombre, email)")
    .eq("course_id", id)
    .order("fecha", { ascending: false });

  // El embed de Supabase infiere `profiles` como array sin tipos generados
  // de la DB — acá se aplana a un solo objeto (purchases.user_id -> profiles
  // es many-to-one, siempre hay 0 o 1).
  const purchases = (purchasesRaw ?? []).map((p) => ({
    ...p,
    profiles: Array.isArray(p.profiles) ? (p.profiles[0] ?? null) : p.profiles,
  }));

  return (
    <div>
      <Link
        href={`/admin/cursos/${id}/editar`}
        className="mb-4 inline-block text-[.85rem] text-[var(--tinta-suave)] hover:text-[var(--vino)]"
      >
        ← {course.titulo}
      </Link>
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold text-[var(--vino)]">
        Accesos de &quot;{course.titulo}&quot;
      </h1>
      <AccesosManager courseId={id} purchases={purchases} />
    </div>
  );
}
