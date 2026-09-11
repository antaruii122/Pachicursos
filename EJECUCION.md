# Registro de ejecución — Alimenta Tu Fertilidad, plataforma de cursos

Cada vez que se cierra una Parte del roadmap (ver `docs/cursos.md`), se agrega una línea acá con el formato:

`✅ Parte X completada — YYYY-MM-DD — [resumen breve de lo construido]`

Si el subagente revisor (`curso-platform-reviewer`) rechaza el cierre de una Parte, se registra también:

`❌ Parte X rechazada — YYYY-MM-DD — [motivo del rechazo]`

**Este archivo es un historial, no un estado editable.** No se borra ni se reescribe nada de lo ya agregado — las correcciones se registran como eventos nuevos, no reemplazando los anteriores. Cualquier sesión de Claude Code debe leer este archivo completo antes de tocar código, para saber exactamente dónde retomar (ver `CLAUDE.md`).

## Roadmap de referencia (Partes A–H, detalle completo en `docs/cursos.md`)

- [ ] Parte A — Setup de cuentas/infra
- [ ] Parte B — Modelo de datos + Auth
- [ ] Parte C — Plantilla de landing + shell del reproductor + widget mínimo de subida + curso placeholder
- [ ] Parte D — Integración Vimeo segura
- [ ] Parte E — Panel de administración completo
- [ ] Parte F — Pagos
- [ ] Parte G — Consistencia de marca + QA + lanzamiento
- [ ] Parte H — Automatizaciones en n8n (boleta electrónica + emails)

## Estado actual: Parte A en curso, Partes B y C adelantadas parcialmente

**Parte A — Setup de cuentas/infra** (no cerrada):
- [x] Cuenta Supabase creada, proyecto activo, credenciales en `.env.local`.
- [x] Cuenta Vimeo con credenciales de API en `.env.local` — **falta confirmar que el plan contratado es Standard o superior** (requisito para restricción de dominio, bloquea Parte D si no).
- [ ] Proyecto Vercel + DNS del subdominio — no iniciado. Esto es lo que técnicamente bloquea cerrar Parte A (su criterio pide credenciales en variables de entorno de **Vercel**, no solo locales).
- [ ] Cuenta Resend — no iniciada.
- [ ] Trámite de cuenta de comercio Flow.cl — no iniciado.

**Parte B — Modelo de datos + Auth** (adelantada a pedido explícito de Ricardo, antes de cerrar Parte A):
- [x] `supabase/migrations/0001_init.sql` — las 9 tablas del modelo de datos, constraints, índices y RLS. Aplicada en el proyecto Supabase real.
- [x] `supabase/migrations/0002_profiles_role_column_protection.sql` — fix de un bug real encontrado al escribir el test de acceso cruzado: la policy de update de `profiles` permitía auto-promoción a admin (RLS no protege columnas). **Corrida en el proyecto Supabase real (confirmado por Ricardo).** Como consecuencia, cambiar `role` ya no se puede hacer desde el cliente ni por un admin — solo con la service_role key (ver `scripts/set-admin-role.mjs` abajo).
- [x] `scripts/set-admin-role.mjs` (`npm run set-admin -- correo@ejemplo.com`) — promueve una cuenta ya registrada a `role=admin` usando la service_role key (necesario después de 0002). **Todavía no corrido** — Ricardo tiene que registrar una cuenta normal primero en `/cuenta/registro`.
- [x] `src/lib/supabase/client.ts` y `server.ts` — helpers oficiales de `@supabase/ssr` (patrón verificado contra el repo oficial de ejemplos de Next.js, no adivinado).
- [x] `src/proxy.ts` — refresco de sesión únicamente (Next.js 16 renombró "middleware" a "proxy" — el codemod oficial también renombra la función exportada, ya aplicado). Sin redirecciones globales todavía; el gate de acceso a clases específicas ya se implementó directo en la Parte C (ver abajo), no acá.
- [x] Páginas de auth en español: `/cuenta/login`, `/cuenta/registro`, `/cuenta/olvide-password`, `/cuenta/actualizar-password`, `/cuenta/logout`, `/auth/confirm` (route handler), `/auth/error`.
- [ ] **Pendiente manual en el dashboard de Supabase**: editar las plantillas de email (Authentication → Email Templates) para que los links de confirmación/recuperación usen el patrón `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&next=/` — la plantilla default no pasa por nuestra ruta `/auth/confirm`.
- [ ] `scripts/test-rls-cross-access.mjs` — escrito, corre 3 asserts (alumno no lee perfil ajeno, alumno no se auto-promueve a admin, admin sí lee todos los perfiles). **0002 ya está aplicada, así que ahora sí se puede correr** (`npm run test:rls`) — sigue pendiente porque crea/borra usuarios de prueba reales y Ricardo prefirió dejarlo para cuando quiera.

**Parte C — Plantilla de landing + shell del reproductor + widget de subida + curso placeholder** (adelantada, prácticamente completa):
- [x] `src/components/CourseLanding.tsx` — plantilla ÚNICA parametrizada, las 10 secciones del roadmap en orden fijo, replicando el mockup real (leído del canvas publicado, no de memoria: colores, copy y estructura exactos de `Main.dc.html`). Cada sección se omite si el curso no tiene ese contenido cargado (testimonios, FAQ, etc.), tal como pide el plan.
- [x] `src/app/cursos/[slug]/page.tsx` — landing real, server-rendered, con SEO metadata dinámica. Un curso no publicado da 404 automáticamente (RLS ya lo filtra, no hace falta lógica extra).
- [x] `src/app/cursos/[slug]/clase/[n]/page.tsx` — shell del reproductor con los 3 estados: gratis, bloqueada (con CTA a comprar, sin redirect), y "sin sesión intentando ver clase paga" → redirect a `/cuenta/login?next=...` con retorno preservado. **Verificado en vivo** con el curso placeholder: los 3 casos responden como corresponde (200/200/307).
- [x] `src/components/ClassNotes.tsx` — notas personales con autoguardado (debounce, sin botón guardar), una por alumno por clase vía upsert (usa la constraint `unique(user_id, video_id)` de 0001).
- [x] `scripts/seed-placeholder-course.mjs` (`npm run seed:placeholder`) — curso placeholder "Regula tu Ciclo, Recupera tu Fertilidad" con 4 clases (1 gratis), idempotente (upsert por slug). **Ya corrido contra el proyecto real** — visible en `/cursos/placeholder-regula-tu-ciclo`. Falta borrarlo/despublicarlo antes de la Parte G.
- [x] Paleta/tipografía de marca movidas a `globals.css` y `layout.tsx` (Lato/Noto Serif/Poppins vía `next/font`, los 12 tokens de color) — ya no hardcodeadas por página.
- [x] `src/lib/vimeo.ts` + `src/app/api/vimeo/upload-url/route.ts` — endpoint que crea el upload TUS en Vimeo (`POST /me/videos`, `approach: tus`) y guarda `vimeo_id`. Patrón verificado contra el SDK oficial `vimeo/vimeo.py` (no adivinado): headers `Accept: application/vnd.vimeo.*;version=3.4`, extracción del id desde `uri`. Valida sesión (401) y `role=admin` server-side (403) antes de llamar a Vimeo — **verificado en vivo** que ambos gates responden correctamente sin sesión.
- [x] `src/components/VideoUploadWidget.tsx` — sube el archivo directo navegador → Vimeo con `tus-js-client` (opción `uploadUrl`, confirmada en la doc oficial del paquete como el patrón recomendado para APIs que ya crean el recurso de subida, como Vimeo) — nunca pasa por nuestro servidor. Barra de progreso durante la subida; después hace polling de estado (ver Parte D abajo).
- [x] `src/app/admin/subir-video-prueba/page.tsx` — página mínima para probar el pipe (no es el panel admin real, eso es Parte E), protegida por sesión + rol admin.
- [ ] **No probado con un archivo real todavía** — 0002 ya corrió; falta que Ricardo registre una cuenta (`/cuenta/registro`), corra `npm run set-admin -- <email>`, y suba un video real desde `/admin/subir-video-prueba`. El build/lint pasan y los gates de seguridad están verificados; falta la prueba end-to-end con un video real.
- [x] **Decisión tomada (2026-09-11): landing mobile muestra las 10 secciones, no la versión condensada del artboard mobile del mockup** — se le preguntó explícitamente a Ricardo porque el mockup mobile omite instructor/testimonios/FAQ, lo cual contradice el criterio "mobile-first" del propio plan (la mayoría del tráfico es celular, y esas secciones son las que generan confianza para comprar). Se confirmó que el código actual de `CourseLanding.tsx` ya reflowa correctamente a una columna en mobile (grid sin cols hasta el breakpoint `md:`, tarjetas con `flex-wrap`) — no hizo falta cambiar código, solo confirmar el alcance. MisCursos/AdminCurso del mockup siguen sin leerse en detalle — son Parte E, no bloquean Parte C.
- No se ha invocado el subagente `curso-platform-reviewer` — no se cierra ninguna Parte formalmente hasta que lo apruebe.

**Parte D — Integración Vimeo segura** (adelantada, código completo, falta solo probar con un video real):
- [x] **Corrección importante al plan (2026-09-11)**: `docs/cursos.md` asumía que la transición `procesando→listo` se detecta "con el webhook de Vimeo (con polling como respaldo)". Investigado y confirmado que **Vimeo no tiene webhook de fin de transcoding** — limitación real de su API, documentada en múltiples issues de sus propios SDKs oficiales, nunca resuelta. El plan quedó corregido (acá y en el `cursos.md` original fuera del repo, ambos sincronizados) para reflejar que el polling a `transcode.status` es el único mecanismo real.
- [x] **Decisión tomada con Ricardo**: el polling se hace desde el navegador del admin mientras tiene la página de subida abierta (no cron/n8n, no chequeo perezoso en el próximo page load) — más simple, sin infraestructura nueva, aceptando que se corta si cierra la pestaña antes de que termine.
- [x] `getVimeoTranscodeStatus()` en `src/lib/vimeo.ts` + `src/app/api/vimeo/status/[videoId]/route.ts` — consulta `GET /videos/{vimeo_id}?fields=transcode.status`, actualiza `estado_procesamiento` a `listo` cuando corresponde. Mismos gates de sesión+admin que `/api/vimeo/upload-url`, **verificado en vivo** (401 sin sesión).
- [x] `VideoUploadWidget.tsx` ahora hace polling cada 5s tras terminar la subida (tope de 60 intentos / ~5 min), con estados visuales subiendo→procesando→listo.
- [x] **`player_embed_url` verificado sin poder usar la doc oficial de Vimeo** (developer.vimeo.com es una SPA que bloquea el scraping automático) — confirmado revisando uso real en decenas de repos de producción en GitHub, incluido el extractor de `yt-dlp`. Confirmado también que ese campo ya incluye el hash de privacidad para videos "unlisted", así que nunca se arma la URL a mano.
- [x] `getVimeoEmbedUrl()` en `src/lib/vimeo.ts` + `src/app/api/courses/[slug]/videos/[videoId]/player/route.ts` — el endpoint central de seguridad del plan: valida acceso (gratis o compra pagada, con `service_role` solo para leer `vimeo_id` DESPUÉS de validar) y recién ahí pide el `player_embed_url` a Vimeo. **Verificado en vivo contra el proyecto real** con las 4 clases placeholder: clase paga sin sesión → 401; clase gratis con `estado_procesamiento='listo'` pero sin `vimeo_id` real (nunca se subió nada) → 404 "todavía no tiene video subido", sin filtrar nada. Comportamiento correcto en ambos casos.
- [x] `src/components/ClassPlayer.tsx` — pide el embed al endpoint de arriba y renderiza el iframe real; reemplaza el placeholder visual de la Parte C. Ya integrado en `/cursos/[slug]/clase/[n]`.
- [ ] **Sigue sin probarse una reproducción real de punta a punta** — necesita un video real subido y procesado, que depende de que Ricardo tenga la cuenta admin (mismo bloqueo que el resto).
- No se ha invocado el subagente revisor — no se cierra la Parte.

**Para retomar rápido**: ver este bloque antes que nada. Los checkboxes sin marcar son exactamente lo que falta. Todo el trabajo de código de la Parte C está construido; lo que falta ahora depende de Ricardo: registrar una cuenta + `npm run set-admin` + probar una subida real, correr el test de RLS cuando quiera, o resolver los pendientes manuales de Parte A (Vercel/Resend/Flow.cl). En paralelo, lo próximo con sentido en código: terminar el endpoint de reproducción validado de la Parte D.

---

(el registro de eventos empieza acá — cada línea nueva se agrega debajo, nunca se edita una existente)
