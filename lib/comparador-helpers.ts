import { shortBankName } from "./bcra";
import type { Tipo } from "./transparencia";

export type SubTipoPF = "tradicional" | "uva" | "uva-precancelable";

export const SUBTIPOS_PF: { id: SubTipoPF; label: string }[] = [
  { id: "tradicional", label: "Tradicional" },
  { id: "uva", label: "UVA pago periódico" },
  { id: "uva-precancelable", label: "UVA precancelable" },
];

export function bucketPlazoFijo(r: any): SubTipoPF {
  const nc = String(r.nombreCorto ?? "").toUpperCase();
  const nco = String(r.nombreCompleto ?? "").toUpperCase();
  const full = `${nc} ${nco}`;
  if (/PRECANC/.test(full)) return "uva-precancelable";
  if (/UVA/.test(full)) return "uva";
  return "tradicional";
}

export function filterPlazosFijos(rows: any[], sub: SubTipoPF): any[] {
  return rows.filter((r) => bucketPlazoFijo(r) === sub);
}

/**
 * Para vistas tipo "lista de cards", dedupea por entidad quedándose con
 * la mejor entrada según cuál métrica le importa al tipo de producto.
 */
export function dedupeByBank(tipo: Tipo, rows: any[]): any[] {
  const map = new Map<number, any>();
  for (const r of rows) {
    const key = r.codigoEntidad as number;
    if (key === undefined || key === null) continue;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, r);
    } else if (isBetter(tipo, r, existing)) {
      map.set(key, r);
    }
  }
  return Array.from(map.values());
}

function isBetter(tipo: Tipo, a: any, b: any): boolean {
  switch (tipo) {
    case "plazos-fijos":
      return (a.tasaEfectivaAnualMinima ?? 0) > (b.tasaEfectivaAnualMinima ?? 0);
    case "personales":
    case "hipotecarios":
    case "prendarios":
      return (
        (a.tasaEfectivaAnualMaxima ?? Infinity) <
        (b.tasaEfectivaAnualMaxima ?? Infinity)
      );
    case "tarjetas":
      return (
        (a.tasaEfectivaAnualMaximaFinanciacion ?? Infinity) <
        (b.tasaEfectivaAnualMaximaFinanciacion ?? Infinity)
      );
    case "paquetes":
      return (
        (a.comisionMaximaMantenimiento ?? Infinity) <
        (b.comisionMaximaMantenimiento ?? Infinity)
      );
    case "cajas":
      return (
        (a.procesoSimplificadoDebidaDiligencia === "SI" ? 1 : 0) >
        (b.procesoSimplificadoDebidaDiligencia === "SI" ? 1 : 0)
      );
    case "billeteras":
      return (a.tna ?? 0) > (b.tna ?? 0);
  }
}

/**
 * Color hash simple para usar como bg de avatar de banco.
 * Determinístico por nombre — mismo banco = mismo color en cada render.
 */
const PALETTE = [
  "#5b8def",
  "#b06ab3",
  "#e74c3c",
  "#2ecc71",
  "#f39c12",
  "#1abc9c",
  "#9b59b6",
  "#3498db",
  "#e67e22",
  "#16a085",
  "#c0392b",
  "#27ae60",
  "#8e44ad",
  "#d35400",
];

const KNOWN_LOGOS: Record<
  string,
  { color: string; short: string; ink?: string }
> = {
  GALICIA: { color: "#FE6B00", short: "GA" },
  SANTANDER: { color: "#EC0000", short: "SA" },
  BBVA: { color: "#004481", short: "BB" },
  MACRO: { color: "#0F4C81", short: "MA" },
  NACION: { color: "#6CACE4", short: "BN" },
  ICBC: { color: "#E60012", short: "IC" },
  HSBC: { color: "#DB0011", short: "HS" },
  PROVINCIA: { color: "#2E5C99", short: "BP" },
  CIUDAD: { color: "#FFCC00", short: "CI", ink: "#000" },
  CREDICOOP: { color: "#1976D2", short: "CR" },
  PATAGONIA: { color: "#193375", short: "PA" },
  COMAFI: { color: "#0066B2", short: "CO" },
  SUPERVIELLE: { color: "#003F7F", short: "SU" },
  ITAU: { color: "#EC7000", short: "IT" },
  HIPOTECARIO: { color: "#00A19A", short: "HI" },
  CITY: { color: "#003D6E", short: "CT" },
  REBA: { color: "#00C896", short: "RB" },
  BRUBANK: { color: "#7C3AED", short: "BR" },
  WILOBANK: { color: "#EA580C", short: "WI" },
  OPENBANK: { color: "#FF1430", short: "OP" },
  UALA: { color: "#3FB55B", short: "UA" },
  NARANJA: { color: "#F7951F", short: "NJ" },
  // Billeteras y neobancos
  FIWIND: { color: "#00BCD4", short: "FW" },
  CARREFOUR: { color: "#1565C0", short: "CF" },
  MERCADO: { color: "#009EE3", short: "MP" },
  PERSONAL: { color: "#6200EA", short: "PP" },
  LEMON: { color: "#2E7D32", short: "LC" },
  CRESIUM: { color: "#37474F", short: "CS" },
};

// Bancos relevantes para el filtro de Plazo Fijo
export const BANCOS_RELEVANTES_KEYWORDS = new Set([
  "GALICIA", "SANTANDER", "BBVA", "MACRO", "NACION", "ICBC", "HSBC",
  "PROVINCIA", "CIUDAD", "CREDICOOP", "PATAGONIA", "COMAFI", "SUPERVIELLE",
  "ITAU", "HIPOTECARIO", "CITY", "REBA", "BRUBANK", "WILOBANK", "OPENBANK",
  "UALA", "NARANJA", "FRANCES", "COLUMBIA", "INDUSTRIAL",
]);

function hashColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h << 5) - h + c.charCodeAt(0);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export interface AvatarStyle {
  text: string;
  bg: string;
  ink: string;
}

export function avatarFor(name: string): AvatarStyle {
  const upper = (name ?? "").toUpperCase();
  for (const k of Object.keys(KNOWN_LOGOS)) {
    if (upper.includes(k)) {
      const v = KNOWN_LOGOS[k];
      return { text: v.short, bg: v.color, ink: v.ink ?? "#fff" };
    }
  }
  // Fallback: iniciales del banco normalizado
  const cleaned = shortBankName(name);
  const words = cleaned.split(/\s+/).filter((w) => w.length > 1);
  const text =
    words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
  return { text: text || "—", bg: hashColor(upper || "x"), ink: "#fff" };
}
