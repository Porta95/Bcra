/**
 * LECAPs y BONCAPs — cruza ArgentinaDatos (vpv, fechas) con data912 (precios live)
 *
 * ArgentinaDatos: https://api.argentinadatos.com/v1/finanzas/letras
 *   → ticker, fechaVencimiento, vpv (valor de pago al vencimiento)
 *
 * data912: https://data912.com/live/arg_notes
 *   → symbol, c (precio actual), px_bid, px_ask, pct_change
 *
 * TNA implícita = (vpv / precio - 1) × (365 / dias) × 100
 */

const MONTH_LABELS = [
  "Ene","Feb","Mar","Abr","May","Jun",
  "Jul","Ago","Sep","Oct","Nov","Dic",
];

export interface Lecap {
  symbol: string;
  tipo: "LECAP" | "BONCAP";
  vencimientoStr: string;     // "12 Jun 2026"
  precio: number;
  vpv: number;                // valor de pago al vencimiento
  bid: number;
  ask: number;
  pctChange: number;
  tnaImplicita: number;       // % anualizado simple
  diasAlVencimiento: number;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export async function getLecaps(): Promise<Lecap[]> {
  const [letrasRes, notesRes] = await Promise.all([
    fetch("https://api.argentinadatos.com/v1/finanzas/letras", {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    }),
    fetch("https://data912.com/live/arg_notes", {
      next: { revalidate: 300 },
      headers: { Accept: "application/json", "User-Agent": "panel-bcra/2.0" },
    }),
  ]);

  if (!letrasRes.ok) throw new Error(`argentinadatos letras ${letrasRes.status}`);
  if (!notesRes.ok)  throw new Error(`data912 ${notesRes.status}`);

  const letras = (await letrasRes.json()) as {
    ticker: string;
    fechaVencimiento: string;
    vpv: number | null;
    tem: number | null;
  }[];

  const notes = (await notesRes.json()) as {
    symbol: string;
    c: number;
    px_bid: number;
    px_ask: number;
    pct_change: number;
  }[];

  // Indice de precios live por symbol
  const priceMap = new Map(notes.map((n) => [n.symbol, n]));

  const todayMs = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  );

  return letras
    .flatMap((letra) => {
      const note = priceMap.get(letra.ticker);
      if (!note) return [];                        // sin precio en data912
      if (!letra.vpv || letra.vpv <= 0) return []; // sin vpv
      if ((note.c ?? 0) <= 0) return [];          // sin precio

      const vencMs = new Date(letra.fechaVencimiento + "T00:00:00Z").getTime();
      const dias = Math.round((vencMs - todayMs) / 86_400_000);
      if (dias <= 0) return [];

      const vpv = letra.vpv;
      const precio = note.c;
      const tna = ((vpv / precio) - 1) * (365 / dias) * 100;
      if (tna <= 0) return [];

      const tipo: "LECAP" | "BONCAP" = letra.ticker.startsWith("T") ? "BONCAP" : "LECAP";

      return [{
        symbol:            letra.ticker,
        tipo,
        vencimientoStr:    formatDate(letra.fechaVencimiento),
        precio,
        vpv,
        bid:               note.px_bid ?? 0,
        ask:               note.px_ask ?? 0,
        pctChange:         note.pct_change ?? 0,
        tnaImplicita:      tna,
        diasAlVencimiento: dias,
      } satisfies Lecap];
    })
    .sort((a, b) => b.tnaImplicita - a.tnaImplicita)
    .slice(0, 8);
}
