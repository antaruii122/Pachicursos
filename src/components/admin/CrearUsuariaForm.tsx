"use client";

import { crearUsuaria, type ResultadoAcceso } from "@/app/admin/usuarios/actions";
import { DatosDeAcceso } from "@/components/admin/DatosDeAcceso";
import { campusCard } from "@/components/campus/ui";
import Link from "next/link";
import { useState } from "react";

const input =
  "w-full rounded-[var(--radio-sm)] border border-[var(--linea)] bg-white px-3.5 py-2.5 text-sm outline-none transition-[border-color,box-shadow] focus:border-[var(--vino)] focus:shadow-[0_0_0_3px_var(--rosa)]";
const label = "mb-1.5 block font-[family-name:var(--font-ui)] text-[.78rem] font-medium text-[var(--tinta)]";

// Pantalla 4 de la maqueta: el admin crea la cuenta (sin que la alumna se
// registre), elige el curso, y recibe el mensaje de bienvenida para copiar.
export function CrearUsuariaForm({ cursos }: { cursos: { id: string; titulo: string; estado: string }[] }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"alumno" | "admin">("alumno");
  const [courseId, setCourseId] = useState(cursos.find((c) => c.estado === "publicado")?.id ?? "");
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAcceso | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setResultado(null);
    const r = await crearUsuaria({ nombre, email, password, rol, courseId: courseId || null });
    setGuardando(false);
    setResultado(r);
    if ("ok" in r) {
      setNombre("");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
      <form onSubmit={enviar} className={`${campusCard} p-6`}>
        <p className="font-[family-name:var(--font-heading)] text-[1.1rem] text-[var(--vino-osc)]">Datos de la cuenta</p>
        <p className="mb-5 text-[.8rem] text-[var(--tinta-suave)]">Tú defines el correo y la contraseña. No hace falta que se registre.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cu-nombre" className={label}>Nombre completo</label>
            <input id="cu-nombre" required className={input} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Camila Torres" />
          </div>
          <div>
            <label htmlFor="cu-email" className={label}>Correo electrónico</label>
            <input id="cu-email" type="email" required className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="camila@correo.cl" />
          </div>
          <div>
            <label htmlFor="cu-pass" className={label}>Contraseña</label>
            <input id="cu-pass" className={input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Déjala vacía para generar una" autoComplete="new-password" />
            <p className="mt-1 text-[.72rem] text-[var(--tinta-suave)]">Mínimo 8 caracteres.</p>
          </div>
          <div>
            <label htmlFor="cu-rol" className={label}>Tipo de usuario</label>
            <select id="cu-rol" className={input} value={rol} onChange={(e) => setRol(e.target.value as "alumno" | "admin")}>
              <option value="alumno">Alumna</option>
              <option value="admin">Administradora</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cu-curso" className={label}>Dar acceso a</label>
            <select id="cu-curso" className={input} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Ningún curso por ahora</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                  {c.estado !== "publicado" ? " (borrador)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {resultado && "error" in resultado && (
          <p role="alert" className="mt-4 text-sm text-[var(--dorado-osc)]">{resultado.error}</p>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="mt-6 rounded-full bg-[var(--vino)] px-7 py-2.5 font-[family-name:var(--font-ui)] text-[.85rem] font-medium text-white transition-colors hover:bg-[var(--vino-claro)] disabled:opacity-60"
        >
          {guardando ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        <p className="font-[family-name:var(--font-ui)] text-[.66rem] font-semibold uppercase tracking-[.16em] text-[var(--tinta-suave)]">
          Al guardar aparece esto
        </p>
        {resultado && "ok" in resultado ? (
          <>
            <DatosDeAcceso url={resultado.url} email={resultado.email} password={resultado.password} mensaje={resultado.mensaje} />
            {resultado.aviso && <p role="alert" className="text-sm text-[var(--dorado-osc)]">{resultado.aviso}</p>}
            <div className={`${campusCard} p-5`}>
              <div className="flex items-center justify-between">
                <p className="font-[family-name:var(--font-ui)] text-[.85rem] font-medium">Estado de la cuenta</p>
                <span className="rounded-full bg-[var(--crema-2)] px-2.5 py-0.5 text-[.72rem] text-[var(--ok)]">Activa</span>
              </div>
              <p className="mt-1 text-[.78rem] text-[var(--tinta-suave)]">
                Desde{" "}
                <Link href="/admin/usuarios" className="text-[var(--vino)] underline underline-offset-4">
                  Alumnas y usuarios
                </Link>{" "}
                puedes asignar otros cursos, quitar el acceso o darle una contraseña nueva.
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-[var(--radio-lg)] border-2 border-dashed border-[var(--linea)] p-6 text-[.82rem] text-[var(--tinta-suave)]">
            Aquí vas a ver el correo y la contraseña para enviarle, con un botón para copiar el mensaje completo.
          </div>
        )}
      </div>
    </div>
  );
}
