import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

// Gate único para toda /admin/**: sesión + role=admin, validado server-side
// (nunca confiar en el cliente). Cada página admin puede asumir que ya pasó
// por acá.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login?next=/admin/cursos");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="min-h-svh bg-[var(--crema-2)]">
      <header className="border-b border-[var(--linea)] bg-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6 font-[family-name:var(--font-ui)] text-[.88rem]">
            <Link href="/admin/cursos" className="font-semibold text-[var(--vino)]">
              Panel admin
            </Link>
            <Link href="/admin/cursos" className="text-[var(--tinta-suave)] hover:text-[var(--vino)]">
              Cursos
            </Link>
            <Link href="/admin/ventas" className="text-[var(--tinta-suave)] hover:text-[var(--vino)]">
              Ventas
            </Link>
          </nav>
          <Link href="/cuenta/logout" className="text-[.85rem] text-[var(--tinta-suave)] hover:text-[var(--vino)]">
            Cerrar sesión
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-6 py-8">{children}</main>
    </div>
  );
}
