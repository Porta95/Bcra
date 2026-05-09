import type {
  ChequesResponse,
  DeudaEntidad,
  DeudaPeriodo,
  DeudasResponse,
} from "./bcra";

export type Tipo =
  | "sin-antecedentes"
  | "limpio"
  | "con-seguimiento"
  | "refinanciado"
  | "rojo"
  | "critico";

export interface Tier {
  tipo: Tipo;
  label: string;
  short: string;
  tone: "neutral" | "ok" | "warn" | "alert" | "danger";
}

const TIER_BY_TIPO: Record<Tipo, Tier> = {
  "sin-antecedentes": {
    tipo: "sin-antecedentes",
    label: "Sin antecedentes en el BCRA",
    short: "Sin datos",
    tone: "neutral",
  },
  limpio: {
    tipo: "limpio",
    label: "Limpio · sin observaciones",
    short: "Limpio",
    tone: "ok",
  },
  "con-seguimiento": {
    tipo: "con-seguimiento",
    label: "Con seguimiento · atrasos puntuales",
    short: "Seguimiento",
    tone: "warn",
  },
  refinanciado: {
    tipo: "refinanciado",
    label: "Con refinanciaciones / problemas",
    short: "Refinanciado",
    tone: "alert",
  },
  rojo: {
    tipo: "rojo",
    label: "Alto riesgo de insolvencia",
    short: "Rojo",
    tone: "danger",
  },
  critico: {
    tipo: "critico",
    label: "Crítico · irrecuperable o judicial",
    short: "Crítico",
    tone: "danger",
  },
};

export interface FlagInfo {
  key: string;
  label: string;
  tone: "warn" | "danger";
}

const FLAG_DEFS: { key: keyof DeudaEntidad; label: string; tone: "warn" | "danger" }[] = [
  { key: "refinanciaciones", label: "Refinanciaciones", tone: "warn" },
  { key: "recategorizacionOblig", label: "Recategorización obligatoria", tone: "warn" },
  { key: "enRevision", label: "En revisión", tone: "warn" },
  { key: "situacionJuridica", label: "Situación jurídica", tone: "danger" },
  { key: "irrecDisposicionTecnica", label: "Irrecuperable por DT", tone: "danger" },
  { key: "procesoJud", label: "Proceso judicial", tone: "danger" },
];

export interface ChequeStat {
  total: number;
  sinPagar: number;
  montoTotal: number;
}

export interface AnalysisInput {
  deudas: DeudasResponse | null;
  historicas: DeudasResponse | null;
  cheques: ChequesResponse | null;
}

export interface PeriodoStat {
  periodo: string;
  monto: number;
  peorSit: number;
  entidades: number;
}

export interface BancoStat {
  entidad: string;
  shortName: string;
  ultimo: DeudaEntidad | null;
  historial: { periodo: string; monto: number; situacion: number; atraso: number }[];
  pico: number;
  flags: FlagInfo[];
}

export interface AnalysisResult {
  hasAnyData: boolean;
  tier: Tier;
  score: number;
  insights: string[];
  flags: FlagInfo[];
  cheques: ChequeStat;
  kpis: {
    deudaTotal: number;
    deltaDeuda12m: number | null;
    peorSituacion: number;
    mesesEnRojo: number;
    entidadesActivas: number;
    picoDeuda: { monto: number; periodo: string | null };
  };
  timeline: PeriodoStat[];
  bancos: BancoStat[];
  heatmapPeriodos: string[];
}

function montoOf(e: DeudaEntidad): number {
  // BCRA reporta los montos en miles de pesos
  return (e.monto ?? 0) * 1000;
}

function flagsOf(e: DeudaEntidad): FlagInfo[] {
  return FLAG_DEFS.filter((f) => Boolean(e[f.key])).map((f) => ({
    key: f.key as string,
    label: f.label,
    tone: f.tone,
  }));
}

function shortBankName(name: string): string {
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

function periodoSort(a: { periodo: string }, b: { periodo: string }): number {
  return a.periodo.localeCompare(b.periodo);
}

function statsForPeriodo(p: DeudaPeriodo): PeriodoStat {
  let monto = 0;
  let peorSit = 0;
  for (const e of p.entidades) {
    monto += montoOf(e);
    if ((e.situacion ?? 0) > peorSit) peorSit = e.situacion ?? 0;
  }
  return {
    periodo: p.periodo,
    monto,
    peorSit,
    entidades: p.entidades.length,
  };
}

function deriveScore(
  peorSit: number,
  diasAtraso: number,
  chequesSinPagar: number,
  flags: FlagInfo[],
): number {
  let s = 100;
  const sitPenalty: Record<number, number> = {
    1: 0,
    2: 12,
    3: 25,
    4: 50,
    5: 70,
    6: 85,
  };
  s -= sitPenalty[peorSit] ?? 0;
  s -= Math.min(20, diasAtraso);
  s -= Math.min(30, chequesSinPagar * 10);
  if (flags.some((f) => f.key === "procesoJud")) s -= 20;
  if (flags.some((f) => f.key === "irrecDisposicionTecnica")) s -= 15;
  if (flags.some((f) => f.key === "refinanciaciones")) s -= 10;
  return Math.max(0, Math.min(100, Math.round(s)));
}

function deriveTier(
  hasAnyData: boolean,
  score: number,
  peorSit: number,
  flags: FlagInfo[],
): Tier {
  if (!hasAnyData) return TIER_BY_TIPO["sin-antecedentes"];
  if (
    flags.some(
      (f) => f.key === "procesoJud" || f.key === "irrecDisposicionTecnica",
    ) ||
    peorSit >= 5
  )
    return TIER_BY_TIPO.critico;
  if (peorSit >= 4) return TIER_BY_TIPO.rojo;
  if (flags.some((f) => f.key === "refinanciaciones")) return TIER_BY_TIPO.refinanciado;
  if (peorSit >= 2 || score < 80) return TIER_BY_TIPO["con-seguimiento"];
  return TIER_BY_TIPO.limpio;
}

function diffPct(a: number, b: number): number | null {
  if (b === 0) return null;
  return ((a - b) / Math.abs(b)) * 100;
}

function fmtPct(n: number): string {
  const v = Math.abs(n);
  return v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : Math.round(v).toString();
}

function fmtPeriodoHumano(periodo: string): string {
  // periodo: YYYYMM
  if (/^\d{6}$/.test(periodo)) {
    const y = periodo.slice(0, 4);
    const m = parseInt(periodo.slice(4), 10);
    const meses = [
      "ene",
      "feb",
      "mar",
      "abr",
      "may",
      "jun",
      "jul",
      "ago",
      "sep",
      "oct",
      "nov",
      "dic",
    ];
    return `${meses[m - 1] ?? m}/${y.slice(2)}`;
  }
  return periodo;
}

function buildInsights(
  tier: Tier,
  timeline: PeriodoStat[],
  bancos: BancoStat[],
  cheques: ChequeStat,
): string[] {
  const out: string[] = [];

  if (tier.tipo === "sin-antecedentes") {
    out.push(
      "El BCRA no tiene movimientos informados para este CUIT. Limpio por silencio: no figura como deudor en el sistema financiero formal.",
    );
    return out;
  }

  // Tendencia de deuda 12m
  if (timeline.length >= 2) {
    const ultimo = timeline[timeline.length - 1];
    const hace12 = timeline[Math.max(0, timeline.length - 13)];
    if (hace12 && hace12.monto > 0) {
      const pct = diffPct(ultimo.monto, hace12.monto);
      if (pct !== null && Math.abs(pct) >= 5) {
        const dir = pct > 0 ? "subió" : "bajó";
        out.push(
          `Tu deuda total ${dir} ${fmtPct(pct)}% respecto de hace 12 meses.`,
        );
      } else if (pct !== null) {
        out.push("Tu deuda total se mantuvo estable en los últimos 12 meses.");
      }
    } else if (ultimo.monto > 0 && hace12 && hace12.monto === 0) {
      out.push(
        "No tenías deuda hace 12 meses; ahora figura una nueva entidad reportando.",
      );
    }
  }

  // Mejora/empeoramiento de situación
  if (timeline.length >= 2) {
    const ultimo = timeline[timeline.length - 1];
    const hace6 = timeline[Math.max(0, timeline.length - 7)];
    if (hace6 && hace6.peorSit !== ultimo.peorSit) {
      if (ultimo.peorSit < hace6.peorSit) {
        out.push(
          `Mejoraste de situación ${hace6.peorSit} a ${ultimo.peorSit} en los últimos 6 meses.`,
        );
      } else {
        out.push(
          `Empeoraste de situación ${hace6.peorSit} a ${ultimo.peorSit} en los últimos 6 meses.`,
        );
      }
    }
  }

  // Estabilidad
  if (timeline.length >= 4) {
    const ultimos = timeline.slice(-12).filter((p) => p.peorSit === 1);
    if (ultimos.length >= 6 && tier.tone === "ok") {
      out.push(
        `Estás en situación 1 desde hace ${ultimos.length} meses corridos.`,
      );
    }
  }

  // Entidad nueva
  if (bancos.length > 0 && timeline.length >= 4) {
    const ultimoPeriodo = timeline[timeline.length - 1].periodo;
    const nuevas = bancos.filter((b) => {
      const aparece = b.historial.find((h) => h.periodo === ultimoPeriodo);
      const previas = b.historial.filter((h) => h.periodo !== ultimoPeriodo);
      return aparece && previas.length === 0;
    });
    if (nuevas.length > 0) {
      const nombre = nuevas[0].shortName;
      out.push(
        `Apareció ${nombre} reportando deuda en ${fmtPeriodoHumano(
          ultimoPeriodo,
        )} (no figuraba antes).`,
      );
    }
  }

  // Cheques
  if (cheques.total > 0) {
    if (cheques.sinPagar > 0) {
      out.push(
        `Tenés ${cheques.total} cheque${
          cheques.total !== 1 ? "s" : ""
        } rechazado${cheques.total !== 1 ? "s" : ""}, ${cheques.sinPagar} sin regularizar.`,
      );
    } else {
      out.push(
        `Tenés ${cheques.total} cheque${
          cheques.total !== 1 ? "s" : ""
        } rechazado${cheques.total !== 1 ? "s" : ""}, todos pagados.`,
      );
    }
  }

  return out;
}

export function analyze(input: AnalysisInput): AnalysisResult {
  const { deudas, historicas, cheques } = input;

  // Combinar periodos para timeline (preferimos historicas; sumamos current si tiene un periodo distinto)
  const periodosMap = new Map<string, DeudaPeriodo>();
  for (const p of historicas?.periodos ?? []) periodosMap.set(p.periodo, p);
  for (const p of deudas?.periodos ?? []) {
    if (!periodosMap.has(p.periodo)) periodosMap.set(p.periodo, p);
  }
  const allPeriodos = [...periodosMap.values()].sort(periodoSort);

  const timeline = allPeriodos.map(statsForPeriodo);

  // Banco stats
  const bancosMap = new Map<string, BancoStat>();
  for (const p of allPeriodos) {
    for (const e of p.entidades) {
      const key = e.entidad;
      const monto = montoOf(e);
      const existing = bancosMap.get(key);
      const entry = {
        periodo: p.periodo,
        monto,
        situacion: e.situacion,
        atraso: e.diasAtrasoPago ?? 0,
      };
      if (!existing) {
        bancosMap.set(key, {
          entidad: e.entidad,
          shortName: shortBankName(e.entidad),
          ultimo: null,
          historial: [entry],
          pico: monto,
          flags: flagsOf(e),
        });
      } else {
        existing.historial.push(entry);
        if (monto > existing.pico) existing.pico = monto;
        for (const f of flagsOf(e)) {
          if (!existing.flags.find((x) => x.key === f.key)) existing.flags.push(f);
        }
      }
    }
  }
  // Identificar último período de cada banco
  for (const b of bancosMap.values()) {
    b.historial.sort(periodoSort);
    const last = b.historial[b.historial.length - 1];
    if (last) {
      const periodoLast = allPeriodos.find((p) => p.periodo === last.periodo);
      const ultimaEntidad = periodoLast?.entidades.find(
        (e) => e.entidad === b.entidad,
      );
      b.ultimo = ultimaEntidad ?? null;
    }
  }
  const bancos = [...bancosMap.values()].sort(
    (a, b) =>
      (b.ultimo?.monto ?? 0) * 1000 - (a.ultimo?.monto ?? 0) * 1000,
  );

  // Flags consolidadas
  const flags: FlagInfo[] = [];
  for (const b of bancos) {
    for (const f of b.flags) {
      if (!flags.find((x) => x.key === f.key)) flags.push(f);
    }
  }

  // Cheques stat
  const todosCheques =
    cheques?.causales?.flatMap((c) =>
      c.detalle.flatMap((d) => d.detalle),
    ) ?? [];
  const chequeStat: ChequeStat = {
    total: todosCheques.length,
    sinPagar: todosCheques.filter((c) => !c.fechaPago).length,
    montoTotal: todosCheques.reduce((acc, c) => acc + (c.monto ?? 0), 0),
  };

  // KPIs
  const ultimoPeriodoStat = timeline[timeline.length - 1];
  const deudaTotal = ultimoPeriodoStat?.monto ?? 0;
  const peorSituacion = ultimoPeriodoStat?.peorSit ?? 0;
  const entidadesActivas = ultimoPeriodoStat?.entidades ?? 0;
  const hace12 = timeline[Math.max(0, timeline.length - 13)];
  const deltaDeuda12m =
    hace12 && hace12.monto > 0
      ? diffPct(deudaTotal, hace12.monto)
      : null;
  const mesesEnRojo = timeline.filter((p) => p.peorSit >= 4).length;
  const picoEntry = timeline.reduce<PeriodoStat | null>(
    (acc, p) => (!acc || p.monto > acc.monto ? p : acc),
    null,
  );
  const picoDeuda = {
    monto: picoEntry?.monto ?? 0,
    periodo: picoEntry?.periodo ?? null,
  };

  // Score y tier (computado sobre el último período conocido)
  const ultimoEntidades = ultimoPeriodoStat
    ? allPeriodos.find((p) => p.periodo === ultimoPeriodoStat.periodo)?.entidades ?? []
    : [];
  const peorAtraso = Math.max(
    0,
    ...ultimoEntidades.map((e) => e.diasAtrasoPago ?? 0),
  );

  const hasAnyData =
    timeline.length > 0 || (chequeStat.total > 0);

  const score = deriveScore(
    peorSituacion,
    peorAtraso,
    chequeStat.sinPagar,
    flags,
  );
  const tier = deriveTier(hasAnyData, score, peorSituacion, flags);

  const insights = buildInsights(tier, timeline, bancos, chequeStat);

  return {
    hasAnyData,
    tier,
    score: tier.tipo === "sin-antecedentes" ? 0 : score,
    insights,
    flags,
    cheques: chequeStat,
    kpis: {
      deudaTotal,
      deltaDeuda12m,
      peorSituacion,
      mesesEnRojo,
      entidadesActivas,
      picoDeuda,
    },
    timeline,
    bancos,
    heatmapPeriodos: timeline.map((p) => p.periodo),
  };
}

export { fmtPeriodoHumano };
