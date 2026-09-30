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

  const { data: purchasesRaw, error: purchasesError } = await supabase
    .from("purchases")
    .select("id, monto, proveedor_pago, estado, fecha, profiles:profiles!purchases_user_id_fkey(nombre, email)")
    .eq("course_id", id)
    .order("fecha", { ascending: false });
  // Nunca mostrar "0 resultados" cuando en realidad la consulta falló
  // (bug 2026-09-30: un embed ambiguo de `profiles` devolvía error y esta
  // pantalla mostraba "(0)" en silencio, con accesos reales en la base).
  if (purchasesError) throw new Error(`No se pudieron cargar los accesos: ${purchasesError.message}`);

  // Para autocompletar el email al otorgar acceso (sin tener que recordarlo).
  const { data: cuentas } = await supabase
    .from("profiles")
    .select("email, nombre")
    .not("email", "is", null)
    .order("email")
    .limit(1000);

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
      <h1 className="mb-6 text-[1.6rem] font-normal">
        Accesos · {course.titulo}
      </h1>
      <AccesosManager courseId={id} purchases={purchases} cuentas={cuentas ?? []} />
    </div>
  );
}
