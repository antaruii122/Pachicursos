import { UsuariosManager } from "@/components/admin/UsuariosManager";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

// Antes de esto no existía ninguna forma de ver "todos los usuarios" — solo
// /admin/ventas, que muestra una fila por COMPRA, no por persona (alguien
// sin compras nunca aparecía en ningún lado), y promover a alguien a admin
// requería correr scripts/set-admin-role.mjs a mano.
export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfiles }, { data: compras, error: comprasError }, { data: cursos }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nombre, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("purchases").select("id, user_id, course_id").eq("estado", "pagado"),
    supabase.from("courses").select("id, titulo, estado").order("created_at", { ascending: true }),
  ]);
  if (comprasError) throw new Error(`No se pudieron cargar los accesos: ${comprasError.message}`);

  const tituloCurso = new Map((cursos ?? []).map((c) => [c.id, c.titulo]));
  const accesosPorUsuario = new Map<string, { purchaseId: string; courseId: string; titulo: string }[]>();
  for (const c of compras ?? []) {
    const lista = accesosPorUsuario.get(c.user_id) ?? [];
    lista.push({ purchaseId: c.id, courseId: c.course_id, titulo: tituloCurso.get(c.course_id) ?? "Curso" });
    accesosPorUsuario.set(c.user_id, lista);
  }

  const usuarios = (perfiles ?? []).map((p) => ({
    ...p,
    accesos: accesosPorUsuario.get(p.id) ?? [],
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.6rem] font-normal">
          Alumnas y usuarios <span className="text-[var(--tinta-suave)]">({usuarios.length})</span>
        </h1>
        <Link
          href="/admin/usuarios/nuevo"
          className="rounded-full bg-[var(--vino)] px-5 py-2.5 font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-white transition-colors hover:bg-[var(--vino-claro)]"
        >
          + Crear usuario
        </Link>
      </div>
      <UsuariosManager usuarios={usuarios} cursos={cursos ?? []} currentUserId={user?.id ?? ""} />
    </div>
  );
}
