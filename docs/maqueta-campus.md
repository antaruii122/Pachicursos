# Maqueta "Campus NUTFEM · plataforma privada" — lo que muestra cada pantalla

Fuente: artifact `SPAZw5G8WMCFMj8im5hish` (claude.ai), leído el 2026-09-30 con capturas de Ricardo + navegador. Es referencia de **estructura y UX** — los colores/tipografías reales son los tokens de `globals.css` (paleta ciruela de la maqueta; tipografías EB Garamond para títulos + DM Sans para texto y UI, identificadas contra la maqueta el 2026-10-01), nunca los literales de color de la maqueta. Desde 2026-10-01 el nombre de la plataforma SÍ es "NUTFEM" (decisión de Ricardo); "Camila" es dato de ejemplo.

## 1 · Ingreso (`/cuenta/login`)
- Fondo claro con un aro decorativo grande (arco) arriba a la derecha.
- Logo centrado (círculo + nombre + "CAMPUS" debajo en versalitas).
- Tarjeta blanca centrada, redondeada, sombra suave: título serif "Te damos la bienvenida", subtítulo "Un espacio para comprender mejor e intervenir con precisión."
- Campos: Correo electrónico, Contraseña. Botón ancho completo "Ingresar" (vino). Link "¿Olvidaste tu contraseña?".
- Pie: "Plataforma privada para alumnas y equipo docente de …".
- **Sin link de registro** (coherente con pantalla 4: la cuenta la crea el admin).

## 2 · Mi Campus (`/cuenta/mis-cursos`) — desktop
- Header propio del campus: logo, nav en píldoras (Mi Campus · Módulos y clases · Materiales · Evaluaciones · Comunidad), avatar con iniciales + nombre.
- Eyebrow "MI CAMPUS", título serif "Hola, {nombre}".
- "Mi Diplomado" + nombre del programa a la derecha.
- Tarjeta oscura (vino-osc): eyebrow "CONTINÚA DONDE QUEDASTE", título de la clase, "Módulo 2 · {módulo}", botón blanco "Retomar la clase".
- Tarjeta blanca al lado: **anillo de progreso** con "31% avance" y 3 stats: PROGRESO GENERAL "13 de 42 clases", MÓDULOS COMPLETADOS "0 de 6", CLASES PENDIENTES "29".
- 4 tarjetas-atajo con flecha: Clases (42 clases en 6 módulos) · Materiales (PDF, bibliografía y enlaces) · Evaluaciones (1 abierta para rendir) · Comunidad (Preguntas y conversación).
- "Módulos": lista con número en círculo, eyebrow "MÓDULO 1 · ABRIL", título, barra de progreso + "80 % completado" + "8/10". Módulos futuros atenuados con "Disponible desde el 7 de julio de 2027" (**liberación por fecha**), "No iniciado 0/9".

## 2b · Mi Campus en el celular
- Header con logo + botón "Menú". Mismo saludo; tarjeta oscura "Continúa donde quedaste" con botón "Retomar" ancho; tarjeta con anillo 31% + "13 de 42 clases / 0 de 6 módulos"; lista compacta Módulo N + barra + "% completado".

## 3 · Clase con video y materiales (`/cursos/[slug]/clase/[n]`)
- **No tiene pestañas.** Breadcrumb "Módulos y clases / Módulo 2".
- Izquierda: player (Vimeo dentro de la plataforma), eyebrow tipo de clase ("CLASE TEÓRICO-CLÍNICA"), título serif grande, botón "Marcar como completada y seguir" + texto "Tu avance se guarda automáticamente."
- "Material de la clase": grilla 2×2 de tarjetas con badge de tipo (PDF / PRE / BIB / LIN), nombre + subtítulo (PDF, Presentación, Bibliografía, Link) y acción (Descargar / Ver / Abrir).
- Derecha: tarjeta del **módulo actual** (no todo el curso): eyebrow "MÓDULO 2", título, barra + "45 % completado", lista de clases con check verde / actual resaltada / círculo vacío, botón "Evaluación del módulo" al final.

## 4 · Administración: crear usuario (NUEVO)
- Sidebar admin: Resumen · Alumnas y usuarios · Programas y contenidos · Resultados de evaluaciones · "Ver el campus como alumna"; abajo avatar + "Marcela Calderón / Administradora".
- Breadcrumb "Alumnas y usuarios", título "Crear usuario".
- Form "Datos de la cuenta — Tú defines el correo y la contraseña": Nombre completo, Correo electrónico, Contraseña (placeholder "Déjala vacía para generar una"; "Mínimo 8 caracteres"), Tipo de usuario (select: Alumna…), Profesión, País, "Dar acceso a" (select de programa/curso). Botón "Crear cuenta".
- Panel "AL GUARDAR APARECE ESTO" → "Datos de acceso": "Cópialos y envíalos por correo o WhatsApp. La contraseña no se volverá a mostrar; siempre puedes asignar una nueva." Caja monoespaciada Dirección / Correo / Contraseña + botón "Copiar mensaje con los datos".
- Tarjeta "Estado de la cuenta" (badge "Activa"): "Desde su ficha puedes cambiar el correo, asignar una contraseña, quitar el acceso o desactivar la cuenta."

## Cosas de la maqueta que NO existen hoy en el modelo (decidir antes de construir)
- Evaluaciones por módulo ("1 abierta para rendir", "Resultados de evaluaciones") — no pedidas todavía.
- Liberación de módulos por fecha ("Disponible desde…").
- Profesión / País en el perfil.
- Botón manual "Marcar como completada y seguir" (hoy se completa solo al 90% visto).
