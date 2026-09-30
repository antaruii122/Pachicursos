# Plan — Campus privado según la maqueta (2026-09-30)

Base: capturas de Ricardo de la maqueta NUTFEM (detalle en `docs/maqueta-campus.md`), revisión del código actual y logs de producción (Vercel: 0 errores/warnings en producción). **El diseño manda**: cada pantalla se construye sobre un set común de piezas visuales, no estilos sueltos por página. Siempre con los tokens de marca de `globals.css` (vino/carmín/crema, Noto Serif / Lato / Poppins), nunca los colores de NUTFEM.

## Estado de partida (verificado hoy)
- Módulos: migración `0006` corrida y verificada en la base real (tabla, permiso de columna, función bloquea a no-admin). Código listo, build limpio, smoke test local OK (landing 200, clase gratis 200, clase paga → login, admin → login).
- Logs de producción: limpios.
- Pagos: congelados, no se tocan.

## Paso 0 — Piezas de diseño compartidas (sin migración)
`src/components/campus/`: `ProgressRing` (anillo SVG animado, respeta reduced-motion), `ProgressBar`, `Eyebrow`, `StatBlock`, `ShortcutCard` (tarjeta con flecha), `CampusCard`. Una sola fuente para radios/sombras/movimiento (tokens ya existentes `--sombra-*`, `--radio-*`, `--ease`).

## Paso 1 — Ingreso (`/cuenta/login`) — solo estilo
Tarjeta centrada con marca (corazón del logo + "Alimenta Tu Fertilidad" + "CAMPUS"), arco decorativo de fondo en rosa/linea, eyebrow + "Te damos la bienvenida" + subtítulo, inputs más altos, botón ancho "Ingresar", "¿Olvidaste tu contraseña?" debajo, pie "Plataforma privada para alumnas…". **Decisión**: se mantiene un link discreto "¿Compraste un curso y no tienes cuenta? Regístrate" — la maqueta no lo tiene, pero hoy quien compra por la web se registra sola; sacarlo rompería esa compra. Lógica de login intacta.

## Paso 2 — Mi Campus (`/cuenta/mis-cursos`, desktop + celular)
- "MI CAMPUS" + "Hola, {nombre}".
- Curso destacado = el de actividad más reciente. Tarjeta oscura "CONTINÚA DONDE QUEDASTE" (clase + módulo reales, botón "Retomar la clase") + tarjeta con **anillo de % real** y 3 datos: clases hechas de total, módulos completados, clases pendientes.
- Atajos: Clases (N clases en M módulos) · Materiales (cuando exista Paso 5) · Preguntas/Comunidad (cuando exista Paso 6). **Evaluaciones no** (ver "Fuera de alcance").
- "Módulos": lista con número, título, barra de % y "hechas/total" reales. Curso sin módulos → una sola fila "Todas las clases".
- Otros cursos comprados: tarjetas compactas debajo.
- Mobile: mismo orden, apilado (como la maqueta de celular).
Todo sale de `lesson_progress` + `course_modules` (ya existen). Sin migración.

## Paso 3 — Clase (`/cursos/[slug]/clase/[n]`)
Comparado contra la maqueta: **no hay pestañas**. Cambios:
- Breadcrumb "Curso / Módulo N".
- Sidebar: tarjeta del **módulo actual** con barra de % del módulo y sus clases (check/actual/pendiente), + desplegable "Ver todo el curso".
- Bajo el video: eyebrow "Clase N", título serif grande, botón "Marcar como completada y seguir" (**decisión**: se suma al guardado automático al 90%, no lo reemplaza — la alumna que salta el final igual puede avanzar), texto "Tu avance se guarda automáticamente."
- "Material de la clase" (Paso 5) y "Preguntas de la clase" (Paso 6) debajo; notas personales se mantienen.

## Paso 4 — Admin: crear usuaria (NUEVO, Parte propia)
- Panel admin pasa a **sidebar izquierda** como la maqueta (Resumen · Alumnas y usuarios · Cursos y contenidos · Ventas · "Ver el campus como alumna"; abajo nombre + "Administradora").
- `/admin/usuarios/nuevo`: Nombre completo, Correo, Contraseña (vacía = se genera una segura y legible), Tipo (Alumna/Admin), Profesión, País, "Dar acceso a" (curso, opcional).
- Server action con `service_role` (`auth.admin.createUser`, correo ya confirmado) → perfil vía el trigger existente → acceso manual (`purchases`, `proveedor_pago=manual`) si se eligió curso. Revalida admin server-side antes de todo. Si falla el acceso, la cuenta queda creada y se avisa (no se pierde).
- Panel "Datos de acceso": URL del campus, correo, contraseña **mostrada una sola vez** + botón "Copiar mensaje con los datos" (texto listo para WhatsApp/correo).
- Migración `0007`: `profiles.profesion`, `profiles.pais` (texto, opcionales).
- Ficha de usuaria: asignar contraseña nueva, activar/desactivar (ban de Supabase Auth).

## Paso 5 — Materiales por clase (PPT/PDF/links)
- Migración `0008`: bucket **privado** `materiales` en Supabase Storage; solo admin sube/borra.
- `course_videos.resources` (ya existe) guarda `{nombre, tipo, path | url, tamaño}`.
- Admin: panel "Materiales" en cada clase (subir archivo o pegar link, renombrar, borrar).
- Alumna: grilla 2×2 con badge de tipo (PDF / PPT / DOC / LINK) y "Descargar/Abrir". La descarga pasa por un endpoint que valida acceso (gratis o compra pagada) y entrega un **link firmado de corta duración** — nunca un link público.

## Paso 6 — Preguntas por clase (foro)
- Migración `0009`: `class_questions` (clase, autora, respuesta a, contenido, fecha, borrado). RLS: leer/escribir solo con acceso a la clase; admin responde (marcada "Equipo docente") y borra.
- UI bajo la clase: lista de preguntas con respuestas anidadas (1 nivel), formulario simple. Admin: vista "Preguntas sin responder" en el panel.

## Fuera de alcance (la maqueta lo muestra, nadie lo pidió todavía)
Evaluaciones/cuestionarios por módulo, liberación de módulos por fecha. Se anotan, no se construyen.

## Cómo se ejecuta
Un paso a la vez: build + lint + prueba local → `curso-platform-reviewer` → registro en `EJECUCION.md`. Cada migración la corre Ricardo pegando el SQL (el agente no tiene permiso para escribir en la base). Nada se deploya sin el OK de Ricardo; el código que depende de una migración no se deploya antes de que esa migración esté corrida.
