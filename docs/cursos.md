# Plan: Plataforma de Cursos — Alimenta Tu Fertilidad

> Documento de planificación únicamente. No se crea código, repo ni carpetas todavía — esto es el entregable.
>
> **Estado: plan completo y listo para ejecutar Parte A.** Quedan 5 puntos abiertos, explícitamente diferidos porque no bloquean el arranque — se resuelven más adelante, cada uno cuando el roadmap llegue a la Parte que lo necesita: nombre del subdominio (antes de Parte A/G), si se replica el menú del sitio principal (antes del mockup), si habrá bundles a futuro (no bloquea nada, el modelo ya lo soporta), comunidad/acompañamiento (decisión de negocio sin definir, no se construye en v1), y proveedor de facturación electrónica para conectar a n8n (antes de Parte H). Ver "Checklist de verificación antes de ejecutar" para el resto de detalles ya resueltos.

## Contexto

Alimenta Tu Fertilidad **ya existe** como marca: sitio en `www.alimentatufertilidad.com` (incluye una página `/curso-online` vendiendo un curso), cuenta de Instagram `@alimentatufertilidad` ("Nutrición femenina | Salud Menstrual & Fertilidad", ~20K seguidores), fundada por Marcela Calderón, nutricionista clínica especializada en fertilidad femenina. Esto **no es un lanzamiento de marca desde cero** — es construir/mejorar la entrega de cursos en video como un subdominio propio (`cursos.alimentatufertilidad.com` o similar) que se sienta parte del sitio principal.

[Resuelto]: Ricardo compartió un archivo de referencia de marca (`nutfem2027PRUEBAfondoclaro.html`, de Academia NUTFEM 2026/2027, también a cargo de Marcela) del que se extrajo paleta de colores y tipografía exacta, y **confirmó que se usa tal cual para Alimenta Tu Fertilidad** — ver sección "Sistema visual de marca" más abajo. Ya no es un punto pendiente.

**Boleta electrónica (SII) — qué es exactamente**: en Chile, vender un producto o servicio (incluido un curso online) obliga por ley a emitir un documento tributario (boleta o factura electrónica) por cada venta ante el SII (Servicio de Impuestos Internos). No es un "nice to have" técnico, es una obligación tributaria de quien vende — es decir, de Marcela/el negocio, no de la plataforma en sí. Flow.cl no la emite automáticamente, hay que conectarla aparte. **Decisión tomada**: se resuelve al final del proyecto como automatización en n8n (ver Parte H), *después* del lanzamiento de ventas (Parte F/G) — esto significa que el negocio va a vender sin emitir boleta automática durante ese período intermedio. Es una decisión consciente de priorizar velocidad de lanzamiento; Marcela debería tener claro que ese período expone al negocio a operar fuera de la norma tributaria hasta que la Parte H esté lista, y puede resolverlo manualmente (boletas manuales) mientras tanto si lo prefiere.

Cada curso tiene landing page pública, la primera clase es gratis (intro/anzuelo), el resto se bloquea hasta compra individual de ese curso (no membresía — confirmado). Mercado principal: Chile.

Este repo actual (`test` / "esgamingpc") es un proyecto no relacionado (catálogo de PCs/monitores gaming) — no se toca. Este plan se ejecuta en un proyecto propio, por partes, cuando se decida arrancar.

## Investigación: SaaS todo-en-uno vs. build propio

- **Hotmart**: sin mensualidad, ~10–20% comisión efectiva por venta, ya integrado con medios de pago LATAM. Rápido para validar sin dev.
- **Teachable / Thinkific**: cuota mensual fija (US$36+/mes), sin comisión por venta, pero pasarela propia con poca cobertura en Chile → terminas dependiendo de Stripe igual.
- **Build propio (elegido)**: control total de marca/dominio, sin comisión de plataforma (solo ~3% de la pasarela de pago), pero requiere desarrollo propio. Dado que ya existe una marca con tráfico (20K en Instagram) y se quiere integración visual fina con el sitio principal, se justifica el build propio. Hotmart queda documentado como canal de distribución adicional posible a futuro, no excluyente.

## Investigación: Vimeo

- Restricción de embed por dominio ("domain-level privacy") disponible desde el plan **Standard** (~US$25/mes anual) — el video solo reproduce en `cursos.alimentatufertilidad.com`.
- El video no debe quedar embebido de forma estática y pública: se debe pedir el embed a la **API de Vimeo desde el servidor**, en cada carga de la clase, validando primero si el usuario tiene acceso (compra pagada o clase gratuita). Así el link real de Vimeo nunca se expone en el HTML a quien no pagó.
- Si alguien entra directo a la URL de una clase paga sin pasar por la landing (ej. link compartido), el servidor debe redirigir a login conservando la URL de retorno, y tras loguearse volver a validar acceso — nunca mostrar solo un error genérico.
- **Subida de video sin pasar por nuestro servidor**: Vimeo soporta el protocolo **TUS** (subida reanudable por chunks) directo desde el navegador del admin hacia los servidores de Vimeo. El admin arrastra el archivo en nuestro sitio y el archivo viaja directo browser → Vimeo (nunca pasa por las funciones serverless de Vercel). Nuestro backend solo pide a Vimeo una URL de subida firmada (validando server-side que quien la pide tiene `role = admin`, no solo sesión activa) y guarda el `vimeo_id` resultante. Hay que agregar el subdominio a la whitelist CORS de Vimeo para permitir la subida directa desde el navegador, y manejar la expiración del ticket de subida si el admin deja una subida grande a medio camino (reanudar al recargar, no reiniciar desde cero).
- Después de subir, Vimeo **procesa** el video antes de que esté listo para reproducir (transcoding) — la clase debe mostrar un estado `subiendo → procesando → listo`, y el curso no debe poder publicarse con una clase todavía en "procesando".
- **[Corrección 2026-09-11, encontrada al implementar la Parte D]**: el plan original decía que la transición `procesando → listo` se detecta "con el webhook de Vimeo para eventos de transcoding, con polling como respaldo". Eso es incorrecto — **Vimeo no tiene un webhook de fin de transcoding** (limitación documentada y confirmada por Vimeo mismo en múltiples issues abiertos de sus SDKs oficiales desde hace años, nunca resuelta). El campo real a consultar es `transcode.status` en la respuesta de `GET /videos/{id}`. **Polling es el único mecanismo real, no un respaldo.** Queda pendiente decidir el diseño exacto del polling (ver EJECUCION.md) antes de escribir el código de la Parte D.
- El `vimeo_id` de cada clase **nunca se consulta directo desde el cliente** (RLS de Supabase protege filas, no columnas específicas) — siempre se obtiene a través del endpoint server-side que valida acceso antes de pedirlo a la API de Vimeo.
- Vimeo OTT (venta nativa, plan Advanced) **no se necesita** — nosotros manejamos el pago y el "gate" de acceso; Vimeo solo aloja y sirve el video.
- [VERIFY]: confirmar plan y precio vigente al momento de contratar (los precios de Vimeo cambian).

## Investigación: Pagos en Chile

- **Webpay Plus (Transbank) directo**: más trabajo de integración/certificación.
- **Flow.cl**: agrega Webpay, Mach, Onepay, Servipag bajo **una sola API REST**, con pago único (lo que necesitamos) y webhooks. **Elegido como pasarela principal** por menor esfuerzo manteniendo la confianza local de Webpay.
- **Stripe**: respaldo para tarjetas internacionales.
- Los webhooks de ambas pasarelas deben **verificarse por firma** antes de marcar una compra como pagada (evita que un POST falsificado otorgue acceso gratis), y deben ser **idempotentes**: un mismo webhook reintentado (Flow/Stripe reintentan si no reciben 200) no debe duplicar ni corromper el registro de compra.
- **Pago en cuotas**: Webpay (vía Flow.cl) soporta cuotas sin interés con tarjeta de crédito, algo casi estándar en e-commerce chileno y una palanca de conversión real para un ticket de curso. Se habilita en la configuración del comercio en Flow.cl, no requiere desarrollo adicional en el checkout — solo activarlo. Se confirma como requisito de la Parte F.

## Investigación: UX de administración de cursos (cómo lo resuelven otras plataformas)

- **Thinkific/Kajabi**: constructor de curso con módulos/clases arrastrables (drag-and-drop) para reordenar, "clonar" secciones/lecciones desde otro curso, y plantillas de landing reutilizables donde el creador solo cambia textos/imágenes, no la estructura.
- Patrón que adoptamos, simplificado a nuestra escala: **una sola plantilla de landing** parametrizada por curso, más un **gestor de clases con reordenamiento drag-and-drop** y **subida de video directa vía TUS**. Esto evita construir un CMS/editor visual completo y da un formulario estructurado que cualquier persona no técnica puede llenar en minutos.

## Arquitectura recomendada

- **Frontend/Backend**: Next.js (App Router) en Vercel — SSR para SEO en landing pages.
- **Base de datos + Auth**: Supabase (Postgres + Auth + Row Level Security), con roles (`admin` / `alumno`) en una tabla `profiles`.
- **Video**: Vimeo (plan Standard+), privado + restricción por dominio, subida vía TUS desde el panel admin, entrega vía API server-side.
- **Pagos**: Flow.cl (principal, con cuotas habilitadas) + Stripe (secundario).
- **Hosting**: Vercel, proyecto propio en el subdominio, DNS CNAME.
- **Email transaccional**: Resend (se integra simple con Next.js/Vercel, buen nivel gratuito) — envía confirmación de compra, aviso de venta a Marcela, bienvenida al curso, recuperación de contraseña la maneja Supabase Auth aparte.
- **Automatizaciones**: n8n — conecta eventos de la plataforma (pagos, progreso de curso) con boleta electrónica y emails de ciclo de vida que no son transaccionales inmediatos (ver Parte H).
- **Marketing/adquisición**: Meta Pixel + Conversions API en landing y checkout, para medir y poder hacer retargeting a quien no compró (ver "Marketing y adquisición" más abajo).
- **Idioma**: 100% español en todo — UI, emails, errores, checkout.

## Modelo de datos (alto nivel)

- `profiles`: id (= auth.users.id), nombre, `role` (`admin` | `alumno`).
- `courses`: id, slug, título, subtítulo corto, **promesa principal** (la transformación que ofrece, ej. "Regula tu ciclo en 8 semanas"), descripción, precio (CLP), `precio_original` (opcional, para mostrar descuento tachado), estado (`borrador` | `publicado` | `despublicado` | `archivado`), `cover_image_url`, `background_image_url`, `accent_color`, `para_quien_es` / `para_quien_no_es` (texto corto), `que_vas_a_aprender` (lista de bullets), `requisitos` (texto), `faq` (lista pregunta/respuesta), `testimonios` (lista, opcional), `seo_titulo`, `seo_descripcion`, `seo_og_image`. No todos estos campos necesitan estar en el formulario admin de la v1 (algunos pueden ser texto libre simple al principio), pero se modelan desde ahora para no terminar hardcodeando contenido de venta en el código. **Sin campo de garantía/reembolso**: política del negocio es sin reembolsos (ver checklist) — no se ofrece garantía en la landing, así que no hace falta modelarla.
- `leads`: email, `course_id` (a qué curso llegó), utm_source/medium/campaign/content, `captured_at`. Se captura de forma opcional (no bloqueante) después de que alguien ve la clase gratis, para no perder a quien mira pero no compra. Alimenta las automatizaciones de re-enganche de la Parte H.
- `course_videos`: id, course_id, orden, título, vimeo_id, `is_free_intro` (bool — **0 o 1 por curso**, no exactamente 1: no conviene hardcodear en la base de datos una decisión de marketing que puede cambiar por curso; el índice único parcial por `course_id WHERE is_free_intro` sigue blindando que nunca haya más de 1, pero permite 0. La regla de negocio actual para el lanzamiento sigue siendo "siempre 1 clase gratis por curso" — eso se aplica como default en el formulario admin, no como restricción rígida de esquema), duración, `estado_procesamiento` (subiendo/procesando/listo), `resources` (lista opcional de archivos descargables, PDFs/guías — alojados en **Supabase Storage**, no en Vimeo que es solo para video). Restricción `UNIQUE(course_id, orden)` para evitar colisiones de orden en el drag-and-drop; índice en `course_id` (consulta que corre en cada carga de clase).
- `purchases`: id, user_id, course_id, monto, moneda, proveedor_pago (`flow` | `stripe` | `manual`), id_transacción (NULL si es acceso otorgado manualmente), estado (pendiente/pagado/fallido/**reembolsado**/**revocado**), `otorgado_por` (id de admin, solo si `proveedor_pago = manual`, para auditoría), fecha. `revocado` es distinto de `reembolsado`: se usa cuando el admin quita un acceso (cortesía retirada, o acceso pagado revocado) sin que haya devolución de dinero de por medio — `reembolsado` implica que sí hubo devolución. Ambos estados quitan el acceso (dejan de cumplir `estado='pagado'`), solo cambia el significado para auditoría/reportes. Restricción `UNIQUE(proveedor_pago, id_transacción)` para idempotencia de webhooks; índice único parcial `(user_id, course_id) WHERE estado='pagado'` para evitar doble cobro del mismo curso; índice en `(user_id, course_id)` (consulta de validación de acceso). El `user_id` se guarda en el registro de la compra desde que se inicia el checkout (creando la fila en estado "pendiente" con un ID interno propio que se envía a Flow/Stripe como referencia de orden), para que el webhook sepa exactamente qué compra actualizar sin depender de que la sesión del navegador siga viva ni de buscar por `user_id+course_id` (ambiguo si hay reintentos).
- `payment_webhook_events`: log crudo de cada webhook recibido (payload, firma, timestamp, procesado) — para auditar o reproducir pagos fallidos/disputados.
- `video_notes`: id, user_id, video_id, contenido (texto libre), actualizado_en, borrado en cascada si se borra la clase o el curso. Decisión consciente de alcance: **una nota por alumno por clase, que se sobrescribe** (no un log con timestamps del video, no exportable por ahora) — el copy de la UI (botón, placeholder, nombre de la sección) queda abierto para definir en el mockup, no se fija texto aquí. El admin ve un aviso ("esto también borrará las notas de tus alumnos") al borrar una clase o curso.
- `lesson_progress`: user_id, video_id, `progress_seconds`, `completed` (bool), actualizado_en. Permite mostrar "continúa donde quedaste" en Mis Cursos y el % de avance del curso (calculado en el momento: clases completadas / total de clases — no hace falta una tabla `course_progress` separada, sería redundante).
- `analytics_events`: tabla liviana de eventos de funnel (no un data warehouse): `evento` (landing_viewed, free_class_watched, checkout_started, purchase_completed, etc.), `user_id` (opcional, puede ser anónimo), `course_id`, `utm_source`/`utm_medium`/`utm_campaign`/`utm_content` (capturados en la primera visita y guardados en cookie/localStorage, se adjuntan al evento y a la compra), `timestamp`. Se complementa con Vercel Analytics para métricas de tráfico general — esta tabla es solo para el funnel específico del curso.
- Acceso a un video = `is_free_intro = true` **O** existe `purchase` con estado pagado del user para ese curso. Se valida con RLS en Supabase y de nuevo en el endpoint que llama a la API de Vimeo (doble validación, nunca confiar solo en el cliente).

## Flujo de compra y acceso

1. Landing del curso (pública, SEO) → clase 1 gratis sin login. Al terminar (o al pausar) la clase gratis, aparece una captura de email **opcional, no bloqueante** ("déjanos tu email y te avisamos de nuevas clases/cursos") — se guarda en `leads`, con el objetivo de no perder a quien miró pero todavía no está listo para comprar.
2. Clase 2+ → requiere cuenta (email/password o magic link, Supabase Auth; incluye el flujo estándar de "olvidé mi contraseña"). Si se entra directo a una URL de clase paga sin login, redirige a login conservando la URL de retorno.
3. "Comprar curso" → checkout Flow.cl (o Stripe) → pago único CLP. Si el pago es rechazado o el alumno abandona el checkout, vuelve a una pantalla clara con botón "Reintentar pago" (no un error genérico).
4. Webhook (verificado por firma, procesado de forma idempotente) confirma pago → backend inserta `purchase` pagada, usando el `user_id` guardado al iniciar el checkout (no depende de que la sesión del navegador siga viva al volver de la pasarela).
5. Pantalla de confirmación de compra ("gracias por tu compra") + email transaccional al alumno (vía Resend), **más un segundo email de bienvenida al curso** (cómo empezar, qué esperar, link directo a "Mis cursos") — ambos inmediatos, no son parte de la automatización de la Parte H. Y **aviso por email a Marcela de que hubo una venta** (curso, monto, alumno).
6. Página de clase vuelve a chequear acceso → si hay compra pagada, pide a la API de Vimeo el embed y lo entrega al reproductor.
7. El alumno tiene una pantalla **"Mis cursos"** (dashboard) con los cursos que compró y su **% de avance** (calculado desde `lesson_progress`), con un botón "Continuar" que lo lleva directo a la última clase que estaba viendo — no solo una lista de cursos comprados. Si un curso comprado se despublica después, sigue apareciendo normal ahí y en su reproductor (sin candado ni aviso de error) — solo desaparece de la landing pública para nuevas ventas.

**Fuera de alcance (decisión consciente)**: no se controla que una cuenta se comparta entre varias personas ni límite de dispositivos/sesiones simultáneas — no es objetivo del MVP.

## Panel de administración

Pensado para alguien **no técnico** (ej. Marcela o su equipo), sin tocar código ni entrar a Vimeo directamente:

- **Login admin**: mismo sistema de auth, con `role = admin` en `profiles`.
- **Lista de cursos**: ver todos los cursos (borrador/publicado), crear uno nuevo.
- **Crear/editar curso**: formulario con título, descripción (rich text simple), precio, imagen de portada, imagen de fondo de la landing — **usa siempre la plantilla base**, no un editor libre.
- **Gestor de clases**: agregar clase (título + orden), marcar cuál es la gratuita (una sola, forzado por validación), reordenar por drag-and-drop, adjuntar recursos descargables opcionales (PDF/guías).
- **Subida de video**: arrastrar el archivo → validación de formato/tamaño antes de subir con mensaje de error claro en español → sube directo a Vimeo vía TUS con barra de progreso (reanudable si se corta a medio camino) → estado visible `subiendo → procesando → listo`. El botón "Publicar curso" queda bloqueado mientras alguna clase esté en "procesando". El admin nunca necesita abrir Vimeo.com.
- **Acciones destructivas** (borrar clase/curso, despublicar): piden confirmación explícita. Despublicar un curso **no** quita el acceso a quien ya lo compró — solo lo oculta de la landing pública para nuevas ventas.
- **Otorgar/revocar acceso manual**: el admin puede dar acceso a un curso a un alumno específico sin pago (cortesía, con email de aviso al alumno igual que una compra normal) o quitárselo. Otorgar queda registrado como compra con `proveedor_pago = manual` y el admin que lo otorgó, para auditoría. Al quitar acceso, el admin elige entre dos botones distintos — **"Revocar" (estado `revocado`, sin devolución de dinero)** o **"Marcar como reembolsado" (estado `reembolsado`, cuando sí se devolvió la plata)** — la interfaz deja explícito que ninguno de los dos devuelve el dinero automáticamente: **la devolución real (si aplica) se hace aparte, manualmente, en el panel de Flow.cl o Stripe**, esto solo actualiza el acceso en el sistema.
- **Reemplazar el video de una clase ya publicada**: se puede subir un video nuevo para reemplazar el actual de una clase existente (mismo flujo de subida vía TUS) sin borrar la clase — borrar la clase eliminaría también las notas personales de los alumnos.
- **Principio de versionado**: si Marcela edita un curso después de que ya hay compradores (cambia una clase, el precio, el currículum), **los compradores existentes nunca pierden acceso** al contenido actualizado — mismo principio ya aplicado a "reemplazar video sin borrar la clase", extendido a todo el curso. No se avisa ni se pide confirmación especial para ediciones menores; solo las acciones destructivas (borrar) piden confirmación, como ya está definido arriba.
- **Vista previa antes de publicar**: al crear/editar un curso, el admin puede ver exactamente cómo se va a ver la landing pública antes de publicarla (mismo componente de landing, en modo preview).
- **Indicador de completitud**: mientras se arma el curso, el panel muestra qué falta (ej. "✓ Título, ✓ Precio, ✓ 6 clases, ⚠ Falta descripción SEO, ⚠ Falta FAQ") — así el admin ve de un vistazo qué le falta antes de publicar, en vez de descubrir errores después. Solo bloquea la publicación por lo estrictamente necesario (título, precio, al menos 1 clase, video de cada clase listo) — el resto (FAQ, testimonios, SEO) son advertencias, no bloqueos.
- **Ventas/alumnos**: lista simple de quién compró qué curso y cuándo (incluye los accesos otorgados manualmente), para que Marcela tenga su historial de ventas sin salir al panel de Flow.cl.
- Una feature de **asistente de IA dentro de este panel** (ej. "describe tu curso y te arma la landing") queda anotada como mejora futura post-lanzamiento — **fuera de alcance de este plan**, confirmado con el usuario.

**Explícitamente fuera de alcance de la v1 (decidido con Ricardo), pero con la base de datos preparada para agregarlo después sin rehacer nada:**
- **Cupones/descuentos**: no se construye motor de cupones ahora (agrega complejidad real al checkout). `purchases` ya guarda el monto efectivamente pagado, así que agregar cupones después no requiere cambiar lo ya construido.
- **Dashboard de ingresos/conversión** (ingresos por curso/mes, tasa de conversión, etc.): no se construye ahora — no interesa por el momento. `analytics_events` y `purchases` ya quedan guardando los datos crudos, así que un dashboard se puede armar después sin re-instrumentar nada.
- **Upsell/recomendación de otro curso al terminar uno**: no se necesita por ahora.
- **Comunidad/acompañamiento entre alumnos** (grupo cerrado, Q&A en vivo, etc.): queda como decisión de negocio pendiente, sin definir aún — no bloquea ni se construye en esta versión.

## Plantilla de landing reutilizable

**No se diseña cada landing desde cero.** Se construye **un solo componente de landing parametrizado** (Next.js) que recibe los datos de `courses` (ver Modelo de datos) y arma siempre las mismas secciones, en el mismo orden — lo único que cambia por curso es el contenido. La estructura queda fija para mantener consistencia visual y ahorrar desarrollo.

**Secciones de la landing (orden fijo, pensado para vender, no solo para informar):**

1. Hero: promesa principal + imagen + CTA.
2. Para quién es / para quién no es.
3. Clase gratis embebida (la clase 1, para que prueben antes de comprar).
4. Qué vas a aprender (lista de beneficios/resultados).
5. Curriculum: lista de clases con duración (bloqueadas visualmente salvo la gratis).
6. Autoridad/instructor: quién es Marcela, por qué confiar. **Esto NO es un campo por curso** — es contenido fijo/compartido de marca (bio, foto, credenciales de Marcela) que vive directamente en el componente de landing, igual en todos los cursos, porque siempre es la misma instructora. Si en el futuro hay más de un instructor, ahí sí se modela como campo de `courses`.
7. Testimonios (si existen — opcional, no bloquea el lanzamiento si no hay aún).
8. Precio + CTA de compra. **Sin sección de garantía/reembolso** — política del negocio es sin reembolsos (ver checklist), así que no se promete nada que después haya que sostener.
9. FAQ.
10. CTA final.

Todas estas secciones se renderizan a partir de los campos del curso — si un curso no tiene testimonios cargados, esa sección simplemente no se muestra (no es obligatorio llenar todo para publicar, salvo lo que marque el indicador de completitud del admin — ver Panel de administración).

## Sistema visual de marca (extraído del archivo de referencia)

Extraído de `nutfem2027PRUEBAfondoclaro.html` (landing de Academia NUTFEM 2026/2027, también a cargo de Marcela). **Confirmado por Ricardo: esta paleta y tipografía se usan para Alimenta Tu Fertilidad.**

**Colores:**
| Nombre | Hex | Uso |
|---|---|---|
| `--vino` | `#4E0F26` | Color principal — títulos, botones |
| `--vino-osc` | `#380A1B` | Vino oscuro — hover/énfasis |
| `--vino-claro` | `#7A1533` | Vino claro — hover de botones |
| `--carmin` | `#C31C44` | Acento — labels "eyebrow", links activos, detalles |
| `--dorado` | `#E8C9A8` | Beige dorado — detalles decorativos |
| `--dorado-osc` | `#EF5950` | Coral/rojo — acento secundario |
| `--crema` | `#FFFFFF` | Fondo base |
| `--crema-2` | `#FDF7F8` | Fondo secundario, casi blanco |
| `--rosa` | `#FBE7EB` | Rosa suave — fondos de sección/chips |
| `--tinta` | `#3B1420` | Texto principal |
| `--tinta-suave` | `#8A5C68` | Texto secundario/descripciones |
| `--linea` | `#EFD6DC` | Bordes/separadores sutiles |

**Tipografía** (Google Fonts): **Lato** para texto de cuerpo (17px, line-height 1.7); **Noto Serif** para títulos y énfasis elegante (itálica en frases destacadas); **Poppins** para labels en mayúscula ("eyebrow"), botones, navegación y UI.

**Estilo**: botones tipo píldora (`border-radius:999px`), tarjetas/fotos con esquinas redondeadas (18px) y sombra suave con tinte vino (`rgba(78,15,38,.13)`), fotografía tratada con saturación/contraste unificados, nav superior fijo con blur al hacer scroll, labels en mayúscula con letter-spacing amplio en color carmín. Estética general: elegante, cálida, femenina — no clínica/fría.

El archivo también trae el isotipo/logo embebido (imagen en la clase `.brand-mark`) — se reutiliza tal cual para el header del subdominio de cursos.

## Consistencia visual con el dominio principal

El subdominio debe sentirse "parte de" `alimentatufertilidad.com`, con un cambio leve al entrar desde el link de "Cursos" del sitio principal:

- Mismo logo, misma paleta de colores, misma tipografía — **ya confirmado y extraído**, ver "Sistema visual de marca" más arriba. No es un punto pendiente.
- Header con el logo enlazando de vuelta al dominio raíz, y un link visible tipo "Volver al sitio principal". A definir en el mockup si se replica el menú completo del sitio principal o solo header/footer de marca (por defecto: header/footer de marca compartidos, sin replicar todo el menú, para no duplicar mantenimiento).

## Marketing y adquisición (Pixel + retargeting)

Instrumentación para poder hacer publicidad pagada de retorno (retargeting) a quien vio la landing/clase gratis y no compró — muy relevante dado que el canal de crecimiento es Instagram con tráfico mayormente frío:

- **Meta Pixel + Conversions API** instalado en landing, clase, checkout y confirmación de compra.
- Eventos estándar disparados: `ViewContent` (landing vista), `Lead` (captura de email o cuenta creada), `InitiateCheckout` (empieza el pago), `Purchase` (pago confirmado, en el webhook).
- Con eso, Marcela puede crear en Meta Ads Manager una audiencia de "vio la landing pero no compró" y correr campañas de retargeting — la construcción/gestión de esas campañas de publicidad es trabajo de marketing aparte, no algo que este plan construya, solo deja la instrumentación técnica lista.
- Requiere una cuenta de Meta Business y un Pixel ID — se agrega a la lista de cuentas técnicas a crear.

## Mockup visual (ya creado)

**Canvas publicado**: https://claude.ai/code/artifact/0a2ff001-8d98-45d8-9763-e61d9b6eeea8 — 5 artboards con el sistema visual de marca aplicado (vino/carmín/crema, Lato + Noto Serif + Poppins, botones píldora, tarjetas con sombra tinte vino). Es la referencia visual para Parte C; no reemplaza el desarrollo, pero fija las decisiones de layout y estilo que abajo se dejan documentadas para que no se re-discutan al construir:

- **Landing del curso — desktop**: las 10 secciones de venta en orden (ver "Plantilla de landing reutilizable"), con un curso de ejemplo ("Regula tu Ciclo, Recupera tu Fertilidad") para mostrar cómo se ve con contenido real cargado.
- **Landing del curso — mobile**: versión condensada (hero, clase gratis, curriculum resumido, precio+CTA) — confirma que el layout funciona a ancho de teléfono, no duplica las 10 secciones completas.
- **Reproductor de clase**: un solo artboard con dos toggles de estado — clase gratis/bloqueada (candado + CTA "Comprar curso" sobre fondo oscurecido cuando está bloqueada) y modo normal/maximizado — más la sección de notas personales debajo, con el copy de placeholder "Escribe aquí lo que quieras recordar de esta clase&hellip;" (sigue abierto para ajustar, como ya estaba definido).
- **"Mis cursos"**: card por curso con barra de progreso, % de avance, botón "Continuar", y tratamiento distinto para un curso 100% completado ("Repasar" en vez de "Continuar").
- **Panel admin — editar curso**: formulario + gestor de clases (con estados "Listo" / "Procesando" / "Subiendo" por clase) + panel lateral de indicador de completitud (checks en vino para lo resuelto, advertencia en ámbar para lo opcional pendiente).

**Convenciones que salieron de construir el mockup, ahora parte del estándar del proyecto**:
- Cualquier dato real que no existe todavía (precio, testimonios) se muestra como placeholder visiblemente marcado (`[PRECIO]`, "[Testimonio de ejemplo]") — nunca se inventa un dato como si fuera real.
- Los íconos son siempre SVG en trazo (stroke), nunca emoji ni glifos — se mantiene también en el código final, no solo en el mockup.
- Los colores usados en pantalla se limitan a los 12 tokens de "Sistema visual de marca" — no se agregan colores nuevos (ej. un verde/rojo semáforo de éxito/error): los estados positivos usan `--vino`/`--vino-claro`/`--carmin` de la misma paleta.

Pantallas que quedan fuera del mockup por ser más simples/estándar (login, confirmación de compra, pago rechazado, páginas legales, ventas/alumnos) — se construyen directo en desarrollo sin necesitar mockup previo, siguiendo el mismo sistema visual.

## Subagente de Claude Code para el proceso de construcción

Esto es una **herramienta de desarrollo**, no una feature que vea el cliente final. Se define un subagente especializado (vive en `.claude/agents/curso-platform-reviewer.md` del repo del proyecto) cuyo rol es revisar cada Parte del roadmap antes de marcarla como terminada, chequeando puntualmente:

- Que el acceso a video pagado esté validado server-side (nunca solo en el cliente), incluyendo el caso de entrar directo a la URL de una clase.
- Que los webhooks de pago verifiquen firma y sean idempotentes.
- Que la landing use la plantilla compartida y no un diseño ad-hoc.
- Que la parte cumpla su criterio de "hecho" (ver roadmap) antes de continuar a la siguiente.

**Cómo se invoca**: al cerrar cada Parte, la sesión de Claude Code que está ejecutando debe invocar este subagente automáticamente (definido como regla en `CLAUDE.md`, no opcional). Si el subagente encuentra un problema bloqueante, la Parte **no** se marca como completada en `EJECUCION.md`: se registra el rechazo y el motivo, se corrige, y se vuelve a pedir revisión antes de avanzar.

## Estructura de carpetas propuesta (para cuando se cree el repo)

```
alimenta-tu-fertilidad-cursos/
  CLAUDE.md                     # reglas de ejecución por partes (ver abajo)
  EJECUCION.md                  # registro de partes completadas
  .claude/agents/
    curso-platform-reviewer.md  # subagente revisor de partes
  src/
    app/
      (marketing)/               # home, landing de marca
      cursos/[slug]/              # landing pública del curso (plantilla)
      cursos/[slug]/clase/[n]/    # reproductor (protegido) + notas personales
      cuenta/                     # login, registro, "mis cursos"
      checkout/                   # flujo de pago + confirmación
      legal/                     # términos, privacidad, cookies
      admin/
        cursos/                   # lista + crear/editar curso
        cursos/[id]/clases/       # gestor de clases + subida de video
        cursos/[id]/accesos/      # otorgar/revocar acceso manual
        ventas/                   # historial simple de ventas/alumnos
      api/
        webhooks/flow/
        webhooks/stripe/
        vimeo/upload-url/         # genera URL de subida TUS (valida role=admin)
        courses/[slug]/videos/[id]/player/   # entrega embed validado server-side
    components/
    lib/
      supabase/
      vimeo/
      payments/
      email/                     # Resend
      pixel/                     # Meta Pixel + Conversions API
  supabase/migrations/
  docs/                           # documentos de planificación como este
```

## Todo lo necesario para crear `CLAUDE.md`, `EJECUCION.md` y el subagente revisor

**Todo está en este único documento.** Las tres piezas de abajo (`CLAUDE.md`, `EJECUCION.md`, el subagente) son contenido a copiar tal cual a esos archivos recién en la Parte A, cuando se cree el repo — hasta entonces viven acá, dentro de `cursos.md`, no como archivos sueltos.

### Contenido exacto para `CLAUDE.md` (raíz del repo)

```markdown
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
```

### Contenido exacto para `EJECUCION.md` (raíz del repo, se crea vacío con esta base)

```markdown
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

## Estado actual: sin empezar

Ninguna Parte se ha iniciado todavía. La próxima sesión que trabaje en este repo debe empezar por la **Parte A — Setup de cuentas/infra**, siguiendo `docs/cursos.md` y las reglas de `CLAUDE.md`.

---

(el registro de eventos empieza acá — cada línea nueva se agrega debajo, nunca se edita una existente)
```

### Contenido exacto para `.claude/agents/curso-platform-reviewer.md`

```markdown
---
name: curso-platform-reviewer
description: Revisa cada Parte del roadmap de la plataforma de cursos de Alimenta Tu Fertilidad (ver docs/cursos.md) antes de que se marque como completada en EJECUCION.md. Se invoca obligatoriamente al cerrar cualquier Parte A–H, nunca opcional.
---

Eres el revisor de cierre de cada Parte del roadmap descrito en `docs/cursos.md`. Tu trabajo es decidir si una Parte realmente cumple su criterio de "hecho" antes de que la sesión que te invocó la marque como completada en `EJECUCION.md`.

## Al ser invocado

1. Lee `docs/cursos.md` completo, en particular la sección de la Parte que se está cerrando y su criterio de *"Hecho (técnico)"*.
2. Revisa el código/cambios hechos para esa Parte contra ese criterio, punto por punto — no contra tu propia idea de lo que "debería" tener, solo contra lo que el documento pide para esa Parte específica.
3. Chequea siempre, sin importar cuál Parte se esté cerrando (son reglas transversales del proyecto, definidas en `CLAUDE.md`):
   - Que el acceso a video pagado esté validado server-side (nunca solo en el cliente), incluyendo el caso de entrar directo a la URL de una clase.
   - Que los webhooks de pago (si esta Parte los toca) verifiquen firma y sean idempotentes.
   - Que la landing use la plantilla compartida y no un diseño ad-hoc.
   - Que no haya ningún secreto/credencial expuesto en código versionado o en el cliente.
   - Que la interfaz esté 100% en español.
4. Da un veredicto claro: **aprobado** o **rechazado**, con motivo concreto y accionable si rechaza — nunca un rechazo vago tipo "podría mejorarse".
5. No edites tú `EJECUCION.md` — eso lo hace la sesión que te invocó, según tu veredicto (aprobado → se agrega la línea `✅`; rechazado → se agrega la línea `❌` con el motivo, se corrige, y se te vuelve a invocar).

## Qué NO hacer

- No hagas perfeccionismo: el objetivo es que el criterio de "hecho" de esa Parte puntual se cumpla, no una auditoría exhaustiva de todo el código del repo.
- No rechaces por cosas fuera del alcance de la Parte actual (eso ya se definió en la planificación — si algo quedó fuera de alcance a propósito, no es motivo de rechazo).
- No inventes requisitos que no están en `docs/cursos.md`.
```

## Roadmap de ejecución por partes

Cada Parte tiene un criterio de "hecho" técnico (verificable por desarrollo) y uno en lenguaje llano (verificable por Marcela sin conocimientos técnicos), salvo donde ya es autoevidente.

- **Parte A — Setup de cuentas/infra**: cuenta Vimeo (Standard+) con sus credenciales de API, proyecto Supabase, proyecto Vercel + DNS del subdominio (nombre definitivo: `cursos.alimentatufertilidad.com` — se fija ahora para poder configurar DNS y la restricción de dominio de Vimeo; cambiarlo después es posible pero hay que partir con un nombre concreto), cuenta Resend (email), y **se inicia el trámite de la cuenta de comercio en Flow.cl** (RUT, cuenta bancaria, verificación — puede tardar días/semanas, así que se arranca ya aunque las credenciales recién se usen en la Parte F).
  *Hecho (técnico)*: las 4 cuentas técnicas existen y las credenciales están en variables de entorno de Vercel; el trámite de Flow.cl está iniciado (no necesariamente aprobado todavía).
  *Hecho (Marcela)*: puede entrar a cada una de las 4 plataformas con sus propias credenciales, y ya mandó la solicitud a Flow.cl.

- **Parte B — Modelo de datos + Auth**: tablas Supabase (`profiles`, `courses` con sus campos de contenido/venta/SEO, `course_videos`, `purchases`, `payment_webhook_events`, `video_notes`, `lesson_progress`, `analytics_events`), políticas RLS, login/registro en español, rol admin.
  *Hecho (técnico)*: un usuario puede registrarse/loguearse y un admin se distingue de un alumno vía RLS probado con un intento de acceso cruzado.
  *Hecho (Marcela)*: puede crear su cuenta de alumno de prueba y loguearse en español sin errores.

- **Parte C — Plantilla de landing + shell del reproductor + widget mínimo de subida + curso placeholder**: componente de landing con las 10 secciones de venta definidas arriba, vista de clase con estados bloqueado/desbloqueado/maximizado, sección de notas personales, indicador de "continúa donde quedaste" usando `lesson_progress`, captura de UTM en la primera visita, un widget básico de subida TUS (sin el resto del CRUD admin) para poder probar la Parte D, y **se crea un curso de prueba (placeholder) con 3-4 clases ficticias** (una marcada gratis), **insertado directo por script/seed SQL** (no por UI — el CRUD admin recién existe en la Parte E) para poder probar el flujo completo en las Partes D, E y F antes de que exista contenido real. El widget de subida ya incluye el endpoint `/api/vimeo/upload-url` completo, validando server-side que quien lo pide tiene `role=admin` (no solo el estado subiendo/procesando/listo, que se agrega en la Parte D). Este curso placeholder se borra o se despublica antes del lanzamiento real (Parte G).
  *Hecho (técnico)*: existe una landing de curso de prueba navegable con datos ficticios, con las 10 secciones implementadas, los estados visuales están implementados, el widget de subida TUS sube un archivo de prueba a Vimeo correctamente vía el endpoint validado, y el curso placeholder existe en la base de datos con sus 3-4 clases.
  *Hecho (Marcela)*: ve una landing de ejemplo, reconoce la marca, y entiende que ahí se puede ir agregando el contenido de venta (FAQ, testimonios, etc.) más adelante.

- **Parte D — Integración Vimeo segura**: sobre el endpoint de subida ya construido en la Parte C, se agrega el estado subiendo/procesando/listo (vía polling a `transcode.status` — ver corrección más arriba, Vimeo no tiene webhook de transcoding) y el endpoint server-side que valida acceso (compra o clase gratis) antes de entregar el embed de reproducción.
  *Hecho (técnico)*: un video de prueba subido se reproduce en la clase correspondiente del curso placeholder y NO se puede acceder (probado con usuario sin comprar ni URL directa).
  *Hecho (Marcela)*: sube un video de prueba y lo ve reproducirse en la clase.

- **Parte E — Panel de administración completo**: CRUD de cursos y clases alrededor del widget de subida (incluyendo los campos de contenido de venta: promesa, para quién es, beneficios, FAQ, testimonios, SEO — no todos obligatorios), drag-and-drop de orden, publicar/despublicar, otorgar/revocar acceso manual, confirmaciones en acciones destructivas, vista previa antes de publicar, indicador de completitud, **y se publican las páginas estáticas de Términos y Condiciones / Política de Privacidad / Aviso de Cookies** (el contenido/texto lo escribe Marcela o su asesor legal — no es trabajo de desarrollo; se puede partir de una plantilla base genérica que ella ajusta). Se hace aquí y no en la Parte G porque la Parte F (pagos) las necesita ya publicadas.
  *Hecho (técnico)*: flujo completo de creación de curso cubierto por el CRUD, sin pasos manuales en base de datos; páginas legales publicadas y enlazadas desde el footer.
  *Hecho (Marcela)*: crea un curso completo (texto + 3 clases + 1 gratis), lo previsualiza, ve qué le falta con el indicador de completitud, y lo publica sin ayuda de un desarrollador.

- **Parte F — Pagos**: checkout Flow.cl (con cuotas habilitadas, cuenta ya aprobada desde el trámite iniciado en Parte A) + webhook con verificación de firma e idempotencia que otorga acceso; evento `Purchase` de Meta Pixel disparado desde el webhook; luego Stripe como opción secundaria. (La boleta electrónica se resuelve aparte, en la Parte H, para no bloquear el lanzamiento — ver nota legal en Contexto.)
  *Hecho (técnico)*: una compra real de bajo monto de principio a fin desbloquea el curso correctamente, queda registrada sin duplicados, y se puede pagar en cuotas.
  *Hecho (Marcela)*: ve el pago reflejado en su panel de Flow.cl y el curso aparece desbloqueado para esa cuenta.

- **Parte G — Consistencia de marca + QA + lanzamiento**: aplicar el sistema visual ya confirmado (paleta/logo/tipografía de la sección "Sistema visual de marca"), navegación de vuelta al dominio raíz, responsive mobile, cuenta Meta Business + Pixel instalado y disparando los 4 eventos, verificar que `analytics_events` y UTM (ya construidos en Partes B/C) se disparan correctamente en todo el funnel real, chequeo de accesibilidad básica (teclado, foco, contraste, labels), prueba end-to-end, **borrar o despublicar el curso placeholder de la Parte C** para que no quede visible a los alumnos reales.
  *Hecho (técnico)*: revisión lado a lado confirma que colores/logo/tipografía coinciden con el sistema de marca definido; flujo completo funciona en mobile y desktop; Core Web Vitals (LCP, CLS, INP) en verde en landing y página de clase, medidos en mobile; Pixel dispara los 4 eventos en un recorrido de prueba; navegación completa por teclado sin trampas de foco.
  *Hecho (Marcela)*: al entrar desde el link de "Cursos" del sitio principal, siente que sigue en el mismo sitio, y las páginas cargan rápido incluso desde su celular.

- **Parte H — Automatizaciones en n8n (se hace al final, no bloquea el lanzamiento)**: una sola instancia de n8n conectada a los webhooks/eventos que ya existen desde las Partes B-F (pagos, `lesson_progress`, `leads`) para disparar, sin construir un sistema nuevo desde cero:
  - **Boleta electrónica**: al confirmarse un pago, dispara la emisión de boleta electrónica (SII) con el proveedor de facturación que se elija, y se la envía al alumno.
  - **Pedido de testimonio**: cuando `lesson_progress` marca un curso como 100% completado, se envía un email pidiendo una reseña/testimonio — Marcela lo revisa y lo agrega manualmente al campo `testimonios` del curso.
  - **Recordatorio de continuar el curso**: si un alumno compró pero no tiene progreso después de unos días, un email de re-enganche ("continúa tu curso").
  *Hecho (técnico)*: una compra de prueba genera automáticamente su boleta sin intervención manual; completar un curso de prueba dispara el email de testimonio; un alumno sin progreso recibe el recordatorio.
  *Hecho (Marcela)*: cada venta le llega su boleta al alumno sola, y las alumnas van recibiendo estos emails sin que ella tenga que escribirlos a mano uno por uno.

## Rendimiento y velocidad (requisito no negociable)

El pedido explícito es que la página del curso sea **fácil de usar y rápida** — esto se trata como criterio de lanzamiento, no como optimización opcional posterior:

- **Landing de curso pre-renderizada**: se genera como página estática (SSG) con revalidación automática cuando el admin publica o edita un curso (ISR) — el alumno nunca espera a que se arme la página en el momento, y sigue siendo la misma plantilla liviana de siempre.
- **El reproductor de Vimeo se carga en dos pasos ("facade")**: la página muestra primero solo la imagen de portada de la clase con un botón de play — el script/iframe pesado del reproductor de Vimeo recién se carga cuando el usuario hace clic en play, no en cada carga de página. Esto es lo que más pesa una página de video si no se cuida.
- **Imágenes optimizadas**: portadas y fondos de curso servidos con el componente de imágenes de Next.js (redimensionadas, WebP/AVIF, servidas por el CDN de Vercel) — nunca la imagen original sin comprimir.
- **JS mínimo en las páginas públicas**: landing y reproductor livianos (solo lo esencial: estado de compra, notas personales, reproductor); toda la complejidad de drag-and-drop y subida de video vive únicamente en `/admin`, que es interno y no necesita ser tan liviano.
- **Mobile-first**: la mayoría del tráfico de una marca que crece por Instagram llega desde el celular — cada pantalla (landing, checkout, login, reproductor + notas, dashboard, admin) se diseña y prueba primero en mobile, no solo desktop.
- **Accesibilidad básica**: navegación por teclado, estados de foco visibles, contraste de texto adecuado, labels en los campos de formulario, controles de video accesibles. No es una auditoría WCAG completa, son buenas prácticas base que no cuestan casi nada si se definen desde el principio.
- Criterio de lanzamiento en Parte G: medir Core Web Vitals (LCP, CLS, INP) en la landing y en la página de clase con una herramienta estándar (ej. PageSpeed Insights) antes de dar por cerrada la parte, no solo revisión visual.

## Stack y qué necesito de cada proveedor (orden para juntar accesos/credenciales)

Antes de empezar la Parte A, este es el orden en el que conviene juntar cuentas y credenciales. Por cada proveedor se indica **qué se necesita**, **quién lo crea**, y **si ya tenemos forma de automatizarlo desde esta sesión (MCP) o si es 100% manual**.

1. **Vercel — hosting** (elegido, ya definido)
   - Qué se necesita: proyecto Vercel para el subdominio, variables de entorno cargadas ahí (nunca en el código).
   - **Ya tengo un conector MCP de Vercel disponible en esta sesión** — puedo crear el proyecto, revisar deployments y cargar variables de entorno directamente, sin que tengas que entrar al dashboard para cada paso.
   - Lo que necesito de ti: acceso a tu cuenta/equipo de Vercel (invitarme, o crear el proyecto y darme acceso), y quién administra el DNS del dominio `alimentatufertilidad.com`.

2. **Supabase — base de datos + login de usuarios**
   - Qué se necesita: un proyecto Supabase nuevo. De ahí salen 3 credenciales: `Project URL`, `anon public key` (para el sitio), `service_role key` (secreta, solo para el servidor, nunca se expone).
   - **No tengo un conector MCP de Supabase conectado ahora mismo.** Si quieres que yo cree el proyecto y las tablas directamente, se puede agregar ese conector antes de la Parte B (claude.ai → Settings → Connectors). Si prefieres crearlo tú, me pasas esas 3 credenciales cuando llegue el momento.

3. **Vimeo — hosting de video** (plan Standard o superior, de pago)
   - Qué se necesita: cuenta Vimeo con el plan contratado, y dentro de "Vimeo Developer" crear una app para obtener: `Access Token` (con permisos `upload`, `edit`, `private`), `Client ID`, `Client Secret`.
   - 100% manual — no hay MCP de Vimeo. La cuenta y el plan los defines tú/Marcela (es un costo mensual del negocio). **Se junta ya en la Parte A** (Ricardo confirmó que puede resolverlo sin problema desde el principio), no se posterga a la Parte D.

4. **Flow.cl — pagos en Chile**
   - Qué se necesita: cuenta de comercio en Flow.cl (piden RUT con giro y cuenta bancaria para recibir el dinero), con **cuotas sin interés habilitadas**. De ahí salen: `API Key`, `Secret Key`.
   - 100% manual, y esta cuenta la debe abrir Marcela o quien sea el titular del negocio (no yo ni Ricardo, salvo que uno de ustedes sea el titular). **El trámite se inicia en la Parte A** (puede tardar días/semanas en aprobarse) aunque las credenciales recién se usan en la Parte F — así no se pierde tiempo esperando la aprobación.

5. **Stripe — respaldo internacional**
   - Qué se necesita: cuenta Stripe activada para Chile. De ahí: `Publishable key`, `Secret key`, y el `Webhook signing secret` (este último se genera recién al registrar el endpoint del webhook, en la Parte F).
   - 100% manual, sin conector disponible en esta sesión. Se necesita recién en la Parte F.

6. **Dominio / DNS**
   - Qué se necesita: acceso a donde está administrado el DNS de `alimentatufertilidad.com`, para agregar el registro del subdominio apuntando a Vercel. Se hace una vez en la Parte A (registro apuntando al proyecto de Vercel) y se revisa de nuevo en la Parte G solo para confirmar que sigue correcto antes del lanzamiento — no son dos acciones distintas, es la misma configuración verificada dos veces.

7. **Resend — email transaccional**
   - Qué se necesita: cuenta Resend (o proveedor equivalente), de ahí sale un `API Key`. Se necesita desde la Parte A (para poder mandar emails de prueba durante el desarrollo) pero se usa en serio recién en la Parte F.
   - 100% manual, sin conector disponible en esta sesión.

8. **n8n — automatizaciones** (boleta electrónica + emails de la Parte H)
   - Qué se necesita: una instancia de n8n (cloud de n8n, o autohospedada) y sus credenciales de acceso, más la cuenta del proveedor de facturación electrónica que se elija para la boleta. Se necesita recién en la Parte H, al final.
   - Esta sesión sí tiene un conector MCP de n8n disponible para construir los workflows una vez que exista la instancia.

9. **Meta Business + Pixel — marketing/retargeting**
   - Qué se necesita: cuenta de Meta Business, un Pixel creado ahí, y su `Pixel ID` + token de Conversions API. Se necesita recién en la Parte G.
   - 100% manual, la abre quien administre las redes de la marca (probablemente Marcela o su equipo de marketing).

10. **Boleta electrónica (SII)** — pendiente de definir con qué proveedor de facturación se resuelve (ver Contexto), se define en la Parte H, no antes.

Nada de esto se pide de golpe: cada credencial se necesita recién en la Parte que la usa (Vercel/DNS/Vimeo/Resend en Parte A, Supabase en Parte B, Flow/Stripe en Parte F, Meta Pixel en Parte G, n8n/boleta en Parte H), así que se puede ir juntando en el orden del roadmap en vez de todo de una vez.

## Checklist de verificación antes de ejecutar

Junta en un solo lugar todo lo que falta confirmar. Reescrito en lenguaje simple y concreto, sin jerga.

### 1. Legal / operativo — se deja para el final, no bloquea el lanzamiento

- [ ] **Boleta electrónica**: se resuelve al final, como una automatización en **n8n**. Cuando entra un pago (aviso de Flow.cl o Stripe), un workflow de n8n dispara la emisión de la boleta electrónica y se la envía al alumno automáticamente. Falta decidir con qué proveedor de facturación electrónica se conecta n8n (ej. OpenFactura, Bsale, u otro) — se define cuando se llegue a la Parte H, no ahora. **Por qué n8n específicamente**: es la misma herramienta que ya se usa para los emails de re-enganche/testimonios de la Parte H, así que se resuelve todo con una sola instancia en vez de construir integraciones separadas.
- [ ] Confirmar quién abre la cuenta de comercio en Flow.cl (tiene que ser a nombre de Marcela o de quien sea el titular legal del negocio, con RUT y cuenta bancaria — no puede ser a nombre de Ricardo si el negocio está a nombre de otra persona/empresa).

### 2. Marca / diseño

- [x] **Resuelto**: subiste el archivo `nutfem2027PRUEBAfondoclaro.html` (Academia NUTFEM 2026/2027, también a cargo de Marcela) — se extrajeron colores, tipografía y logo. Ver sección "Sistema visual de marca" más arriba.
- [x] **Confirmado**: esa paleta y tipografía se usan tal cual para Alimenta Tu Fertilidad.
- [x] **Nombre del subdominio: `cursos.alimentatufertilidad.com` (definitivo para arrancar)**. Se fija ahora porque la Parte A configura el DNS y la restricción de dominio de Vimeo depende de este nombre — no se puede dejar abierto. Se puede cambiar más adelante si hace falta, pero implica repetir esa configuración.
- [ ] Decidir si el subdominio va a tener el mismo menú completo que el sitio principal, o solo el logo/header (propuesto por defecto: solo header, para no duplicar mantenimiento de dos menús).

### 3. Datos del negocio

- [x] **El precio de cada curso NO hay que decidirlo ahora.** Lo pone directamente el administrador (Marcela) desde el panel de administración cuando cargue el curso real — es un campo editable del formulario de curso (ya está en el modelo de datos). No bloquea la construcción.
- [x] **La cantidad de cursos y de clases por curso tampoco hay que decidirla ahora.** Mismo caso: los administradores van agregando cursos y clases desde el panel cuando quieran, después de que el sitio esté construido. No bloquea la construcción.
- [ ] **Lo que SÍ hace falta durante la construcción**: datos de prueba / *placeholders*. Antes de que Marcela cargue contenido real, el equipo que construya necesita un curso "de mentira" con 3-4 clases de prueba (videos placeholder, textos genéricos, una marcada como gratis) para poder probar el flujo completo: landing → clase gratis → clase bloqueada → compra → desbloqueo. Esto ya quedó agregado explícitamente como entregable de las Partes C y D del roadmap (ver abajo) — no se prueba con datos reales, se prueba con placeholders y después se borran.
- [ ] ¿Van a vender paquetes de varios cursos juntos con descuento a futuro, o siempre se compra uno a la vez? Si no lo saben todavía, no pasa nada — el sistema ya queda preparado para agregarlo después sin rehacer nada.
- [x] **Política de reembolso — resuelto: sin reembolsos.** No se ofrece garantía de devolución en la landing (se sacó esa sección del template). El admin igual puede "revocar" o "marcar como reembolsado" un acceso caso a caso desde el panel si Marcela decide hacer una excepción, pero no es una política publicitada.
- [x] **`/curso-online` — respondido**: es el mismo curso que vamos a construir acá (no es algo distinto ni viejo). La conexión entre esa página y la plataforma nueva **se resuelve más adelante**, no ahora — queda pendiente sin bloquear el resto del plan.

### 4. Cuentas que hay que crear — explicado simple

Para que todo funcione hace falta crear una cuenta en 8 herramientas distintas (como crear una cuenta de correo, pero cada una cumple un rol distinto). Yo no puedo crear estas cuentas por ustedes porque piden datos personales/de la empresa (RUT, tarjeta, cuenta bancaria) — las tienen que abrir Ricardo o Marcela:

1. **Vercel** — donde queda alojado el sitio web. Gratis para partir.
2. **Supabase** — donde se guardan los datos: usuarios, cursos, compras. Gratis para partir.
3. **Vimeo** — donde se suben y reproducen los videos de las clases. De pago (~US$25/mes).
4. **Resend** — manda los emails automáticos (confirmación de compra, bienvenida, etc.). Gratis para partir.
5. **Flow.cl** — cobra las tarjetas/transferencias en Chile (con cuotas) y les deposita la plata.
6. **Stripe** — alternativa para tarjetas de fuera de Chile.
7. **Meta Business** — para instalar el Pixel y poder hacer publicidad de retorno en Instagram/Facebook a quien vio pero no compró.
8. **n8n** — conecta todo para automatizar la boleta electrónica y los emails de seguimiento, al final del proyecto.

De cada una, una vez creada la cuenta, sale una "clave técnica" (como una contraseña larga) que me tienen que pasar para conectar todo — pero eso se pide recién cuando lleguemos a la parte del roadmap que la necesita, no hace falta juntar las 8 ahora mismo. El detalle completo de cada una está más arriba, en "Stack y qué necesito de cada proveedor".

Nada de esta lista se pide de golpe: cada punto se resuelve cuando el roadmap llega a la Parte que lo necesita. Pero mientras un punto no tenga dueño ni respuesta, la ejecución se frena apenas se llegue ahí.

## Revisión del plan

Este documento pasó por **3 rondas de revisión por pares** (dos revisores independientes por ronda: uno con foco técnico/arquitectura, otro con foco en producto/UX para el usuario no-técnico) antes de cerrarse:

- **Ronda 1**: seguridad del flujo de video y pagos (verificación de firma de webhooks, idempotencia, acceso directo por URL), estados faltantes del panel admin (procesamiento de Vimeo, confirmaciones, otorgar/revocar acceso), pantallas faltantes del mockup (Mis cursos, confirmación de compra), el requisito legal de boleta electrónica, y criterios de "hecho" verificables tanto técnica como por una persona no técnica.
- **Ronda 2**: correlación de sesión en el checkout, cascada de borrado de notas, índices y restricciones del modelo de datos, notificación de venta a Marcela, pantalla de ventas/alumnos, estado visual de curso comprado-pero-despublicado, camino de pago rechazado, "olvidé mi contraseña", y alcance explícito sobre cuentas compartidas.
- **Ronda 3**: correlación exacta checkout↔webhook por ID interno de orden, mecanismo de detección de fin de transcoding en Vimeo, aclaración de que `vimeo_id` nunca se consulta desde el cliente, protección contra doble cobro, diferencia entre revocar acceso y reembolsar dinero, notificación al alumno en acceso otorgado manualmente, y capacidad de reemplazar el video de una clase ya publicada sin borrarla.

Al cierre de la ronda 3, ambos revisores confirmaron no encontrar más mejoras de sustancia.

- **Ronda 4 (revisión fresca, sin sesgo de "ya resuelto")**: a diferencia de las rondas 1-3 (que buscaban pulido incremental sobre una arquitectura ya asumida correcta), esta ronda leyó el documento completo desde cero con dos lentes: producto/conversión/crecimiento del negocio, y consistencia interna entre secciones. Encontró y se corrigió: falta de captura de leads en la clase gratis, falta de pixel de retargeting, pago en cuotas no mencionado, falta de mecanismo de pedir testimonios, falta de páginas legales (Términos/Privacidad/Cookies), falta de proveedor de email transaccional definido pese a usarse en 4+ flujos, n8n nunca listado como credencial a conseguir, contradicción entre la paleta "confirmada" y "pendiente" en distintas secciones, contradicción sobre cuándo se necesitan las credenciales de Vimeo (Parte A vs. D), contradicción sobre si la boleta electrónica bloquea el lanzamiento, dos checklists de credenciales duplicadas y desincronizadas, campo de instructor sin dueño en el modelo de datos, estado `revocado` faltante en `purchases`, ambigüedad sobre cuándo se crea el curso placeholder, y la política de garantía/reembolso sin resolver. Explícitamente descartados por decisión de Ricardo: dashboard de ingresos/conversión, upsell entre cursos, y comunidad/acompañamiento — quedan fuera de la v1.
- **Ronda 5 (chequeo pragmático final, no exhaustivo)**: veredicto "listo para avanzar", con 3 ajustes puntuales de secuencia corregidos: páginas legales movidas de Parte G a Parte E (las necesita la Parte F, no puede publicarse después de usarse), trámite de cuenta Flow.cl iniciado en Parte A en vez de esperar a la Parte F (por el tiempo de aprobación), nombre del subdominio fijado como definitivo (`cursos.alimentatufertilidad.com`) para poder configurar DNS/Vimeo en la Parte A, y la frontera Parte C/D del endpoint de subida de Vimeo aclarada (el endpoint con validación admin se construye en C, los estados de procesamiento en D).

## Siguiente paso

Con el plan aprobado: Parte A. Nada de esto se ejecuta automáticamente — se sigue el mecanismo de partes descrito arriba.
