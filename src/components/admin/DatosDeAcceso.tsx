"use client";

import { useState } from "react";

// Panel "Datos de acceso" (pantalla 4 de la maqueta): muestra dirección,
// correo y contraseña UNA sola vez + botón para copiar el mensaje listo para
// enviarlo. Se usa al crear una cuenta y al asignar contraseña nueva.
export function DatosDeAcceso({
  url,
  email,
  password,
  mensaje,
}: {
  url: string;
  email: string;
  password: string;
  mensaje: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copia el mensaje:", mensaje);
    }
  };

  return (
    <div className="rounded-[var(--radio-lg)] border border-[var(--linea)] bg-[var(--rosa)] p-5">
      <p className="font-[family-name:var(--font-heading)] text-[1.05rem] text-[var(--vino-osc)]">Datos de acceso</p>
      <p className="mt-1 text-[.8rem] leading-snug text-[var(--tinta-suave)]">
        Cópialos y envíaselos. La contraseña no se volverá a mostrar; siempre puedes asignar una nueva.
      </p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-[var(--radio-sm)] bg-white p-4 font-mono text-[.8rem]">
        <dt className="text-[var(--tinta-suave)]">Dirección</dt>
        <dd className="break-all text-[var(--tinta)]">{url.replace(/^https?:\/\//, "")}</dd>
        <dt className="text-[var(--tinta-suave)]">Correo</dt>
        <dd className="break-all text-[var(--tinta)]">{email}</dd>
        <dt className="text-[var(--tinta-suave)]">Contraseña</dt>
        <dd className="font-semibold text-[var(--vino-osc)]">{password}</dd>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiar}
          className="rounded-full bg-[var(--vino)] px-5 py-2.5 font-[family-name:var(--font-ui)] text-[.82rem] font-medium text-white transition-colors hover:bg-[var(--vino-claro)]"
        >
          {copiado ? "¡Copiado!" : "Copiar mensaje con los datos"}
        </button>
      </div>
    </div>
  );
}
