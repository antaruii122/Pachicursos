"use client";

import { grantAccess, updatePurchaseEstado } from "@/app/admin/cursos/[id]/accesos/actions";
import { campusCard } from "@/components/campus/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pago sin terminar",
  pagado: "Con acceso",
  fallido: "Pago fallido",
  reembolsado: "Reembolsado",
  revocado: "Acceso quitado",
};

interface Purchase {
  id: string;
  monto: number;
  proveedor_pago: string;
  estado: string;
  fecha: string;
  profiles: { nombre: string | null; email: string | null } | null;
}

// Pantalla de accesos de UN curso (pedido de Ricardo 2026-09-30: "no solo
// agregar el curso a un email, también ver quién ya lo tiene"). Arriba se
// otorga (con autocompletado de cuentas existentes); en el centro, la lista
// de quién tiene acceso hoy; los pagos sin terminar / quitados quedan en un
// historial plegado para no ensuciar la lista principal.
export function AccesosManager({
  courseId,
  purchases,
  cuentas,
}: {
  courseId: string;
  purchases: Purchase[];
  cuentas: { email: string | null; nombre: string | null }[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otorgando, setOtorgando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");

  const conAcceso = purchases.filter((p) => p.estado === "pagado");
  const historial = purchases.filter((p) => p.estado !== "pagado");
  const emailsConAcceso = new Set(conAcceso.map((p) => p.profiles?.email?.toLowerCase()));

  const visibles = conAcceso.filter((p) => {
    const q = filtro.trim().toLowerCase();
    if (!q) return true;
    return `${p.profiles?.nombre ?? ""} ${p.profiles?.email ?? ""}`.toLowerCase().includes(q);
  });

  const handleOtorgar = async (e: React.FormEvent) => {
    e.preventDefault();
    const destino = email.trim();
    if (!destino) return;
    setOtorgando(true);
    setError(null);
    setOk(null);
    const result = await grantAccess(courseId, destino);
    setOtorgando(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOk(`Listo: ${destino} ya tiene acceso.`);
    setEmail("");
    router.refresh();
  };

  const handleEstado = async (purchaseId: string, estado: "revocado" | "reembolsado", quien: string) => {
    const confirmMsg =
      estado === "revocado"
        ? `¿Quitarle el acceso a ${quien}? No se devuelve dinero automáticamente — solo deja de ver el curso.`
        : `¿Marcar a ${quien} como reembolsada? No devuelve la plata automáticamente — la devolución real se hace aparte en Flow.cl/Stripe.`;
    if (!confirm(confirmMsg)) return;
    setError(null);
    setOk(null);
    const result = await updatePurchaseEstado(courseId, purchaseId, estado);
    if ("error" in result) setError(result.error);
    else router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <section className={`${campusCard} p-6`}>
        <h2 className="text-[1.15rem] font-normal">Dar acceso</h2>
        <p className="mb-4 mt-1 text-[.82rem] text-[var(--tinta-suave)]">
          Escribe el correo de una cuenta existente (se autocompleta). No se cobra nada.
        </p>
        <form onSubmit={handleOtorgar} className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="acceso-email" className="sr-only">
            Correo de la alumna
          </label>
          <input
            id="acceso-email"
            type="email"
            list="cuentas-existentes"
            autoComplete="off"
            className="w-full flex-1 rounded-[var(--radio-sm)] border border-[var(--linea)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[var(--vino)] focus:shadow-[0_0_0_3px_var(--rosa)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@correo.cl"
          />
          <datalist id="cuentas-existentes">
            {cuentas
              .filter((c) => c.email && !emailsConAcceso.has(c.email.toLowerCase()))
              .map((c) => (
                <option key={c.email} value={c.email!}>
                  {c.nombre ?? ""}
                </option>
              ))}
          </datalist>
          <button
            type="submit"
            disabled={otorgando || !email.trim()}
            className="rounded-full bg-[var(--vino)] px-6 py-2.5 font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-white transition-colors hover:bg-[var(--vino-claro)] disabled:opacity-50"
          >
            {otorgando ? "Dando acceso..." : "Dar acceso"}
          </button>
        </form>
        {error && <p role="alert" className="mt-3 text-sm text-[var(--dorado-osc)]">{error}</p>}
        {ok && <p role="status" className="mt-3 text-sm font-medium text-[var(--ok)]">{ok}</p>}
      </section>

      <section className={`${campusCard} p-6`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[1.15rem] font-normal">
            Con acceso <span className="text-[var(--tinta-suave)]">({conAcceso.length})</span>
          </h2>
          {conAcceso.length > 5 && (
            <input
              type="search"
              aria-label="Buscar alumna con acceso"
              placeholder="Buscar..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full max-w-[220px] rounded-full border border-[var(--linea)] px-3.5 py-1.5 text-sm outline-none focus:border-[var(--vino)]"
            />
          )}
        </div>
        {conAcceso.length === 0 ? (
          <p className="text-sm text-[var(--tinta-suave)]">Nadie tiene acceso a este curso todavía.</p>
        ) : (
          <ul className="divide-y divide-[var(--linea)]">
            {visibles.map((p) => {
              const quien = p.profiles?.nombre || p.profiles?.email || "esta alumna";
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--rosa)] font-[family-name:var(--font-ui)] text-[.72rem] font-semibold uppercase text-[var(--vino)]">
                    {(p.profiles?.nombre || p.profiles?.email || "?").slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-[family-name:var(--font-ui)] text-[.88rem] font-medium">
                      {p.profiles?.nombre || p.profiles?.email || "—"}
                    </p>
                    <p className="truncate text-[.76rem] text-[var(--tinta-suave)]">
                      {p.profiles?.nombre && p.profiles?.email ? `${p.profiles.email} · ` : ""}
                      {p.proveedor_pago === "manual" ? "Acceso dado por admin" : `Compra (${p.proveedor_pago})`} ·{" "}
                      {new Date(p.fecha).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEstado(p.id, "revocado", quien)}
                    className="rounded-full border border-[var(--linea)] px-3.5 py-1.5 font-[family-name:var(--font-ui)] text-[.76rem] text-[var(--dorado-osc)] transition-colors hover:border-[var(--dorado-osc)]"
                  >
                    Quitar acceso
                  </button>
                  {p.proveedor_pago !== "manual" && (
                    <button
                      type="button"
                      onClick={() => handleEstado(p.id, "reembolsado", quien)}
                      className="font-[family-name:var(--font-ui)] text-[.76rem] text-[var(--tinta-suave)] underline"
                    >
                      Reembolsada
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {historial.length > 0 && (
        <details className={`${campusCard} group p-6`}>
          <summary className="flex cursor-pointer list-none items-center justify-between font-[family-name:var(--font-ui)] text-[.88rem] font-medium text-[var(--vino)]">
            Historial: pagos sin terminar y accesos quitados ({historial.length})
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <ul className="mt-4 divide-y divide-[var(--linea)]">
            {historial.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate">{p.profiles?.nombre || p.profiles?.email || "—"}</span>
                <span className="text-[.76rem] text-[var(--tinta-suave)]">{new Date(p.fecha).toLocaleDateString("es-CL")}</span>
                <span className="rounded-full bg-[var(--crema-2)] px-3 py-1 text-[.72rem] text-[var(--tinta-suave)]">
                  {ESTADO_LABEL[p.estado] ?? p.estado}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
