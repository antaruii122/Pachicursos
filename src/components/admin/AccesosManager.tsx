"use client";

import { grantAccess, updatePurchaseEstado } from "@/app/admin/cursos/[id]/accesos/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const card = "rounded-[14px] bg-white p-6 shadow-[0_8px_20px_rgba(78,15,38,.08)]";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  fallido: "Fallido",
  reembolsado: "Reembolsado",
  revocado: "Revocado",
};

interface Purchase {
  id: string;
  monto: number;
  proveedor_pago: string;
  estado: string;
  fecha: string;
  profiles: { nombre: string | null; email: string | null } | null;
}

export function AccesosManager({ courseId, purchases }: { courseId: string; purchases: Purchase[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otorgando, setOtorgando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOtorgar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setOtorgando(true);
    setError(null);
    const result = await grantAccess(courseId, email.trim());
    setOtorgando(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setEmail("");
    router.refresh();
  };

  const handleEstado = async (purchaseId: string, estado: "revocado" | "reembolsado") => {
    const confirmMsg =
      estado === "revocado"
        ? "¿Revocar este acceso? No se devuelve dinero automáticamente — esto solo quita el acceso en el sistema."
        : "¿Marcar como reembolsado? No devuelve la plata automáticamente — hacé la devolución real aparte en Flow.cl/Stripe. Esto solo actualiza el registro.";
    if (!confirm(confirmMsg)) return;
    setError(null);
    const result = await updatePurchaseEstado(courseId, purchaseId, estado);
    if ("error" in result) setError(result.error);
    else router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className={card}>
        <h2 className="mb-1 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
          Otorgar acceso manual
        </h2>
        <p className="mb-4 text-[.8rem] text-[var(--tinta-suave)]">
          El alumno tiene que tener una cuenta creada primero. No se cobra nada.
        </p>
        <form onSubmit={handleOtorgar} className="flex items-end gap-3">
          <div className="flex-1">
            <input
              type="email"
              className="w-full rounded-lg border border-[var(--linea)] px-3 py-2 text-sm outline-none focus:border-[var(--carmin)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
            />
          </div>
          <button
            type="submit"
            disabled={otorgando || !email.trim()}
            className="rounded-full bg-[var(--vino)] px-5 py-2 font-[family-name:var(--font-ui)] text-[.85rem] text-white disabled:opacity-50"
          >
            Otorgar acceso
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-[var(--dorado-osc)]">{error}</p>}
      </div>

      <div className={card}>
        <h2 className="mb-4 font-[family-name:var(--font-ui)] text-[.95rem] font-semibold text-[var(--vino)]">
          Accesos y compras ({purchases.length})
        </h2>
        {purchases.length === 0 ? (
          <p className="text-sm text-[var(--tinta-suave)]">Todavía no hay compras ni accesos otorgados.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-[var(--linea)] p-3 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{p.profiles?.nombre || p.profiles?.email || "—"}</p>
                  <p className="text-[.78rem] text-[var(--tinta-suave)]">
                    {p.proveedor_pago === "manual" ? "Otorgado manualmente" : p.proveedor_pago} ·{" "}
                    {new Date(p.fecha).toLocaleDateString("es-CL")}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--crema-2)] px-3 py-1 text-[.72rem] uppercase text-[var(--tinta-suave)]">
                  {ESTADO_LABEL[p.estado] ?? p.estado}
                </span>
                {p.estado === "pagado" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEstado(p.id, "revocado")}
                      className="text-[.78rem] text-[var(--dorado-osc)]"
                    >
                      Revocar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEstado(p.id, "reembolsado")}
                      className="text-[.78rem] text-[var(--tinta-suave)] underline"
                    >
                      Marcar reembolsado
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
