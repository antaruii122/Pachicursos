"use client";

import { setUserRole } from "@/app/admin/usuarios/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Usuario {
  id: string;
  nombre: string | null;
  email: string | null;
  role: string;
  created_at: string;
  cursosComprados: number;
}

const card = "rounded-[14px] bg-white shadow-[0_8px_20px_rgba(78,15,38,.08)]";

export function UsuariosManager({
  usuarios,
  currentUserId,
}: {
  usuarios: Usuario[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (u.nombre ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
  });

  const handleCambiarRole = async (u: Usuario) => {
    const nuevoRole = u.role === "admin" ? "alumno" : "admin";
    const msg =
      nuevoRole === "admin"
        ? `¿Convertir a "${u.nombre || u.email}" en administrador? Va a tener acceso completo al panel admin.`
        : `¿Quitarle el rol de admin a "${u.nombre || u.email}"?`;
    if (!confirm(msg)) return;

    setCambiando(u.id);
    setError(null);
    const result = await setUserRole(u.id, nuevoRole);
    setCambiando(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full max-w-sm rounded-lg border border-[var(--linea)] px-3 py-2 text-sm outline-none focus:border-[var(--carmin)]"
      />
      {error && <p role="alert" className="text-sm text-[var(--dorado-osc)]">{error}</p>}

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--linea)] font-[family-name:var(--font-ui)] text-[.75rem] uppercase text-[var(--tinta-suave)]">
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Rol</th>
              <th className="px-5 py-3">Cursos</th>
              <th className="px-5 py-3">Miembro desde</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id} className="border-b border-[var(--linea)] last:border-0">
                <td className="px-5 py-3">{u.nombre || "—"}</td>
                <td className="px-5 py-3 text-[var(--tinta-suave)]">{u.email || "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-[.72rem] uppercase ${
                      u.role === "admin" ? "bg-[var(--vino)] text-white" : "bg-[var(--crema-2)] text-[var(--tinta-suave)]"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3">{u.cursosComprados}</td>
                <td className="px-5 py-3 text-[var(--tinta-suave)]">
                  {new Date(u.created_at).toLocaleDateString("es-CL")}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    disabled={cambiando === u.id || (u.id === currentUserId && u.role === "admin")}
                    onClick={() => handleCambiarRole(u)}
                    title={u.id === currentUserId && u.role === "admin" ? "No podés quitarte tu propio rol de admin" : ""}
                    className="text-[.8rem] text-[var(--carmin)] underline disabled:cursor-not-allowed disabled:text-[var(--tinta-suave)] disabled:no-underline"
                  >
                    {cambiando === u.id
                      ? "Guardando..."
                      : u.role === "admin"
                        ? "Quitar admin"
                        : "Hacer admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <p className="p-5 text-sm text-[var(--tinta-suave)]">Sin resultados.</p>
        )}
      </div>
    </div>
  );
}
