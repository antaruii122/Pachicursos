"use client";

import { borrarPregunta, ocultarPregunta, publicarPregunta } from "@/app/preguntas/actions";
import { campusCard } from "@/components/campus/ui";
import { LogoMark } from "@/components/brand/Logo";
import { fechaRelativa, type Hilo, type Pregunta } from "@/lib/preguntas";
import { useRouter } from "next/navigation";
import { useState } from "react";

// "Preguntas de la clase". Patrón de Teachable/Hotmart adaptado: pregunta +
// respuestas de un nivel, el equipo responde con identidad fija ("Equipo
// docente", con el logo), el admin puede ocultar. Aviso de privacidad porque
// el tema es salud reproductiva y las preguntas las ven otras alumnas.
export function ClassQuestions({
  videoId,
  hilos,
  userId,
  esAdmin,
}: {
  videoId: string;
  hilos: Hilo[];
  userId: string;
  esAdmin: boolean;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const r = await publicarPregunta(videoId, texto, null);
    setEnviando(false);
    if ("error" in r) return setError(r.error);
    setTexto("");
    router.refresh();
  };

  return (
    <section className="mb-8" aria-labelledby="preguntas-clase">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="preguntas-clase" className="text-[1.2rem] font-normal">
          Preguntas de la clase {hilos.length > 0 && <span className="text-[var(--tinta-suave)]">({hilos.length})</span>}
        </h2>
      </div>

      <form onSubmit={enviar} className={`${campusCard} mb-4 p-4`}>
        <label htmlFor="nueva-pregunta" className="sr-only">
          Tu pregunta
        </label>
        <textarea
          id="nueva-pregunta"
          rows={3}
          maxLength={2000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={esAdmin ? "Publica un aviso o pregunta para esta clase…" : "¿Te quedó alguna duda de esta clase? Escríbela aquí…"}
          className="w-full resize-y rounded-[var(--radio-sm)] border border-[var(--linea)] bg-white px-3.5 py-2.5 text-[.92rem] outline-none focus:border-[var(--vino)] focus:shadow-[0_0_0_3px_var(--rosa)]"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="max-w-[46ch] text-[.74rem] leading-snug text-[var(--tinta-suave)]">
            Otras alumnas del curso verán tu pregunta con tu primer nombre. No compartas datos médicos personales.
          </p>
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="rounded-full bg-[var(--vino)] px-5 py-2 font-[family-name:var(--font-ui)] text-[.82rem] font-medium text-white transition-colors hover:bg-[var(--vino-claro)] disabled:opacity-50"
          >
            {enviando ? "Publicando..." : "Publicar pregunta"}
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-[var(--dorado-osc)]">{error}</p>}
      </form>

      {hilos.length === 0 ? (
        <p className="px-1 text-[.85rem] text-[var(--tinta-suave)]">
          Todavía no hay preguntas en esta clase. ¡Sé la primera!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {hilos.map((h) => (
            <li key={h.id}>
              <HiloPregunta hilo={h} userId={userId} esAdmin={esAdmin} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function HiloPregunta({
  hilo,
  userId,
  esAdmin,
  abrirRespuesta = false,
}: {
  hilo: Hilo;
  userId: string;
  esAdmin: boolean;
  abrirRespuesta?: boolean;
}) {
  const router = useRouter();
  const [respondiendo, setRespondiendo] = useState(abrirRespuesta);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const responder = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const r = await publicarPregunta(hilo.video_id, texto, hilo.id);
    setEnviando(false);
    if ("error" in r) return setError(r.error);
    setTexto("");
    setRespondiendo(abrirRespuesta);
    router.refresh();
  };

  const accion = async (p: Promise<{ ok: true } | { error: string }>) => {
    setError(null);
    const r = await p;
    if ("error" in r) setError(r.error);
    else router.refresh();
  };

  return (
    <article className={`${campusCard} p-4 ${hilo.oculto ? "opacity-60" : ""}`}>
      <Mensaje m={hilo} userId={userId} esAdmin={esAdmin} onAccion={accion} />
      {hilo.respondida && (
        <span className="mt-2 inline-block rounded-full bg-[var(--crema-2)] px-2.5 py-0.5 font-[family-name:var(--font-ui)] text-[.68rem] text-[var(--ok)]">
          ✓ Respondida por el equipo
        </span>
      )}

      {hilo.respuestas.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3 border-l-2 border-[var(--rosa)] pl-4">
          {hilo.respuestas.map((r) => (
            <li key={r.id}>
              <Mensaje m={r} userId={userId} esAdmin={esAdmin} onAccion={accion} />
            </li>
          ))}
        </ul>
      )}

      {respondiendo ? (
        <form onSubmit={responder} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor={`resp-${hilo.id}`}>
            Tu respuesta
          </label>
          <textarea
            id={`resp-${hilo.id}`}
            rows={2}
            maxLength={2000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={esAdmin ? "Responde como Equipo docente…" : "Escribe tu respuesta…"}
            className="flex-1 resize-y rounded-[var(--radio-sm)] border border-[var(--linea)] bg-white px-3 py-2 text-[.88rem] outline-none focus:border-[var(--vino)]"
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="self-end rounded-full bg-[var(--vino)] px-4 py-2 font-[family-name:var(--font-ui)] text-[.8rem] font-medium text-white disabled:opacity-50"
          >
            {enviando ? "..." : "Responder"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setRespondiendo(true)}
          className="mt-3 font-[family-name:var(--font-ui)] text-[.78rem] font-medium text-[var(--vino)] underline underline-offset-4"
        >
          Responder
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-[var(--dorado-osc)]">{error}</p>}
    </article>
  );
}

function Mensaje({
  m,
  userId,
  esAdmin,
  onAccion,
}: {
  m: Pregunta;
  userId: string;
  esAdmin: boolean;
  onAccion: (p: Promise<{ ok: true } | { error: string }>) => void;
}) {
  const propio = m.user_id === userId;
  return (
    <div className="flex gap-3">
      {m.es_equipo ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--rosa)]">
          <LogoMark size={20} />
        </span>
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--crema-2)] font-[family-name:var(--font-ui)] text-[.72rem] font-semibold text-[var(--vino)]">
          {m.autor_nombre.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 font-[family-name:var(--font-ui)] text-[.78rem]">
          <span className={`font-semibold ${m.es_equipo ? "text-[var(--vino)]" : "text-[var(--tinta)]"}`}>{m.autor_nombre}</span>
          {m.es_equipo && (
            <span className="rounded-full bg-[var(--vino)] px-2 py-px text-[.62rem] uppercase tracking-wide text-white">Equipo docente</span>
          )}
          <span className="text-[var(--tinta-suave)]">{fechaRelativa(m.created_at)}</span>
          {m.oculto && <span className="text-[var(--dorado-osc)]">· Oculta (solo el equipo la ve)</span>}
        </p>
        <p className="mt-1 whitespace-pre-line break-words text-[.92rem] leading-relaxed text-[var(--tinta)]">{m.contenido}</p>
        {(propio || esAdmin) && (
          <div className="mt-1.5 flex gap-3 font-[family-name:var(--font-ui)] text-[.72rem]">
            {esAdmin && (
              <button type="button" onClick={() => onAccion(ocultarPregunta(m.id, !m.oculto))} className="text-[var(--tinta-suave)] underline">
                {m.oculto ? "Mostrar" : "Ocultar"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm("¿Borrar este mensaje? No se puede deshacer.")) onAccion(borrarPregunta(m.id));
              }}
              className="text-[var(--dorado-osc)] underline"
            >
              Borrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
