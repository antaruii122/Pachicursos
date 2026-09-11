// Promueve una cuenta existente a role='admin'. Necesario porque, después
// de 0002_profiles_role_column_protection.sql, cambiar `role` ya no se
// puede hacer desde el cliente (ni siquiera un admin) — solo con la
// service_role key, que este script usa.
//
// La cuenta tiene que existir primero (registrate normal en /cuenta/registro
// y confirmá el email) — este script solo cambia el rol, no crea la cuenta.
//
// Uso: npm run set-admin -- correo@ejemplo.com

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables de entorno. Corré con: npm run set-admin -- correo@ejemplo.com",
  );
  process.exit(1);
}
if (!email) {
  console.error("Uso: npm run set-admin -- correo@ejemplo.com");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`No se pudo listar usuarios: ${error.message}`);
    const found = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  console.log(`Buscando cuenta con email ${email}...`);
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error(
      `No existe ninguna cuenta con ese email. Registrate primero en /cuenta/registro y confirmá el email.`,
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id);
  if (error) throw new Error(`No se pudo actualizar el rol: ${error.message}`);

  console.log(`Listo. ${email} (id ${user.id}) ahora es admin.`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
