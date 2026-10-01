# Plan — Plataforma privada del Diplomado (pedidos de Pachi, 2026-10-01)

Fuente: dos mensajes de Pachi (plataforma privada + comunidad y comunicación).
Reemplaza el roadmap de venta de `docs/cursos.md`: aquí **todo es privado**, no hay venta ni página pública.

Regla de producto: el alumno siempre sabe
**qué debe hacer → qué ya completó → qué viene después → dónde preguntar → dónde está la información importante.**

Decisiones tomadas (no se vuelven a preguntar):
- En la interfaz se dice **"Diplomado"** (no "curso"). En código y base de datos sigue `courses` (no se renombra nada).
- El "acceso" sigue siendo una fila `purchases` con `estado='pagado'` y `proveedor_pago='manual'` (ya funciona, RLS ya la usa). La UI nunca dice "compra".
- Varios diplomados por alumno siguen soportados. Si tiene uno solo, nunca ve un selector.
- Notificaciones = solo dentro del campus (contadores). Correo cuando exista Resend.
- Pagos: congelados. `/checkout/*`, `flow.ts` y `/api/webhooks/flow` no se tocan, solo quedan sin links.
- **Nombre: NUTFEM** (Ricardo, 2026-10-01). Ya aplicado en `Logo.tsx`, metadata y mensajes.

---

## 0. Auditoría: qué hay hoy y qué cambia

### Base de datos (migraciones 0001–0007)
| Tabla | Hoy | Problema para "privado" | Cambio |
|---|---|---|---|
| `courses` | SELECT público si `estado='publicado'` | Cualquiera sin sesión lee títulos/descripciones | Solo admin o alumno con acceso (0008) |
| `course_videos` | SELECT público si curso publicado; `vimeo_id` protegido por GRANT de columna ✅ | Temario y `resources` (rutas de archivos) visibles sin sesión; clase gratis pública | Solo admin o con acceso; se elimina el concepto "clase gratis" en la UI (0008) |
| `course_modules` | Igual que `course_videos` | Igual | Igual + `publicado` (0008), `foro_cerrado` (0011) |
| `purchases` | = acceso ✅ | — | Sin cambio |
| `profiles` | role, nombre, email | No hay "desactivado" ni grupo | `activo` (0008), `grupo_id` (0009) |
| `lesson_progress` | policy `for all` con `auth.uid() = user_id` | Un alumno puede escribir progreso de clases sin acceso (menor) | INSERT/UPDATE exige acceso a la clase (0008) |
| `class_questions` | Preguntas por clase, trigger anti-suplantación ✅ | Pachi pide foro **por módulo** | Se migra a `foro_posts` (0011) |
| `leads`, `analytics_events` | INSERT público abierto | Sobra en plataforma privada (embudos fuera de alcance) | Se quita el INSERT anónimo (0008) |

### Código
| Pieza | Qué pasa |
|---|---|
| `src/app/page.tsx` (puerta de entrada) | Pasa a ser **el formulario de login** directo |
| `src/app/cursos/[slug]/page.tsx` + `CourseLanding.tsx` | Landing de venta → se elimina para alumnos. `/cursos/[slug]` pasa a ser "Mi Diplomado". `CourseLanding` solo queda si el admin la usa en preview → se elimina también (preview pasa a "ver como alumna") |
| `/cuenta/registro` + `RegistroForm.tsx` | Se eliminan (solo el admin crea cuentas) → redirige a `/` |
| `/cuenta/olvide-password` | Se mantiene. Mientras no haya Resend: texto "escríbele al equipo" en vez de prometer un correo que no llega |
| `CampusHeader`, `CampusNav`, `SiteHeader`, `AccountMenu`, `PerfilTabs` | Se reemplazan por **menú lateral** (`CampusSidebar`) con las 9 secciones + menú desplegable en celular |
| `/cuenta/(area)/*` | Se mueven al nuevo grupo `src/app/(campus)/`. Rutas viejas → `redirect()` para no romper links guardados |
| `src/app/cursos/[slug]/clase/[n]/page.tsx` | Se queda en su URL, pero dentro del layout del campus. Se quita lógica de "clase gratis" y "sin acceso → comprar" |
| `ClassQuestions.tsx`, `preguntas.ts`, `preguntas/actions.ts` | Se reescriben sobre `foro_posts`; en la clase se ven "Preguntas de esta clase" (posts del foro del módulo ligados a esa clase) |
| `ClassMaterials.tsx`, `recursos.ts`, `MaterialesManager.tsx` | Nuevos tipos: `bibliografia`, `presentacion`, `complementario` (jsonb, sin migración) |
| Admin `usuarios/*` | Lista → **ficha del alumno** (`/admin/alumnos/[id]`): editar, desactivar, eliminar, accesos, progreso, notas, mensaje |
| Admin `ventas/*`, KPIs de ingresos | Se ocultan del menú (no hay venta). Código intacto |
| `CourseForm.tsx` | Se reduce a lo que un diplomado privado usa: título, descripción, portada, estado. Columnas de venta quedan en la BD sin usar |
| 26 archivos llaman `auth.getUser()` (viaje de red cada vez) | Nuevo `src/lib/sesion.ts` con `cache()` de React + `getClaims()` (verificación local ES256): 1 sola lectura de sesión+perfil por request. Se migra cada archivo al tocarlo |
| `proxy.ts` | Además de refrescar sesión: **redirige a `/` toda ruta privada sin sesión** (primera barrera; la segunda sigue siendo RLS + validación en cada página/endpoint) |

### Configuración de Supabase (la hace Ricardo, con guía paso a paso)
- **Desactivar registro público** ("Allow new users to sign up" = off). El admin sigue creando cuentas con `auth.admin.createUser`. [VERIFICAR en docs antes de pedirlo]
- Site URL = `https://pachicursos.vercel.app` (hasta tener dominio).
- Región de Supabase → mover funciones de Vercel a la misma región (velocidad).

---

## Fases

Cada fase: migración (Ricardo la pega en Supabase) → código → lint + marca + build → capturas reales alumno y admin → revisión `curso-platform-reviewer` → registro en `EJECUCION.md` → deploy cuando Ricardo diga "deploy".
Orden de deploy de cada fase: **primero el código compatible, después la migración** (o al revés si la migración solo agrega), para que producción nunca quede rota entre medio.

### Fase 1 — Plataforma cerrada (1 día)
**Migración `0008_plataforma_privada.sql`**
- `profiles.activo boolean not null default true`.
- Función `tiene_acceso(course_id)` (security definer): admin, o compra `pagado` del usuario **y** `profiles.activo`.
- Reescribir SELECT de `courses`, `course_videos`, `course_modules` → `is_admin() or tiene_acceso(id/course_id)`. Sin acceso anónimo.
- `course_modules.publicado`, `course_videos.publicado` (default true) + `grant select` de columnas nuevas. Alumno solo ve publicados.
- `puede_ver_clase()` → usa `tiene_acceso` + `publicado`; sin rama `is_free_intro`.
- `lesson_progress`: separar policies; INSERT/UPDATE con `puede_ver_clase(video_id)`.
- Quitar policies de INSERT público en `leads` y `analytics_events`.
- SQL de prueba incluido (simular anon / alumno sin acceso / alumno con acceso con `set local role` + `request.jwt.claims`) para que Ricardo verifique en el editor.

**Código**
- `src/lib/sesion.ts`: `getSesion()` cacheado → `{ userId, email, perfil: {role, nombre, activo} } | null`; `requireAlumno()`, `requireAdmin()`.
- `proxy.ts`: rutas públicas = `/`, `/cuenta/olvide-password`, `/cuenta/actualizar-password`, `/auth/*`, `/legal/*`, `/checkout/retorno` (congelado). Todo lo demás sin sesión → `/`.
- `src/app/page.tsx` = login (logo, nombre, frase, correo, contraseña, Ingresar, ¿Olvidaste tu contraseña?). Con sesión → `/inicio` (alumno) o `/admin`.
- `LoginForm`: sin link a registro; `next` por defecto `/inicio`. Usuario desactivado → mensaje claro "Tu acceso está desactivado. Escríbele al equipo." (y `signOut`).
- Borrar `cuenta/registro`, `RegistroForm`, `CourseLanding`, landing pública de `/cursos/[slug]`, `SiteHeader` (si queda sin uso).
- Clase: quitar "clase gratis" y "comprar"; sin acceso → `notFound()` (no se revela que existe).
- Endpoints `player` y `recursos`: misma regla (`tiene_acceso`), sin `is_free_intro`.
- Admin `ClaseManager`: quitar el toggle "Gratis".

**Hecho cuando**: sin sesión, cualquier URL de contenido redirige a `/`; las consultas anónimas a `courses/course_videos/course_modules` devuelven 0 filas; capturas de login escritorio + celular.

### Fase 2 — Campus del alumno y menú (2 días)
**Rutas nuevas** (grupo `src/app/(campus)/`, layout con `requireAlumno()` + `CampusSidebar` + contadores):
| Menú | Ruta | Contenido |
|---|---|---|
| Inicio | `/inicio` | Avisos importantes vigentes (máx. 2, plegables) · "Continúa donde quedaste" · Lo que viene (siguiente clase, evaluación pendiente) · Mensajes nuevos |
| Mi Diplomado | `/cursos/[slug]` (o `/diplomado` si tiene 1) | Anillo de progreso general + módulos con % / "No iniciado" / "Completado" |
| Módulos | `/modulos` → `/modulos/[id]` | Clases del módulo, materiales del módulo, evaluación, link a su foro |
| Mi Progreso | `/progreso` | Por módulo: clases completadas, nota de evaluación; historial |
| Evaluaciones | `/evaluaciones` | (Fase 4; antes muestra "Pronto") |
| Comunidad | `/comunidad` | (Fase 5; hoy reusa la página actual) |
| Mis Mensajes | `/mensajes` | (Fase 6) |
| Avisos | `/avisos` | (Fase 7) |
| Mi Perfil | `/perfil` | Nombre, correo, cambiar contraseña, cerrar sesión |
- Redirects: `/cuenta/mis-cursos`→`/inicio`, `/cuenta/comunidad`→`/comunidad`, `/cuenta/perfil|seguridad|actividad`→`/perfil`|`/progreso`.
- `src/lib/progreso.ts`: añadir estado por módulo (`no_iniciado | en_curso | completado`) y "siguiente paso" (clase o evaluación).
- Secciones de fases futuras **no aparecen en el menú** hasta que existan (nada de "Pronto" visible para alumnos).

**Hecho cuando**: capturas de cada pantalla, escritorio y celular, con alumna de prueba con avance parcial.

### Fase 3 — Admin de alumnos y contenidos (2 días)
**Migración `0009_admin_alumnos.sql`**: `grupos(id, nombre, created_at)`, `profiles.grupo_id` (RLS: solo admin gestiona).
- `/admin/alumnos`: lista con búsqueda, grupo, diplomados, % de avance, estado activo/desactivado.
- `/admin/alumnos/[id]` (ficha): editar nombre y correo (`auth.admin.updateUserById` + `profiles`), grupo, accesos (dar/quitar), progreso por módulo, intentos de evaluación (Fase 4), **Enviar mensaje** (Fase 6), **Nueva contraseña**, **Desactivar/Reactivar** (`profiles.activo` + `ban_duration` de Supabase Auth [VERIFICAR docs]), **Eliminar** (confirmación escribiendo el correo; `auth.admin.deleteUser`, cascada borra su avance).
- `/admin/grupos`: crear/renombrar/borrar grupos.
- Contenidos: publicar/despublicar módulo y clase en `ClaseManager`; tipos de material nuevos en `MaterialesManager` (bibliografía con texto de cita + link opcional).
- Menú admin: Resumen · Alumnos · Diplomados · Evaluaciones · Comunidad · Mensajes · Avisos. "Ventas" se oculta.

### Fase 4 — Evaluaciones (2–3 días)
**Migración `0010_evaluaciones.sql`**
- `quizzes(id, course_id, module_id unique, titulo, instrucciones, nota_minima int (%), max_intentos int null, publicado)`.
- `quiz_preguntas(id, quiz_id, orden, enunciado)`; `quiz_opciones(id, pregunta_id, orden, texto, es_correcta)`.
- `es_correcta` **revocada** para `authenticated` (GRANT por columna, igual que `vimeo_id`).
- `quiz_intentos(id, quiz_id, user_id, respuestas jsonb, correctas, total, porcentaje, aprobado, created_at)`.
- RPC `rendir_evaluacion(quiz_id, respuestas jsonb)` security definer: valida acceso, publicado e intentos restantes; corrige; inserta el intento; devuelve resultado. Es la única forma de crear intentos.
- RLS: alumno ve quizzes/preguntas/opciones de módulos con acceso y sus propios intentos; admin todo.

**Código**
- Admin: `/admin/evaluaciones` (lista por diplomado/módulo) y `/admin/evaluaciones/[id]` (editor: preguntas, alternativas, marcar correcta, reordenar, nota mínima, intentos, publicar) y pestaña **Resultados** (por alumno: mejor nota, intentos, aprobado).
- Alumno: `/evaluaciones` (por módulo: pendiente / aprobada con nota / reprobada, intentos restantes), `/evaluaciones/[id]` (una pregunta por bloque, enviar → resultado con correctas/incorrectas), historial en `/progreso`.
- La evaluación aparece en el módulo y como "siguiente paso" al completar sus clases.

### Fase 5 — Foro por módulo (2 días)
**Migración `0011_foros.sql`**
- `foro_posts(id, course_id, module_id null=“General”, video_id null, user_id, parent_id, tipo 'pregunta'|'publicacion', titulo, contenido, autor_nombre, es_equipo, fijado, oculto, created_at, editado_en)`.
- Trigger (como 0007): fija `user_id`, `es_equipo`, `autor_nombre`, `course_id`; rechaza si el foro está cerrado (`course_modules.foro_cerrado`) salvo admin; un nivel de comentarios.
- `fijado`/`oculto`/`foro_cerrado` solo los cambia el admin. Cada alumno borra lo suyo.
- Copia `class_questions` → `foro_posts` (con `video_id` y `module_id` de la clase). `class_questions` queda sin uso (se borra en una migración posterior, cuando todo esté verificado).

**Código**: `/comunidad` (foros de mis módulos con último movimiento), `/comunidad/[moduloId]` (fijados arriba, nueva publicación/pregunta, comentarios). En la clase: "Preguntas de esta clase" = posts del foro con ese `video_id`. Admin `/admin/comunidad`: bandeja sin responder (reemplaza `/admin/preguntas`), fijar, ocultar, eliminar, cerrar/abrir foro.

### Fase 6 — Mis Mensajes (1–2 días)
**Migración `0012_mensajes.sql`**: `mensajes(id, alumno_id, autor_id, es_equipo, contenido, leido_en, created_at)` — una conversación por alumno. Trigger fija `autor_id`/`es_equipo`. RLS: alumno solo su conversación; admin todas. RPC `marcar_mensajes_leidos(alumno_id)`.

**Código**: alumno `/mensajes` (conversación cronológica + responder); admin `/admin/mensajes` (bandeja con no leídos) y desde la ficha del alumno. Contador en el menú lateral y en Inicio (consulta `count` liviana en el layout).

### Fase 7 — Avisos (1–2 días)
**Migración `0013_avisos.sql`**: `avisos(id, titulo, cuerpo, destino 'todos'|'diplomado'|'grupo'|'modulo', course_id, grupo_id, module_id, importante, visible_desde, visible_hasta, created_by, created_at)`, `avisos_leidos(aviso_id, user_id, leido_en)`. Función `aviso_visible_para_mi(aviso)` en la policy (destino + fechas + acceso).

**Código**: admin `/admin/avisos` (crear con destino, importante, fechas; vista previa; lista de vigentes/programados/vencidos). Alumno: `/avisos` (todos los vigentes, no leídos resaltados) + en Inicio máximo 2 importantes no leídos, con "Marcar como leído". Contador en el menú.

**Total aproximado: 11–14 días de trabajo**, publicando fase por fase.

---

## Seguridad (se revisa en cada fase)
- Doble barrera siempre: `proxy.ts` + validación en servidor en cada página/acción/endpoint, y RLS en la base.
- `vimeo_id` y `quiz_opciones.es_correcta` nunca llegan al navegador (GRANT por columna).
- Nombre visible en comunidad = "Nombre I." fijado por trigger; nunca el correo.
- Alumno desactivado: pierde acceso en la base (`tiene_acceso` mira `activo`) aunque su sesión siga abierta.
- Toda consulta Supabase revisa `error` (regla del repo).

## Verificación con sesión
El agente no escribe contraseñas. Para cada fase Ricardo:
1. Crea (una vez) una **alumna de prueba** desde el admin y le da acceso.
2. Inicia sesión en la pestaña de pruebas cuando se pida (alumna o admin).
Las pruebas de RLS se hacen con SQL que Ricardo pega en el editor de Supabase.

## Fuera de alcance (pedido explícito de Pachi)
Tienda, blog, página pública, embudos, ventas, email marketing, automatizaciones, membresías.

## Pendientes de Ricardo
1. ~~Nombre~~ → **NUTFEM** (decidido por Ricardo 2026-10-01).
2. Desactivar registro público y Site URL en Supabase (guía en Fase 1).
3. Región de Supabase (velocidad).
4. Correo/dominio para Resend (recuperar contraseña por correo y avisos por correo, más adelante).
