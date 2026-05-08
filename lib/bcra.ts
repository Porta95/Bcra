/**
 * Cliente para las APIs públicas del BCRA.
 *
 * Nota sobre cache:
 * Los endpoints de Régimen de Transparencia devuelven payloads grandes (miles
 * de combinaciones banco x producto x canal x territorio) que pueden superar
 * los 2 MB que tolera el Data Cache de Next.js. Por eso usamos
 * `cache: 'force-cache'` con headers HTTP en vez de `next.revalidate`, que
 * delega el cache al CDN (sin el límite de 2 MB) en lugar de al fs interno
 * de Next.js. Para los endpoints chicos (variables, deudas, cheques) seguimos
 * usando `revalidate` que es más eficiente.
 *
 * Endpoints oficiales (sin autenticación):
 *
 * Estadísticas Monetarias v4.0
 *  - GET /estadisticas/v4.0/monetarias                       (listado)
 *  - GET /estadisticas/v4.0/monetarias/{id}                  (serie histórica)
 *
 * Central de Deudores v1.0
 *  - GET /centraldedeudores/v1.0/Deudas/{cuit}
 *  - GET /centraldedeudores/v1.0/Deudas/Historicas/{cuit}
 *  - GET /centraldedeudores/v1.0/Deudas/ChequesRechazados/{cuit}
 *
 * Cheques Denunciados v1.0
 *  - GET /cheques/v1.0/entidades
 *  - GET /cheques/v1.0/denunciados/{codigoEntidad}/{numeroCheque}
 *
 * Régimen de Transparencia v1.0
 *  - GET /transparencia/v1.0/CajasAhorros
 *  - GET /transparencia/v1.0/PaquetesProductos
 *  - GET /transparencia/v1.0/PlazosFijos
 *  - GET /transparencia/v1.0/Prestamos/{Personales|Hipotecarios|Prendarios}
 *  - GET /transparencia/v1.0/TarjetasCredito
 */

const BCRA_BASE = "https://api.bcra.gob.ar";

export const TTL = {
  variables: 60 * 30,
  serie: 60 * 30,
  deudores: 60 * 60 * 6,
  cheques: 60 * 60 * 6,
  entidades: 60 * 60 * 24,
};

// ======================================================================
//   Tipos
// ======================================================================

export interface Variable {
  idVariable: number;
  descripcion: string;
  categoria: string;
  tipoSerie: string;
  periodicidad: string;
  unidadExpresion: string;
  moneda: string;
  primerFechaInformada: string;
  ultFechaInformada: string;
  ultValorInformado: number;
}

export interface SeriePoint {
  fecha: string;
  valor: number;
}

interface SerieRawResult {
  idVariable: number;
  detalle: SeriePoint[];
}

export interface DeudaEntidad {
  entidad: string;
  situacion: number;
  fechaSit1?: string;
  monto: number;
  diasAtrasoPago?: number;
  refinanciaciones?: boolean;
  recategorizacionOblig?: boolean;
  situacionJuridica?: boolean;
  irrecDisposicionTecnica?: boolean;
  enRevision?: boolean;
  procesoJud?: boolean;
}

export interface DeudaPeriodo {
  periodo: string;
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

export interface EntidadCheques {
  codigoEntidad: number;
  denominacion: string;
}

export interface ChequeDenunciado {
  numeroCheque: number;
  denunciado: boolean;
  fechaProcesamiento?: string;
  denominacionEntidad?: string;
  detalle?: string;
}

export interface CajaAhorro {
  codigoEntidad: number;
  descripcionEntidad: string;
  fechaInformacion: string;
  procesoSimplificadoDebidaDiligencia: string;
}

export interface PaqueteProducto {
  codigoEntidad: number;
  descripcionEntidad: string;
  fechaInformacion: string;
  nombreCompleto: string;
  nombreCorto: string;
  comisionMaximaMantenimiento: number;
  ingresoMinimoMensual: number;
  antiguedadLaboralMinimaMeses: number;
  edadMaximaSolicitada: number;
  beneficiarios: string;
  segmento: string;
  productosIntegrantes: string;
  territorioValidez: string;
  masInformacion: string | null;
}

export interface PlazoFijo {
  codigoEntidad: number;
  descripcionEntidad: string;
  fechaInformacion: string;
  nombreCompleto: string;
  nombreCorto: string;
  denominacion: string | null;
  montoMinimoInvertir: number;
  plazoMinimoInvertirDias: number;
  canalConstitucion: string;
  tasaEfectivaAnualMinima: number;
  territorioValidez: string;
  masInformacion: string | null;
}

export interface Prestamo {
  codigoEntidad: number;
  descripcionEntidad: string;
  fechaInformacion: string;
  nombreCompleto: string;
  nombreCorto: string;
  denominacion: string;
  montoMinimoOtorgable?: number;
  montoMaximoOtorgable: number;
  plazoMaximoOtorgable: number;
  ingresoMinimoMensual: number;
  antiguedadLaboralMinimaMeses: number;
  edadMaximaSolicitada: number;
  relacionCuotaIngreso: number;
  relacionMontoTasacion?: number;
  destinoFondos?: string;
  beneficiario: string;
  cargoMaximoCancelacionAnticipada: number;
  tasaEfectivaAnualMaxima: number;
  tipoTasa: string;
  costoFinancieroEfectivoTotalMaximo: number;
  cuotaInicial: number;
  territorioValidez: string;
  masInformacion: string | null;
}

export interface Tarjeta {
  codigoEntidad: number;
  descripcionEntidad: string;
  fechaInformacion: string;
  nombreCompleto: string;
  nombreCorto: string;
  comisionMaximaAdministracionMantenimiento: number;
  comisionMaximaRenovacion: number;
  tasaEfectivaAnualMaximaFinanciacion: number;
  tasaEfectivaAnualMaximaAdelantoEfectivo: number;
  ingresoMinimoMensual: number;
  antiguedadLaboralMinimaMeses: number;
  edadMaximaSolicitada: number;
  segmento: string;
  territorioValidez: string;
  masInformacion: string | null;
}

// ======================================================================
//   Helpers
// ======================================================================

export class BcraError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

/**
 * Fetch para endpoints "chicos" - usa el Data Cache de Next.js (límite 2 MB).
 */
async function bcraFetch<T>(path: string, revalidate: number): Promise<T> {
  const url = `${BCRA_BASE}${path}`;
  const res = await fetch(url, {
    next: { revalidate },
    headers: { "Accept-Language": "es-AR", "User-Agent": "panel-bcra/2.0" },
  });

  if (res.status === 404) throw new BcraError("No encontrado", 404);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new BcraError(
      `BCRA respondió ${res.status}: ${txt.slice(0, 200)}`,
      res.status,
    );
  }
  return (await res.json()) as T;
}

/**
 * Fetch para endpoints "grandes" (Régimen de Transparencia). Evita el
 * Data Cache de Next.js (límite 2 MB) usando `cache: 'no-store'`. Confiamos
 * en el cache de la página (`revalidate` a nivel page.tsx) y en que el ISR
 * de Vercel sirva la HTML pre-renderizada desde el CDN.
 */
async function bcraFetchLarge<T>(path: string): Promise<T> {
  const url = `${BCRA_BASE}${path}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Accept-Language": "es-AR", "User-Agent": "panel-bcra/2.0" },
  });

  if (res.status === 404) throw new BcraError("No encontrado", 404);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new BcraError(
      `BCRA respondió ${res.status}: ${txt.slice(0, 200)}`,
      res.status,
    );
  }
  return (await res.json()) as T;
}

// ======================================================================
//   Estadísticas Monetarias v4.0
// ======================================================================

export async function getVariables(): Promise<Variable[]> {
  // ~1100 variables; el JSON pesa <1MB, entra en el data cache.
  const data = await bcraFetch<{ results: Variable[] }>(
    "/estadisticas/v4.0/monetarias?limit=3000",
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

  const data = await bcraFetch<{ results: SerieRawResult[] }>(
    `/estadisticas/v4.0/monetarias/${idVariable}${qs}`,
    TTL.serie,
  );
  const detalle = data.results?.[0]?.detalle ?? [];
  return [...detalle].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ======================================================================
//   Central de Deudores v1.0
// ======================================================================

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

// ======================================================================
//   Cheques Denunciados v1.0
// ======================================================================

export async function getEntidadesCheques(): Promise<EntidadCheques[]> {
  const data = await bcraFetch<{ results: EntidadCheques[] }>(
    "/cheques/v1.0/entidades",
    TTL.entidades,
  );
  return data.results ?? [];
}

export async function consultarChequeDenunciado(
  codigoEntidad: number,
  numeroCheque: number,
): Promise<ChequeDenunciado> {
  const data = await bcraFetch<{ results: ChequeDenunciado }>(
    `/cheques/v1.0/denunciados/${codigoEntidad}/${numeroCheque}`,
    60 * 5,
  );
  return data.results;
}

// ======================================================================
//   Régimen de Transparencia v1.0
//
//   Estos endpoints traen mucha duplicación (mismo producto declarado
//   por canal y territorio). Deduplicamos en el server para que el
//   payload que llega al cliente sea manejable.
// ======================================================================

/**
 * Reduce duplicados de productos transparencia.
 *
 * Las entidades declaran el mismo producto repetido por cada combinación
 * de territorio/canal. Para el comparador quedamos con la mejor entrada
 * por (entidad + nombreCorto + denominacion).
 */
function dedup<T extends Record<string, any>>(
  rows: T[],
  keyFn: (r: T) => string,
  betterFn?: (a: T, b: T) => T,
): T[] {
  const map = new Map<string, T>();
  for (const r of rows) {
    const k = keyFn(r);
    const prev = map.get(k);
    if (!prev) {
      map.set(k, r);
    } else if (betterFn) {
      map.set(k, betterFn(prev, r));
    }
  }
  return Array.from(map.values());
}

export async function getCajasAhorros(): Promise<CajaAhorro[]> {
  const data = await bcraFetchLarge<{ results: CajaAhorro[] }>(
    "/transparencia/v1.0/CajasAhorros",
  );
  return data.results ?? [];
}

export async function getPaquetesProductos(): Promise<PaqueteProducto[]> {
  const data = await bcraFetchLarge<{ results: PaqueteProducto[] }>(
    "/transparencia/v1.0/PaquetesProductos",
  );
  const rows = data.results ?? [];
  return dedup(
    rows,
    (r) => `${r.codigoEntidad}|${r.nombreCorto}|${r.segmento}`,
    (a, b) =>
      (a.comisionMaximaMantenimiento ?? Infinity) <
      (b.comisionMaximaMantenimiento ?? Infinity)
        ? a
        : b,
  );
}

export async function getPlazosFijos(): Promise<PlazoFijo[]> {
  const data = await bcraFetchLarge<{ results: PlazoFijo[] }>(
    "/transparencia/v1.0/PlazosFijos",
  );
  const rows = data.results ?? [];
  // Quedo con la mejor TEA por (entidad + producto + denominación)
  return dedup(
    rows,
    (r) => `${r.codigoEntidad}|${r.nombreCorto}|${r.denominacion ?? "-"}`,
    (a, b) =>
      (a.tasaEfectivaAnualMinima ?? 0) > (b.tasaEfectivaAnualMinima ?? 0)
        ? a
        : b,
  );
}

export async function getPrestamosPersonales(): Promise<Prestamo[]> {
  const data = await bcraFetchLarge<{ results: Prestamo[] }>(
    "/transparencia/v1.0/Prestamos/Personales",
  );
  const rows = data.results ?? [];
  // Quedo con la TEA más baja (mejor para el deudor)
  return dedup(
    rows,
    (r) => `${r.codigoEntidad}|${r.nombreCorto}|${r.denominacion}|${r.beneficiario}`,
    (a, b) =>
      (a.tasaEfectivaAnualMaxima ?? Infinity) <
      (b.tasaEfectivaAnualMaxima ?? Infinity)
        ? a
        : b,
  );
}

export async function getPrestamosHipotecarios(): Promise<Prestamo[]> {
  const data = await bcraFetchLarge<{ results: Prestamo[] }>(
    "/transparencia/v1.0/Prestamos/Hipotecarios",
  );
  const rows = data.results ?? [];
  return dedup(
    rows,
    (r) =>
      `${r.codigoEntidad}|${r.nombreCorto}|${r.denominacion}|${r.destinoFondos ?? ""}`,
    (a, b) =>
      (a.tasaEfectivaAnualMaxima ?? Infinity) <
      (b.tasaEfectivaAnualMaxima ?? Infinity)
        ? a
        : b,
  );
}

export async function getPrestamosPrendarios(): Promise<Prestamo[]> {
  const data = await bcraFetchLarge<{ results: Prestamo[] }>(
    "/transparencia/v1.0/Prestamos/Prendarios",
  );
  const rows = data.results ?? [];
  return dedup(
    rows,
    (r) =>
      `${r.codigoEntidad}|${r.nombreCorto}|${r.denominacion}|${r.destinoFondos ?? ""}`,
    (a, b) =>
      (a.tasaEfectivaAnualMaxima ?? Infinity) <
      (b.tasaEfectivaAnualMaxima ?? Infinity)
        ? a
        : b,
  );
}

export async function getTarjetasCredito(): Promise<Tarjeta[]> {
  const data = await bcraFetchLarge<{ results: Tarjeta[] }>(
    "/transparencia/v1.0/TarjetasCredito",
  );
  const rows = data.results ?? [];
  return dedup(
    rows,
    (r) => `${r.codigoEntidad}|${r.nombreCorto}|${r.segmento}`,
    (a, b) =>
      (a.tasaEfectivaAnualMaximaFinanciacion ?? Infinity) <
      (b.tasaEfectivaAnualMaximaFinanciacion ?? Infinity)
        ? a
        : b,
  );
}

// ======================================================================
//   Helpers de presentación
// ======================================================================

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

export function formatPct(valor: number): string {
  return `${formatNumber(valor)}%`;
}

export function shortBankName(name: string): string {
  if (!name) return "—";
  return name
    .replace(/\bS\.?A\.?U?\.?\b/gi, "")
    .replace(/\bSOCIEDAD ANÓNIMA\b/gi, "")
    .replace(/\bBANCO DE LA\b/gi, "Banco")
    .replace(/\bBANCO DEL?\b/gi, "Banco")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
