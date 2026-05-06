/**
 * Cliente para las APIs públicas del BCRA.
 *
 * Endpoints oficiales (sin autenticación):
 *
 * Estadísticas Monetarias v4.0
 *  - GET /estadisticas/v4.0/monetarias                       (listado de variables)
 *  - GET /estadisticas/v4.0/monetarias/{id}                  (serie histórica)
 *  - GET /estadisticas/v4.0/metodologia/{id}                 (descripción)
 *
 * Estadísticas Cambiarias v1.0
 *  - GET /estadisticascambiarias/v1.0/Cotizaciones
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
 *  - GET /transparencia/v1.0/Prestamos/Personales
 *  - GET /transparencia/v1.0/Prestamos/Hipotecarios
 *  - GET /transparencia/v1.0/Prestamos/Prendarios
 *  - GET /transparencia/v1.0/TarjetasCredito
 */

const BCRA_BASE = "https://api.bcra.gob.ar";

export const TTL = {
  variables: 60 * 30,
  serie: 60 * 30,
  cotizaciones: 60 * 15,
  deudores: 60 * 60 * 6,
  cheques: 60 * 60 * 6,
  entidades: 60 * 60 * 24, // listas estables, 1 día
  transparencia: 60 * 60 * 6, // bancos actualizan ocasionalmente
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

// --- Deudores ---

export interface DeudaEntidad {
  entidad: string;
  situacion: number;
  fechaSit1?: string;
  monto: number; // miles de pesos
  diasAtrasoPago?: number;
  refinanciaciones?: boolean;
  recategorizacionOblig?: boolean;
  situacionJuridica?: boolean;
  irrecDisposicionTecnica?: boolean;
  enRevision?: boolean;
  procesoJud?: boolean;
}

export interface DeudaPeriodo {
  periodo: string; // YYYYMM
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

// --- Cheques denunciados ---

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
  // pueden venir más campos según rechazo/denuncia
}

// --- Transparencia ---

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
  relacionMontoTasacion?: number; // hipotecarios y prendarios
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
//   Helper
// ======================================================================

export class BcraError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

async function bcraFetch<T>(path: string, revalidate: number): Promise<T> {
  const url = `${BCRA_BASE}${path}`;
  const res = await fetch(url, {
    next: { revalidate },
    headers: { "Accept-Language": "es-AR", "User-Agent": "panel-bcra/2.0" },
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

// ======================================================================
//   Estadísticas Monetarias v4.0
// ======================================================================

export async function getVariables(): Promise<Variable[]> {
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
    60 * 5, // 5 min, son consultas únicas
  );
  return data.results;
}

// ======================================================================
//   Régimen de Transparencia v1.0
// ======================================================================

export async function getCajasAhorros(): Promise<CajaAhorro[]> {
  const data = await bcraFetch<{ results: CajaAhorro[] }>(
    "/transparencia/v1.0/CajasAhorros",
    TTL.transparencia,
  );
  return data.results ?? [];
}

export async function getPaquetesProductos(): Promise<PaqueteProducto[]> {
  const data = await bcraFetch<{ results: PaqueteProducto[] }>(
    "/transparencia/v1.0/PaquetesProductos",
    TTL.transparencia,
  );
  return data.results ?? [];
}

export async function getPlazosFijos(): Promise<PlazoFijo[]> {
  const data = await bcraFetch<{ results: PlazoFijo[] }>(
    "/transparencia/v1.0/PlazosFijos",
    TTL.transparencia,
  );
  return data.results ?? [];
}

export async function getPrestamosPersonales(): Promise<Prestamo[]> {
  const data = await bcraFetch<{ results: Prestamo[] }>(
    "/transparencia/v1.0/Prestamos/Personales",
    TTL.transparencia,
  );
  return data.results ?? [];
}

export async function getPrestamosHipotecarios(): Promise<Prestamo[]> {
  const data = await bcraFetch<{ results: Prestamo[] }>(
    "/transparencia/v1.0/Prestamos/Hipotecarios",
    TTL.transparencia,
  );
  return data.results ?? [];
}

export async function getPrestamosPrendarios(): Promise<Prestamo[]> {
  const data = await bcraFetch<{ results: Prestamo[] }>(
    "/transparencia/v1.0/Prestamos/Prendarios",
    TTL.transparencia,
  );
  return data.results ?? [];
}

export async function getTarjetasCredito(): Promise<Tarjeta[]> {
  const data = await bcraFetch<{ results: Tarjeta[] }>(
    "/transparencia/v1.0/TarjetasCredito",
    TTL.transparencia,
  );
  return data.results ?? [];
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

/** Limpia nombres de banco "BANCO DE GALICIA Y BUENOS AIRES S.A.U." → "Banco Galicia". */
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
