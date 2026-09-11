// Test de acceso cruzado para la Parte B (ver docs/cursos.md, criterio de
// "hecho" técnico: "un admin se distingue de un alumno vía RLS probado con
// un intento de acceso cruzado").
//
// Crea 2 usuarios de prueba, promueve uno a admin (con la service_role key,
// nunca desde el cliente), y verifica:
//   1. Un alumno NO puede leer el perfil de otro usuario.
//   2. Un alumno NO puede auto-promoverse a admin (columna role protegida).
//   3. Un admin SÍ puede leer todos los perfiles.
// Borra los usuarios de prueba al final, pase o no pase el test.
//
// Uso: npm run test:rls

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables de entorno. Corré con: node --env-file=.env.local scripts/test-rls-cross-access.mjs",
  );
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function assert(condition, label) {
  results.push({ label, pass: !!condition });
  console.log(`${condition ? "✅ PASS" : "❌ FAIL"} — ${label}`);
}

async function createTestUser(email, password) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`No se pudo crear ${email}: ${error.message}`);
  return data.user;
}

async function signIn(email, password) {
  const client = createClient(SUPABASE_URL, ANON_KEY);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`No se pudo loguear ${email}: ${error.message}`);
  return client;
}

async function main() {
  const suffix = Date.now();
  const alumnoEmail = `test-alumno-${suffix}@example.com`;
  const adminEmail = `test-admin-${suffix}@example.com`;
  const password = "TestPassword123!";

  let alumnoUser, adminUser;

  try {
    console.log("Creando usuarios de prueba...");
    alumnoUser = await createTestUser(alumnoEmail, password);
    adminUser = await createTestUser(adminEmail, password);

    console.log("Promoviendo el segundo usuario a admin (vía service_role)...");
    const { error: promoteError } = await adminClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", adminUser.id);
    if (promoteError) throw new Error(`No se pudo promover a admin: ${promoteError.message}`);

    const alumnoClient = await signIn(alumnoEmail, password);
    const adminClientSession = await signIn(adminEmail, password);

    // 1. Alumno no puede leer el perfil de otro usuario (admin, en este caso).
    const { data: crossRead } = await alumnoClient
      .from("profiles")
      .select("id, role")
      .eq("id", adminUser.id);
    assert((crossRead ?? []).length === 0, "Alumno no puede leer el perfil de otro usuario");

    // 2. Alumno no puede auto-promoverse a admin (columna role bloqueada por GRANT).
    await alumnoClient.from("profiles").update({ role: "admin" }).eq("id", alumnoUser.id);
    const { data: afterSelfPromote } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", alumnoUser.id)
      .single();
    assert(
      afterSelfPromote?.role === "alumno",
      "Alumno no puede auto-promoverse a admin",
    );

    // 3. Admin sí puede leer todos los perfiles (al menos los 2 de prueba).
    const { data: allProfiles, error: adminReadError } = await adminClientSession
      .from("profiles")
      .select("id");
    assert(
      !adminReadError && (allProfiles ?? []).length >= 2,
      "Admin puede leer todos los perfiles",
    );
  } finally {
    console.log("Limpiando usuarios de prueba...");
    if (alumnoUser) await adminClient.auth.admin.deleteUser(alumnoUser.id);
    if (adminUser) await adminClient.auth.admin.deleteUser(adminUser.id);
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} tests pasaron.`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Error ejecutando el test:", err.message);
  process.exit(1);
});
