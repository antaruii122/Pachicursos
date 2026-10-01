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

1. **UNA sola marca en todo el sitio: NUTFEM** (decisión de Ricardo 2026-10-01, siguiendo a Pachi; reemplaza "Alimenta tu Fertilidad · CAMPUS"). Tipografías de la maqueta: EB Garamond (títulos) + DM Sans (texto y UI), definidas solo en `layout.tsx` + tokens `--font-*`. Un solo logo (`src/components/brand/Logo.tsx`), una sola paleta (tokens en `src/app/globals.css`). Nunca un logo dibujado a mano, nunca un color hex/rgba de marca fuera de `globals.css`, nunca "un tema para esta sección y otro para aquella". `npm run lint` y `prebuild` corren `scripts/check-marca.mjs` y fallan si esto se rompe — no se desactiva ni se agregan excepciones sin motivo escrito.
2. **La maqueta aprobada es la referencia visual** (`docs/maqueta-campus.md`). Si una pantalla nueva no está en la maqueta, se construye con las mismas piezas (`src/components/campus/ui.tsx`), no con estilos nuevos.
3. **Nunca ignorar el `error` de una consulta Supabase.** Siempre `const { data, error } = ...` y si hay error, lanzarlo o mostrarlo. Mostrar "0 resultados" / 404 cuando la consulta en realidad falló ya causó 3 incidentes (acceso manual siempre "no existe", landing 404 en producción, admin mostrando "(0) accesos" con accesos reales).
4. **Embeds de `profiles` desde `purchases`** siempre con la FK explícita: `profiles:profiles!purchases_user_id_fkey(...)` — `purchases` tiene dos FKs a `profiles` (`user_id`, `otorgado_por`) y el embed sin FK falla con PGRST201.
5. **"Hecho" = visto.** Ningún cambio de UI se reporta como terminado sin captura real de CADA pantalla afectada, incluidas las que requieren sesión (pedirle a Ricardo que inicie sesión en la pestaña del navegador de pruebas; el agente no escribe contraseñas). Si no se pudo ver, se dice explícitamente "no verificado visualmente".
6. **Decidir, no preguntar, en lo que ya está definido.** Ricardo ya dio la maqueta y la marca: aplicar sin consultar. Preguntar solo decisiones de negocio nuevas (precios, qué funciones construir).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
