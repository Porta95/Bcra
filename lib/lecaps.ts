/** Letras Capitalizables del Tesoro — data912.com/live/arg_notes */

const MONTH_MAP: Record<string, number> = {
  E: 0, F: 1, M: 2, A: 3, Y: 4, J: 5,
  L: 6, G: 7, S: 8, O: 9, N: 10, D: 11,
};

const MONTH_LABELS = [
  "Ene","Feb","Mar","Abr","May","Jun",
  "Jul","Ago","Sep","Oct","Nov","Dic",
];

export interface Lecap {
  symbol: string;
  vencimientoStr: string; // "12 Jun 2026"
  precio: number;
  bid: number;
  ask: number;
  pctChange: number;
  tnaImplicita: number;  // % anualizado
  diasAlVencimiento: number;
}

function decodeSymbol(symbol: string): Date | null {
  // Formato: S<dd><M><y>  ej: S12J6 = 12 Jun 2026
  const m = symbol.match(/^S(\d{2})([A-Z])(\d)$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const monthIdx = MONTH_MAP[m[2]];
  if (monthIdx === undefined) return null;
  const year = 2020 + parseInt(m[3], 10);
  return new Date(Date.UTC(year, monthIdx, day));
}

function formatDate(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export async function getLecaps(): Promise<Lecap[]> {
  const res = await fetch("https://data912.com/live/arg_notes", {
    next: { revalidate: 300 },
    headers: { Accept: "application/json", "User-Agent": "panel-bcra/2.0" },
  });
  if (!res.ok) throw new Error(`data912 ${res.status}`);
  const rows = (await res.json()) as Record<string, any>[];

  const todayMs = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  );

  return rows
    .filter((r) => r.symbol?.startsWith("S") && (r.c ?? 0) > 0)
    .flatMap((r) => {
      const venc = decodeSymbol(r.symbol);
      if (!venc) return [];
      const dias = Math.round((venc.getTime() - todayMs) / 86_400_000);
      if (dias <= 0) return [];
      const tna = ((100 / r.c - 1) * (365 / dias)) * 100;
      if (tna <= 0) return [];
      return [{
        symbol:            r.symbol as string,
        vencimientoStr:    formatDate(venc),
        precio:            r.c as number,
        bid:               (r.px_bid as number) ?? 0,
        ask:               (r.px_ask as number) ?? 0,
        pctChange:         (r.pct_change as number) ?? 0,
        tnaImplicita:      tna,
        diasAlVencimiento: dias,
      } satisfies Lecap];
    })
    .sort((a, b) => b.tnaImplicita - a.tnaImplicita)
    .slice(0, 6);
}
