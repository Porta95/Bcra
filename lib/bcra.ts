/**
 * Cliente para las APIs públicas del BCRA.
 *
 * Endpoints oficiales (sin autenticación):
 *  - https://api.bcra.gob.ar/estadisticas/v3.0/Monetarias
 *  - https://api.bcra.gob.ar/estadisticas/v3.0/Monetarias/{id}
 *  - https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Maestros/Divisas
 *  - https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones
 *  - https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/{cuit}
 *  - https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/Historicas/{cuit}
 *  - https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/ChequesRechazados/{cuit}
 *
 * El BCRA actualiza estos datos a diario, así que cacheamos agresivo en el
 * edge de Vercel con `next: { revalidate }`. Eso nos da un CDN gratis sin
 * tener que mantener un Redis.
 */

const BCRA_BASE = "https://api.bcra.gob.ar";

// TTL de cache en segundos
export const TTL = {
  variables: 60 * 30,   // listado de variables: 30 min
  serie: 60 * 30,       // serie histórica: 30 min
  cotizaciones: 60 * 15, // cotizaciones del día: 15 min
  deudores: 60 * 60 * 6, // deudas: el BCRA reporta mensual, 6h sobra
  cheques: 60 * 60 * 6,
};

// ---------- Tipos ----------

export interface Variable {
  idVariable: number;
  cdSerie: number;
  descripcion: string;
  fecha: string;          // YYYY-MM-DD
  valor: number;
  categoria?: string;
}

export interface SeriePoint {
  idVariable: number;
  fecha: string;
  valor: number;
}

export interface Cotizacion {
  codigoMoneda: string;
  descripcion: string;
  tipoPase: number;
  tipoCotizacion: number;
}

export interface CotizacionesResponse {
  fecha: string;
  detalle: Cotizacion[];
}

export interface DeudaEntidad {
  entidad: string;
  situacion: number;
  fechaSit1?: string;
  monto: number;            // en miles de pesos
  diasAtrasoPago?: number;
  refinanciaciones?: boolean;
  recategorizacionOblig?: boolean;
  situacionJuridica?: boolean;
  irrecDisposicionTecnica?: boolean;
  enRevision?: boolean;
  procesoJud?: boolean;
}

export interface DeudaPeriodo {
  periodo: string;          // YYYYMM
  entidades: DeudaEntidad[];
}

export interface DeudasResponse {
  identificacion: number;
  denominacion: string;
  periodos: DeudaPeriodo[];
}

export interface ChequeDetalle {
  nroCheque: number;
  fechaRechazo: string;
  monto: number;
  fechaPago?: string;
  fechaPagoMulta?: string;
  estadoMulta?: string;
  ctaPersonal?: boolean;
  denomJuridica?: string;
  enRevision?: boolean;
  procesoJud?: boolean;
}

export interface ChequeCausal {
  causal: string;
  detalle: ChequeDetalle[];
}

export interface ChequeEntidad {
  entidad: number;
  detalle: ChequeCausal[];
}

export interface ChequesResponse {
  identificacion: number;
  denominacion: string;
  causales: ChequeEntidad[];
}

// ---------- Helper ----------

async function bcraFetch<T>(path: string, revalidate: number): Promise<T> {
  const url = `${BCRA_BASE}${path}`;
  const res = await fetch(url, {
    next: { revalidate },
    headers: {
      "Accept-Language": "es-AR",
      "User-Agent": "panel-bcra/1.0",
    },
  });

  if (res.status === 404) {
    throw new BcraError("No encontrado", 404);
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new BcraError(
      `BCRA respondió ${res.status}: ${txt.slice(0, 200)}`,
      res.status,
    );
  }
  return (await res.json()) as T;
}

export class BcraError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

// ---------- Estadísticas Monetarias (v3.0) ----------

export async function getVariables(): Promise<Variable[]> {
  const data = await bcraFetch<{ results: Variable[] }>(
    "/estadisticas/v3.0/Monetarias",
    TTL.variables,
  );
  return data.results ?? [];
}

export async function getSerie(
  idVariable: number,
  desde?: string,
  hasta?: string,
  limit = 3000,
): Promise<SeriePoint[]> {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  params.set("limit", String(limit));

  const qs = params.toString() ? `?${params}` : "";
  const data = await bcraFetch<{ results: SeriePoint[] }>(
    `/estadisticas/v3.0/Monetarias/${idVariable}${qs}`,
    TTL.serie,
  );
  return data.results ?? [];
}

// ---------- Estadísticas Cambiarias ----------

export async function getCotizaciones(fecha?: string): Promise<CotizacionesResponse> {
  const qs = fecha ? `?fecha=${fecha}` : "";
  const data = await bcraFetch<{ results: CotizacionesResponse }>(
    `/estadisticascambiarias/v1.0/Cotizaciones${qs}`,
    TTL.cotizaciones,
  );
  return data.results;
}

// ---------- Central de Deudores ----------

export function normalizeCuit(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) {
    throw new BcraError("CUIT/CUIL/CDI debe tener 11 dígitos", 400);
  }
  return digits;
}

export async function getDeudas(cuit: string): Promise<DeudasResponse> {
  const id = normalizeCuit(cuit);
  const data = await bcraFetch<{ results: DeudasResponse }>(
    `/centraldedeudores/v1.0/Deudas/${id}`,
    TTL.deudores,
  );
  return data.results;
}

export async function getDeudasHistoricas(cuit: string): Promise<DeudasResponse> {
  const id = normalizeCuit(cuit);
  const data = await bcraFetch<{ results: DeudasResponse }>(
    `/centraldedeudores/v1.0/Deudas/Historicas/${id}`,
    TTL.deudores,
  );
  return data.results;
}

export async function getChequesRechazados(cuit: string): Promise<ChequesResponse> {
  const id = normalizeCuit(cuit);
  const data = await bcraFetch<{ results: ChequesResponse }>(
    `/centraldedeudores/v1.0/Deudas/ChequesRechazados/${id}`,
    TTL.cheques,
  );
  return data.results;
}

// ---------- Helpers de presentación ----------

const SITUACIONES: Record<number, { label: string; tone: "ok" | "warn" | "bad" }> = {
  1: { label: "Situación normal", tone: "ok" },
  2: { label: "Riesgo bajo / Seguimiento especial", tone: "warn" },
  3: { label: "Con problemas", tone: "warn" },
  4: { label: "Alto riesgo de insolvencia", tone: "bad" },
  5: { label: "Irrecuperable", tone: "bad" },
  6: { label: "Irrec. por disposición técnica", tone: "bad" },
};

export function describirSituacion(n: number) {
  return SITUACIONES[n] ?? { label: `Situación ${n}`, tone: "warn" as const };
}

export function formatARS(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatNumber(valor: number, decimals = 2): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(valor);
}
