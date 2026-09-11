# Alimenta Tu Fertilidad — Plataforma de Cursos

Antes de tocar código, lee `CLAUDE.md` (reglas de ejecución) y `docs/cursos.md` (plan completo, arquitectura, roadmap por Partes) y `EJECUCION.md` (qué Parte sigue).

## Desarrollo local

```bash
cp .env.example .env.local   # completar con credenciales reales, nunca commitear
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres + Auth + RLS), Vimeo, Flow.cl/Stripe, Resend, n8n. Detalle completo en `docs/cursos.md`.
