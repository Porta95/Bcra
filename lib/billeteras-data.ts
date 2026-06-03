/**
 * Tasas de billeteras virtuales y cuentas remuneradas.
 * BCRA no publica estas tasas en su API — cada empresa las fija libremente.
 * Actualizar manualmente cuando cambien las tasas.
 */

export interface Billetera {
  id: string;
  nombre: string;
  descripcionEntidad: string; // alias para compatibilidad con RowCard
  tipo: "billetera" | "cuenta-remunerada";
  tna: number;
  limiteARS?: number; // undefined = sin límite
  condicion?: string;
  group: "garantizado" | "condicional";
  soloJuridico?: boolean;
  updatedAt: string; // yyyy-mm-dd
}

// Tasas vigentes al 03/06/2026
// Fuente: apps y sitios web de cada entidad
export const BILLETERAS: Billetera[] = [
  // ── Rendimiento garantizado ──────────────────────────────────────────────
  {
    id: "fiwind",
    nombre: "Fiwind",
    descripcionEntidad: "Fiwind",
    tipo: "billetera",
    tna: 27,
    limiteARS: 750_000,
    group: "garantizado",
    updatedAt: "2026-06-03",
  },
  {
    id: "carrefour",
    nombre: "Carrefour Banco",
    descripcionEntidad: "Carrefour Banco",
    tipo: "cuenta-remunerada",
    tna: 21,
    limiteARS: undefined,
    group: "garantizado",
    updatedAt: "2026-05-28",
  },
  {
    id: "uala",
    nombre: "Ualá",
    descripcionEntidad: "Ualá",
    tipo: "cuenta-remunerada",
    tna: 20,
    limiteARS: 1_000_000,
    group: "garantizado",
    updatedAt: "2026-06-03",
  },
  {
    id: "naranja-x",
    nombre: "Naranja X",
    descripcionEntidad: "Naranja X",
    tipo: "cuenta-remunerada",
    tna: 18,
    limiteARS: 1_000_000,
    group: "garantizado",
    updatedAt: "2026-06-03",
  },
  {
    id: "mercado-pago",
    nombre: "Mercado Pago",
    descripcionEntidad: "Mercado Pago",
    tipo: "billetera",
    tna: 18,
    limiteARS: undefined,
    group: "garantizado",
    updatedAt: "2026-06-03",
  },
  {
    id: "personal-pay",
    nombre: "Personal Pay",
    descripcionEntidad: "Personal Pay",
    tipo: "billetera",
    tna: 17,
    limiteARS: undefined,
    group: "garantizado",
    updatedAt: "2026-06-03",
  },
  {
    id: "brubank",
    nombre: "Brubank",
    descripcionEntidad: "Brubank",
    tipo: "cuenta-remunerada",
    tna: 16.5,
    limiteARS: undefined,
    group: "garantizado",
    updatedAt: "2026-06-03",
  },
  {
    id: "lemon",
    nombre: "Lemon Cash",
    descripcionEntidad: "Lemon Cash",
    tipo: "billetera",
    tna: 16,
    limiteARS: undefined,
    group: "garantizado",
    updatedAt: "2026-06-03",
  },
  // ── Con condiciones especiales ───────────────────────────────────────────
  {
    id: "uala-plus2",
    nombre: "Ualá Plus 2",
    descripcionEntidad: "Ualá Plus 2",
    tipo: "cuenta-remunerada",
    tna: 26,
    limiteARS: 1_000_000,
    condicion:
      "Acumulá $500.000 entre inversiones y consumos para acceder a la tasa Plus 2 el próximo mes.",
    group: "condicional",
    updatedAt: "2026-06-03",
  },
  {
    id: "uala-plus1",
    nombre: "Ualá Plus 1",
    descripcionEntidad: "Ualá Plus 1",
    tipo: "cuenta-remunerada",
    tna: 23,
    limiteARS: 1_000_000,
    condicion:
      "Acumulá $250.000 entre inversiones y consumos para acceder a la tasa Plus 1 el próximo mes.",
    group: "condicional",
    updatedAt: "2026-06-03",
  },
  {
    id: "cresium",
    nombre: "Cresium",
    descripcionEntidad: "Cresium",
    tipo: "cuenta-remunerada",
    tna: 18.15,
    condicion: "Solo Personas Jurídicas.",
    group: "condicional",
    soloJuridico: true,
    updatedAt: "2026-06-03",
  },
];

export function getBilleterasUpdatedAt(): string {
  return BILLETERAS.map((b) => b.updatedAt).sort().reverse()[0] ?? "";
}
