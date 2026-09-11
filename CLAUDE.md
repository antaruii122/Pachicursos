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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
