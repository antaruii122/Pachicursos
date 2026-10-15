// Datos del programa que NO viven en la base de datos (aún). Vienen del diseño
// y del mensaje de Pachi del 2026-10-16. Cuando haya más de una generación o
// programa con datos propios, esto pasa a columnas de `courses`.

export const PROGRAMA = {
  generacion: "Generación 2027",
  // [VERIFY: Pachi] correo de soporte académico. Mientras sea null no se
  // muestra ninguna línea de soporte (nunca un placeholder a las alumnas).
  soporteEmail: null as string | null,
} as const;

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;
