import { CambiarPasswordForm } from "@/components/account/CambiarPasswordForm";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const card = "rounded-[18px] bg-white p-6 shadow-[0_12px_30px_rgba(78,15,38,.1)]";

export default async function SeguridadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login?next=/cuenta/seguridad");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold text-[var(--vino)]">
        Seguridad
      </h1>

      <div className={card}>
        <h2 className="mb-4 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
          Cambiar contraseña
        </h2>
        <CambiarPasswordForm />
      </div>

      <div className={card}>
        <h2 className="mb-1 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
          Email de la cuenta
        </h2>
        <p className="mb-2 text-[.9rem] text-[var(--tinta)]">{user.email}</p>
        <p className="text-[.78rem] text-[var(--tinta-suave)]">
          El email no se puede cambiar desde acá todavía — requiere un flujo de confirmación aparte.
          Escribinos si necesitás cambiarlo.
        </p>
      </div>

      <div className={card}>
        <h2 className="mb-3 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
          Sesión
        </h2>
        <Link
          href="/cuenta/logout"
          className="inline-flex rounded-full border border-[var(--linea)] px-5 py-2 font-[family-name:var(--font-ui)] text-[.85rem] text-[var(--tinta-suave)] hover:border-[var(--carmin)] hover:text-[var(--carmin)]"
        >
          Cerrar sesión
        </Link>
      </div>
    </div>
  );
}
