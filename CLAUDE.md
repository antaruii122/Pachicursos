# CLAUDE.md — Alimenta Tu Fertilidad, plataforma de cursos

Reglas para cualquier sesión de Claude Code que trabaje en este repo. Léelas antes de tocar código.

## Regla principal: una Parte a la vez

Este proyecto se construye siguiendo el roadmap de `docs/cursos.md` (Partes A a H). Nunca se adelanta trabajo de una Parte futura mientras la actual no esté cerrada.

1. **Antes de empezar a trabajar**, lee `EJECUCION.md` en la raíz del repo. Ahí está registrada la última Parte marcada como `✅ completada`. La que sigue en el roadmap de `docs/cursos.md` es la que toca ahora — nunca asumas cuál es sin leer ese archivo primero.
2. **Trabaja solo esa Parte.** Si durante el trabajo aparece algo que pertenece a una Parte posterior, anótalo (puede ir en el resumen al cerrar la Parte actual) pero no lo implementes todavía.
3. **Al terminar la Parte**, antes de marcarla como cerrada, invoca obligatoriamente el subagente `curso-platform-reviewer` (definido en `.claude/agents/curso-platform-reviewer.md`) para que revise el trabajo contra el criterio de "hecho" de esa Parte específica en `docs/cursos.md`. No es opcional.
4. **Si el subagente rechaza**: la Parte NO se marca como completada. Se registra el rechazo en `EJECUCION.md` con el formato de abajo, se corrige lo señalado, y se vuelve a pedir revisión. No se avanza a la siguiente Parte mientras tanto.
5. **Si el subagente aprueba**: se agrega una línea a `EJECUCION.md` con el formato exacto:
   `✅ Parte X completada — YYYY-MM-DD — [resumen de 1 línea de lo construido]`
6. **`EJECUCION.md` es un historial, no un estado editable**: nunca se borra ni se reescribe una línea ya agregada (ni una aprobación ni un rechazo). Cada evento se agrega al final.

Esto existe para que, sin importar qué sesión de Claude Code retome este proyecto (hoy, en una semana, o en tres meses), siempre sepa exactamente en qué quedó y por dónde seguir sin tener que preguntarle a Ricardo o a Marcela ni releer todo el historial de chat.

## Dónde está todo

- Plan completo, arquitectura y roadmap detallado por Partes: `docs/cursos.md`
- Registro de partes completadas/rechazadas: `EJECUCION.md`
- Subagente revisor de cada Parte: `.claude/agents/curso-platform-reviewer.md`
- Mockup visual de referencia (landing, reproductor, mis cursos, panel admin): link dentro de `docs/cursos.md`, sección "Mockup visual (ya creado)"

## No negociable en cualquier Parte (revísalo aunque no sea el foco de la Parte actual)

- Nunca exponer el `vimeo_id` de una clase paga al cliente sin validar acceso server-side primero.
- Nunca confiar solo en el cliente para el gate de acceso a video — siempre doble validación (RLS de Supabase + endpoint server-side).
- Los webhooks de pago (Flow.cl/Stripe) siempre se verifican por firma y se procesan de forma idempotente.
- La landing de un curso usa siempre la plantilla compartida (ver "Plantilla de landing reutilizable" en este documento) — nunca un diseño ad-hoc por curso.
- 100% del contenido de la interfaz en español.
- Ningún secreto/credencial (API keys, service role key, etc.) en código versionado ni expuesto al cliente — siempre variables de entorno server-side.

## Reglas de calidad aprendidas a la fuerza (2026-09-30) — obligatorias

Cada regla sale de un error real que Ricardo tuvo que encontrar él mismo. Detalle y análisis en `EJECUCION.md`, sección "Análisis de errores 2026-09-30".

1. **UNA sola marca en todo el sitio: NUTFEM** (decisión de Ricardo 2026-10-01, siguiendo a Pachi; reemplaza "Alimenta tu Fertilidad · CAMPUS"). Desde 2026-10-16 (guía NUTFEM 2027 de Pachi): paleta burdeos/rosa/salvia y logo de corazón en aro; tipografías Inter Tight (títulos) + Inter (texto y UI), definidas solo en `layout.tsx` + tokens `--font-*`. Un solo logo (`src/components/brand/Logo.tsx`), una sola paleta (tokens en `src/app/globals.css`). Nunca un logo dibujado a mano, nunca un color hex/rgba de marca fuera de `globals.css`, nunca "un tema para esta sección y otro para aquella". `npm run lint` y `prebuild` corren `scripts/check-marca.mjs` y fallan si esto se rompe — no se desactiva ni se agregan excepciones sin motivo escrito.
2. **La maqueta aprobada es la referencia visual** (`docs/maqueta-campus.md`). Si una pantalla nueva no está en la maqueta, se construye con las mismas piezas (`src/components/campus/ui.tsx`), no con estilos nuevos.
3. **Nunca ignorar el `error` de una consulta Supabase.** Siempre `const { data, error } = ...` y si hay error, lanzarlo o mostrarlo. Mostrar "0 resultados" / 404 cuando la consulta en realidad falló ya causó 3 incidentes (acceso manual siempre "no existe", landing 404 en producción, admin mostrando "(0) accesos" con accesos reales).
4. **Embeds de `profiles` desde `purchases`** siempre con la FK explícita: `profiles:profiles!purchases_user_id_fkey(...)` — `purchases` tiene dos FKs a `profiles` (`user_id`, `otorgado_por`) y el embed sin FK falla con PGRST201.
5. **"Hecho" = visto.** Ningún cambio de UI se reporta como terminado sin captura real de CADA pantalla afectada, incluidas las que requieren sesión (pedirle a Ricardo que inicie sesión en la pestaña del navegador de pruebas; el agente no escribe contraseñas). Si no se pudo ver, se dice explícitamente "no verificado visualmente".
6. **Decidir, no preguntar, en lo que ya está definido.** Ricardo ya dio la maqueta y la marca: aplicar sin consultar. Preguntar solo decisiones de negocio nuevas (precios, qué funciones construir).

## Mapa del código (revisado 2026-10-06)

**Qué es:** Campus NUTFEM, plataforma **privada** para alumnas del Diplomado de Pachi (no vende, no tiene páginas públicas de venta). Producción: `https://pachicursos.vercel.app` (Vercel, repo GitHub `antaruii122/Pachicursos`). Stack: Next.js 16 (App Router, `src/proxy.ts` = middleware que refresca la sesión) + Supabase (Postgres/Auth/RLS/Storage) + Vimeo (video) + Tailwind v4.

**No confundir** con `Desktop\Antigravity Pojects\Ricardo Main Usage\academia-nutfem` (sitio Astro + Airtable más viejo, repo `Pachi---Nutfem-repo`). ESTE repo es el campus.

**Base de datos** (`supabase/migrations/0001…0007`, en orden):
- `profiles` (role `admin`|`alumno`, email) — se crea sola con trigger al registrarse. `is_admin()` es la función que usan todas las políticas RLS.
- `courses` (estado `borrador|publicado|despublicado|archivado`), `course_modules`, `course_videos` (= clases: `orden`, `module_id`, `is_free_intro`, `duracion`, `estado_procesamiento subiendo|procesando|listo`, `resources` = materiales en bucket `materiales`).
- `course_videos.vimeo_id` está **bloqueada por GRANT** para anon/authenticated (incluso admin): solo se lee con `createServiceRoleClient()` en el servidor, después de validar acceso.
- `purchases` = **el acceso**. Una alumna ve un curso si tiene fila `estado='pagado'` (pago real o `proveedor_pago='manual'` otorgado por admin). Sin pagos activos todavía: hoy todo acceso es manual.
- `lesson_progress`, `video_notes` (por alumna), `class_questions` (preguntas por clase, `puede_ver_clase()`), `leads`, `analytics_events`, `payment_webhook_events`.

**Rutas principales** (`src/app`):
- `/` pantalla de ingreso → si hay sesión redirige a `/admin` (admin) o `/inicio` (alumna).
- Campus de la alumna (diseño NUTFEM 2027, grupo `src/app/(campus)`): `/inicio`, `/modulos` → `/modulos/[n]` (n = posición del módulo; 0 = Introducción), `/programas`. `cargarCampus()` en `src/lib/campus.ts` exige sesión y trae programas + avance.
- `/cuenta/*` área de la alumna (comunidad, perfil, actividad, seguridad, login/registro/olvidé contraseña; `/cuenta/mis-cursos` solo redirige a `/inicio`). `/auth/confirm` confirma links de email.
- `/cursos/[slug]` ficha del curso; `/cursos/[slug]/clase/[n]` reproductor + sidebar + materiales + notas + preguntas.
- `/admin/*` (layout exige role admin): cursos (crear/editar/clases/accesos/preview), usuarios (crear alumna con contraseña + asignar curso, cambiar rol), preguntas, ventas.
- `/api/courses/[slug]/videos/[videoId]/player` = **el gate de seguridad del video** (valida clase gratis o compra pagada o admin → recién ahí pide `player_embed_url` a Vimeo). `/api/vimeo/*` = subida y estado (solo admin).
- Pagos (`src/lib/flow.ts`, `/checkout/*`, `/api/webhooks/flow`): **congelados**, no tocar sin que Ricardo lo pida.

**Lógica compartida** (`src/lib`): `vimeo.ts` (API Vimeo), `progreso.ts` (avance por curso/módulo), `recursos.ts` (materiales), `preguntas.ts`, `admin-stats.ts`, `errores.ts` (`mensajeError`), `types.ts` (tipos + `agruparPorModulo`, `calcularCompletitud`).

## Vimeo: cómo funciona y qué cuenta está conectada (2026-10-06)

- El sitio habla con Vimeo con **una sola llave**: `VIMEO_ACCESS_TOKEN` (en `.env.local` y en Vercel). Todo lo que hace (`src/lib/vimeo.ts`) lo hace como el dueño de esa llave.
- **Hoy la llave es de la cuenta de Ricardo** ("Ricardo Calderon", plan free, scopes `public private video_files` — sin `upload`, por eso la subida directa desde el admin no funciona).
- **Los videos de Pachi están en SU cuenta, "Academia NutFem"**. Hoy funcionan solo porque son **públicos** (verificado: video 1055256290, `view=anybody`).
- **Un video privado/oculto de Pachi NO va a funcionar** con la llave actual: `attachVimeoVideo()` (`admin/cursos/[id]/clases/actions.ts`) consulta Vimeo y la cuenta de Ricardo no puede ver videos privados ajenos → error "No se pudo encontrar ese video".
- **Solución:** generar un token en la cuenta de Pachi (developer.vimeo.com → app → token "Authenticated (you)" con scopes Public, Private, Video Files, + Edit/Upload) y reemplazar `VIMEO_ACCESS_TOKEN` en Vercel (Production + Preview) y `.env.local`, y redeploy. No requiere cambios de código: el link privado (`vimeo.com/ID/HASH`) ya se acepta (se extrae el ID numérico) y `player_embed_url` de la API ya trae el hash de privacidad.
- Protección real para curso pagado: en Vimeo, cada video con privacidad **"Embed only"** (antes "Hide from Vimeo": no se ve en vimeo.com) + **"Where can this be embedded?" → "Specific domains"**: `pachicursos.vercel.app` (y el dominio final cuando exista; máx. 50 dominios). **Requiere plan Starter o superior** (no Free/Basic) — confirmado en vimeo.com/features/video-privacy y help.vimeo.com (2026-10-06). Fuera de esos dominios, o abriendo el link copiado directo, Vimeo muestra "Sorry. Because of its privacy settings, this video cannot be played here".
- Vimeo decide por el **Referer**. Nunca agregar `Referrer-Policy: same-origin`/`no-referrer` ni `<meta name="referrer" content="no-referrer">` al sitio: rompe todos los videos (hoy no hay header → default del navegador, compatible). Límite honesto: un técnico puede falsificar el Referer con herramientas de descarga, y grabar pantalla siempre es posible; DRM real es solo plan Enterprise.
- Al cambiar la llave, el video de prueba de la cuenta de Ricardo (1231583833, curso "test") deja de reproducirse si se vuelve privado; los videos públicos de cualquier cuenta siguen funcionando.

## Revisión de seguridad 2026-10-06

- OK: todas las server actions de admin y `/api/vimeo/*`, `/api/admin/*` validan sesión + `role=admin` en el servidor; `vimeo_id` solo sale tras validar acceso; materiales vía URL firmada de 120 s tras validar compra; `.env.local` nunca entró a git; `role` solo editable con service_role.
- Arreglado: `?next=` sin validar en `LoginForm.tsx` (`window.location.href = next` → `javascript:` ejecutaba código tras el login) y en `/auth/confirm` (redirección a sitios externos). Ahora pasan por `rutaInternaSegura()` (`src/lib/redireccion.ts`).
- Pendiente (bajo): `/cuenta/registro` sigue abierto aunque la plataforma es privada (registrarse no da acceso a cursos, solo a clases `is_free_intro`); `/api/.../player` entrega la clase gratis incluso sin sesión; `next.config.ts` permite optimizar imágenes de cualquier host https (abuso de cuota); no hay headers CSP/anti-iframe.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
