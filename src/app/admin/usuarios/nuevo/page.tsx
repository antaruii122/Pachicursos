import { CrearUsuariaForm } from "@/components/admin/CrearUsuariaForm";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CrearUsuariaPage() {
  const supabase = await createClient();
  const { data: cursos, error } = await supabase
    .from("courses")
    .select("id, titulo, estado")
    .neq("estado", "archivado")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`No se pudieron cargar los cursos: ${error.message}`);

  return (
    <div>
      <Link
        href="/admin/usuarios"
        className="mb-3 inline-block font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--vino)] underline underline-offset-4"
      >
        Alumnas y usuarios
      </Link>
      <h1 className="mb-6 text-[1.9rem] font-normal">Crear usuario</h1>
      <CrearUsuariaForm cursos={cursos ?? []} />
    </div>
  );
}
