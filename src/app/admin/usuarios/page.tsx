import { UsuariosManager } from "@/components/admin/UsuariosManager";
import { createClient } from "@/lib/supabase/server";

// Antes de esto no existía ninguna forma de ver "todos los usuarios" — solo
// /admin/ventas, que muestra una fila por COMPRA, no por persona (alguien
// sin compras nunca aparecía en ningún lado), y promover a alguien a admin
// requería correr scripts/set-admin-role.mjs a mano.
export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfiles }, { data: compras }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nombre, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("purchases").select("user_id").eq("estado", "pagado"),
  ]);

  const cursosPorUsuario = new Map<string, number>();
  for (const c of compras ?? []) {
    cursosPorUsuario.set(c.user_id, (cursosPorUsuario.get(c.user_id) ?? 0) + 1);
  }

  const usuarios = (perfiles ?? []).map((p) => ({
    ...p,
    cursosComprados: cursosPorUsuario.get(p.id) ?? 0,
  }));

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold text-[var(--vino)]">
        Usuarios ({usuarios.length})
      </h1>
      <UsuariosManager usuarios={usuarios} currentUserId={user?.id ?? ""} />
    </div>
  );
}
