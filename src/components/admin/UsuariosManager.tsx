"use client";

import { grantAccessToUser, updatePurchaseEstado } from "@/app/admin/cursos/[id]/accesos/actions";
import { asignarContrasenaNueva, setUserRole, type ResultadoAcceso } from "@/app/admin/usuarios/actions";
import { DatosDeAcceso } from "@/components/admin/DatosDeAcceso";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Usuario {
  id: string;
  nombre: string | null;
  email: string | null;
  role: string;
  created_at: string;
  accesos: { purchaseId: string; courseId: string; titulo: string }[];
}

interface Curso {
  id: string;
  titulo: string;
  estado: string;
}

const card = "rounded-[14px] bg-white shadow-[var(--sombra-md)]";

export function UsuariosManager({
  usuarios,
  cursos,
  currentUserId,
}: {
  usuarios: Usuario[];
  cursos: Curso[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceso, setAcceso] = useState<{ quien: string; datos: Extract<ResultadoAcceso, { ok: true }> } | null>(null);

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (u.nombre ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
  });

  // Asignar / quitar curso directo desde la fila (pedido de Ricardo
  // 2026-09-30: "una forma más fácil de trabajar para el admin").
  const handleAsignar = async (u: Usuario, courseId: string) => {
    if (!courseId) return;
    setCambiando(u.id);
    setError(null);
    const result = await grantAccessToUser(courseId, u.id);
    setCambiando(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  };

  const handleQuitar = async (u: Usuario, a: Usuario["accesos"][number]) => {
    if (!confirm(`¿Quitarle a ${u.nombre || u.email} el acceso a "${a.titulo}"? No devuelve dinero, solo deja de ver el curso.`)) return;
    setCambiando(u.id);
    setError(null);
    const result = await updatePurchaseEstado(a.courseId, a.purchaseId, "revocado");
    setCambiando(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  };

  // Contraseña nueva sin depender del correo (el SMTP por defecto de Supabase
  // no le envía correos a las alumnas) — el admin se la envía copiando el mensaje.
  const handleContrasena = async (u: Usuario) => {
    if (!confirm(`¿Asignarle una contraseña nueva a ${u.nombre || u.email}? La actual dejará de funcionar.`)) return;
    setCambiando(u.id);
    setError(null);
    setAcceso(null);
    const r = await asignarContrasenaNueva(u.id);
    setCambiando(null);
    if ("error" in r) setError(r.error);
    else {
      setAcceso({ quien: u.nombre || u.email || "", datos: r });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
      {acceso && (
        <div className="max-w-xl">
          <p className="mb-2 font-[family-name:var(--font-ui)] text-[.8rem] text-[var(--tinta-suave)]">
            Contraseña nueva para <b className="text-[var(--tinta)]">{acceso.quien}</b>:
          </p>
          <DatosDeAcceso {...acceso.datos} />
          <button type="button" onClick={() => setAcceso(null)} className="mt-2 text-[.78rem] text-[var(--tinta-suave)] underline">
            Listo, cerrar
          </button>
        </div>
      )}

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
                <td className="px-5 py-3">
                  <div className="flex max-w-[360px] flex-wrap items-center gap-1.5">
                    {u.accesos.map((a) => (
                      <span
                        key={a.purchaseId}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--rosa)] py-1 pl-3 pr-1 font-[family-name:var(--font-ui)] text-[.72rem] text-[var(--vino)]"
                      >
                        {a.titulo}
                        <button
                          type="button"
                          onClick={() => handleQuitar(u, a)}
                          disabled={cambiando === u.id}
                          aria-label={`Quitar acceso a ${a.titulo}`}
                          className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {cursos.some((c) => !u.accesos.some((a) => a.courseId === c.id)) && (
                      <select
                        aria-label={`Asignar curso a ${u.nombre || u.email}`}
                        value=""
                        disabled={cambiando === u.id}
                        onChange={(e) => handleAsignar(u, e.target.value)}
                        className="rounded-full border border-dashed border-[var(--vino)] bg-white px-2.5 py-1 font-[family-name:var(--font-ui)] text-[.72rem] text-[var(--vino)]"
                      >
                        <option value="">{cambiando === u.id ? "Guardando..." : "+ Asignar curso"}</option>
                        {cursos
                          .filter((c) => !u.accesos.some((a) => a.courseId === c.id))
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.titulo}
                              {c.estado !== "publicado" ? " (borrador)" : ""}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-[var(--tinta-suave)]">
                  {new Date(u.created_at).toLocaleDateString("es-CL")}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    disabled={cambiando === u.id}
                    onClick={() => handleContrasena(u)}
                    className="mr-4 text-[.8rem] text-[var(--vino)] underline disabled:opacity-40"
                  >
                    Nueva contraseña
                  </button>
                  <button
                    type="button"
                    disabled={cambiando === u.id || (u.id === currentUserId && u.role === "admin")}
                    onClick={() => handleCambiarRole(u)}
                    title={u.id === currentUserId && u.role === "admin" ? "No puedes quitarte tu propio rol de admin" : ""}
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
