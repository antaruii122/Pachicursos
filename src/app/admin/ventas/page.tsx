import { createClient } from "@/lib/supabase/server";
import { formatCLP } from "@/lib/types";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  fallido: "Fallido",
  reembolsado: "Reembolsado",
  revocado: "Revocado",
};

export default async function VentasPage() {
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("purchases")
    .select("id, monto, proveedor_pago, estado, fecha, profiles(nombre, email), courses(titulo, slug)")
    .order("fecha", { ascending: false })
    .limit(200);

  const ventas = (raw ?? []).map((v) => ({
    ...v,
    profiles: Array.isArray(v.profiles) ? (v.profiles[0] ?? null) : v.profiles,
    courses: Array.isArray(v.courses) ? (v.courses[0] ?? null) : v.courses,
  }));

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold text-[var(--vino)]">
        Ventas y alumnos
      </h1>

      {ventas.length === 0 ? (
        <p className="text-sm text-[var(--tinta-suave)]">Todavía no hay ventas ni accesos otorgados.</p>
      ) : (
        <div className="overflow-x-auto rounded-[14px] bg-white shadow-[0_8px_20px_rgba(78,15,38,.08)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--linea)] font-[family-name:var(--font-ui)] text-[.78rem] uppercase text-[var(--tinta-suave)]">
                <th className="px-5 py-3">Alumna</th>
                <th className="px-5 py-3">Curso</th>
                <th className="px-5 py-3">Monto</th>
                <th className="px-5 py-3">Vía</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id} className="border-b border-[var(--linea)] last:border-0">
                  <td className="px-5 py-3">{v.profiles?.nombre || v.profiles?.email || "—"}</td>
                  <td className="px-5 py-3">{v.courses?.titulo ?? "—"}</td>
                  <td className="px-5 py-3">{formatCLP(v.monto)}</td>
                  <td className="px-5 py-3 capitalize">{v.proveedor_pago}</td>
                  <td className="px-5 py-3">{ESTADO_LABEL[v.estado] ?? v.estado}</td>
                  <td className="px-5 py-3 text-[var(--tinta-suave)]">
                    {new Date(v.fecha).toLocaleDateString("es-CL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
