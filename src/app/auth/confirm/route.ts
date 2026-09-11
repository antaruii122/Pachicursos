import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

// Recibe el link de los emails de Supabase Auth (confirmación de registro,
// recuperación de contraseña) generado con el patrón {{ .TokenHash }}.
// IMPORTANTE: hay que editar las plantillas de email en el dashboard de
// Supabase (Authentication → Email Templates) para que el link apunte a
// {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&next=/ru
// (la plantilla por defecto usa un link distinto que no pasa por acá).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/auth/error?error=${encodeURIComponent("Falta token_hash o type")}`);
}
