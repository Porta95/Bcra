export type Tipo =
  | "billeteras"
  | "plazos-fijos"
  | "personales"
  | "hipotecarios"
  | "prendarios"
  | "tarjetas"
  | "cajas"
  | "paquetes";

export const TIPOS: { id: Tipo; label: string; corto: string }[] = [
  { id: "billeteras", label: "Billeteras / Cuentas", corto: "BV" },
  { id: "plazos-fijos", label: "Plazos Fijos", corto: "PF" },
  { id: "personales", label: "Préstamos Personales", corto: "PP" },
  { id: "hipotecarios", label: "Préstamos Hipotecarios", corto: "PH" },
  { id: "prendarios", label: "Préstamos Prendarios", corto: "PR" },
  { id: "tarjetas", label: "Tarjetas de Crédito", corto: "TC" },
  { id: "cajas", label: "Cajas de Ahorro", corto: "CA" },
  { id: "paquetes", label: "Paquetes", corto: "PQ" },
];
