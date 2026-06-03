import type { Metadata } from "next";
import Link from "next/link";
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import { getSerie, getVariables, formatNumber, type Variable } from "@/lib/bcra";
import { getPlazosFijos } from "@/lib/bcra";
import { BILLETERAS } from "@/lib/billeteras-data";
import { getLecaps } from "@/lib/lecaps";
import Sparkline from "@/components/Sparkline";
import CuitSearch from "@/components/CuitSearch";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Panel BCRA — tasas, deudores y cheques",
  description:
    "Consultá tu CUIT en la Central de Deudores, comparás tasas de plazo fijo y billeteras, y seguís las variables macro del BCRA.",
  alternates: { canonical: "/" },
};

// Macro metrics to display
const MACRO_PATTERNS: { key: string; label: string; match: RegExp; cat?: RegExp; unit?: string }[] = [
  {
    key: "dolar_mayorista",
    label: "Dólar mayorista",
    match: /tipo de cambio mayorista/i,
    unit: "ARS",
  },
  {
    key: "ipc",
    label: "Inflación mensual",
    match: /variación mensual del índice de precios al consumidor/i,
    unit: "%",
  },
  {
    key: "ipc_anual",
    label: "Inflación interanual",
    match: /variación.*anual.*índice.*precios|inflación.*interanual|variación interanual.*ipc/i,
    unit: "%",
  },
  {
    key: "reservas",
    label: "Reservas (USD)",
    match: /^reservas internacionales\s*$/i,
    cat: /principales/i,
    unit: "M USD",
  },
];

function pickMacro(vars: Variable[]) {
  return MACRO_PATTERNS.map((p) => {
    const v = vars.find((x) => {
      if (!p.match.test(x.descripcion)) return false;
      if (p.cat && !p.cat.test(x.categoria)) return false;
      return true;
    });
    return v ? { ...p, v } : null;
  }).filter((x): x is typeof MACRO_PATTERNS[0] & { v: Variable } => !!x);
}

export default async function Home() {
  // ── Macro metrics ──────────────────────────────────────────────────────────
  let macroCards: {
    key: string; label: string; unit: string;
    value: number; spark: number[]; delta: number; v: Variable;
  }[] = [];

  try {
    const variables = await getVariables();
    const picks = pickMacro(variables);
    macroCards = await Promise.all(
      picks.map(async (p) => {
        const serie = await getSerie(p.v.idVariable).catch(() => []);
        const last30 = serie.slice(-30).map((x) => x.valor);
        const last = serie[serie.length - 1]?.valor ?? p.v.ultValorInformado;
        const base = serie[Math.max(0, serie.length - 30)]?.valor ?? last;
        const delta = base === 0 ? 0 : ((last - base) / Math.abs(base)) * 100;
        return { key: p.key, label: p.label, unit: p.unit ?? "", value: last, spark: last30, delta, v: p.v };
      }),
    );
  } catch {
    // silently degrade
  }

  // ── LECAPs ─────────────────────────────────────────────────────────────────
  let lecaps: Awaited<ReturnType<typeof getLecaps>> = [];
  try {
    lecaps = await getLecaps();
  } catch {
    // silently degrade
  }

  // ── Top 5 plazo fijo ───────────────────────────────────────────────────────
  let topPF: { descripcionEntidad: string; tea: number }[] = [];
  try {
    const pf = await getPlazosFijos();
    const tradicionales = pf.filter(
      (r) =>
        !r.denominacion?.toLowerCase().includes("uva") &&
        (r.tasaEfectivaAnualMinima ?? 0) > 0,
    );
    const best = new Map<string, typeof tradicionales[0]>();
    for (const r of tradicionales) {
      const prev = best.get(r.descripcionEntidad);
      if (!prev || r.tasaEfectivaAnualMinima > prev.tasaEfectivaAnualMinima) {
        best.set(r.descripcionEntidad, r);
      }
    }
    topPF = Array.from(best.values())
      .sort((a, b) => b.tasaEfectivaAnualMinima - a.tasaEfectivaAnualMinima)
      .slice(0, 5)
      .map((r) => ({ descripcionEntidad: r.descripcionEntidad, tea: r.tasaEfectivaAnualMinima }));
  } catch {
    // silently degrade
  }

  // ── Top 5 billeteras ───────────────────────────────────────────────────────
  const topBilleteras = BILLETERAS.filter((b) => b.group === "garantizado")
    .sort((a, b) => b.tna - a.tna)
    .slice(0, 5);

  return (
    <div className="space-y-12">
      {/* ── Hero: CUIT search ──────────────────────────────────────────────── */}
      <section aria-labelledby="hero-title" className="text-center py-6">
        <div className="section-eyebrow mb-3 justify-center" aria-hidden="true">
          Central de Deudores · BCRA
        </div>
        <h1
          id="hero-title"
          className="text-display font-bold tracking-tight mb-3"
        >
          Consultá tu situación en el{" "}
          <span className="text-accent">BCRA</span>
        </h1>
        <p className="text-sm text-muted mb-6 max-w-md mx-auto leading-relaxed">
          Ingresá tu CUIT o CUIL para ver tus deudas registradas en la Central de Deudores.
        </p>
        <CuitSearch />
        <p className="text-[11px] text-muted mt-3">
          También podés{" "}
          <Link href="/cheques" className="text-accent hover:underline">
            verificar cheques denunciados
          </Link>
        </p>
      </section>

      {/* ── Macro metrics ──────────────────────────────────────────────────── */}
      {macroCards.length > 0 && (
        <section aria-labelledby="macro-title">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="macro-title"
              className="section-eyebrow flex items-center gap-2"
            >
              <span aria-hidden="true" className="inline-block w-6 h-px bg-accent align-middle" />
              Variables macro · hoy
            </h2>
            <Link
              href="/macro"
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
            {macroCards.map((m) => (
              <Link
                key={m.key}
                href={`/variable/${m.v.idVariable}`}
                className="bg-panel hover:bg-panel2 transition-colors p-4 group"
              >
                <div className="section-eyebrow group-hover:text-accent text-[10px]">
                  {m.label}
                </div>
                <div className="tabular text-xl font-bold text-ink mt-1 truncate">
                  {formatNumber(m.value)}
                  <span className="text-xs font-normal text-muted ml-1">{m.unit}</span>
                </div>
                <div
                  className={`text-xs tabular mt-1 inline-flex items-center gap-1 ${
                    m.delta >= 0 ? "text-ok" : "text-danger"
                  }`}
                >
                  {m.delta >= 0 ? (
                    <TrendingUp size={11} aria-hidden="true" />
                  ) : (
                    <TrendingDown size={11} aria-hidden="true" />
                  )}
                  {formatNumber(Math.abs(m.delta))}%
                  <span className="text-muted ml-1 normal-case">30d</span>
                </div>
                {m.spark.length > 1 && (
                  <div className="mt-3">
                    <Sparkline data={m.spark} positive={m.delta >= 0} height={28} />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── LECAPs / BONCAPs ───────────────────────────────────────────────── */}
      {lecaps.length > 0 && (
        <section aria-labelledby="lecaps-title">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="lecaps-title"
              className="section-eyebrow flex items-center gap-2"
            >
              <span aria-hidden="true" className="inline-block w-6 h-px bg-accent align-middle" />
              LECAPs y BONCAPs · mayor TNA
            </h2>
            <span className="text-[10px] tabular text-muted uppercase tracking-widest">
              TNA implícita
            </span>
          </div>
          <div className="border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-panel">
                  <th className="text-left px-4 py-2.5 text-muted font-medium text-xs uppercase tracking-widest">Ticker</th>
                  <th className="text-left px-4 py-2.5 text-muted font-medium text-xs uppercase tracking-widest hidden sm:table-cell">Vencimiento</th>
                  <th className="text-right px-4 py-2.5 text-muted font-medium text-xs uppercase tracking-widest">Precio</th>
                  <th className="text-right px-4 py-2.5 text-muted font-medium text-xs uppercase tracking-widest hidden md:table-cell">Pago final</th>
                  <th className="text-right px-4 py-2.5 text-muted font-medium text-xs uppercase tracking-widest hidden sm:table-cell">Días</th>
                  <th className="text-right px-4 py-2.5 text-muted font-medium text-xs uppercase tracking-widest">TNA</th>
                  <th className="text-right px-4 py-2.5 text-muted font-medium text-xs uppercase tracking-widest hidden md:table-cell">Δ%</th>
                </tr>
              </thead>
              <tbody>
                {lecaps.map((l, i) => (
                  <tr
                    key={l.symbol}
                    className="border-b border-border/50 bg-panel hover:bg-panel2 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="tabular font-semibold text-ink">{l.symbol}</span>
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                          l.tipo === "BONCAP"
                            ? "bg-warn/10 text-warn"
                            : "bg-accent/10 text-accent"
                        }`}>
                          {l.tipo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted hidden sm:table-cell">
                      {l.vencimientoStr}
                    </td>
                    <td className="px-4 py-3 text-right tabular text-ink">
                      {formatNumber(l.precio, 2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular text-muted hidden md:table-cell">
                      {formatNumber(l.vpv, 2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular text-muted hidden sm:table-cell">
                      {l.diasAlVencimiento}d
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`tabular font-bold ${i === 0 ? "text-ok" : "text-accent"}`}
                      >
                        {formatNumber(l.tnaImplicita, 2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span
                        className={`tabular text-xs ${
                          l.pctChange >= 0 ? "text-ok" : "text-danger"
                        }`}
                      >
                        {l.pctChange >= 0 ? "+" : ""}
                        {formatNumber(l.pctChange, 2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Top 5: Plazos Fijos + Billeteras ───────────────────────────────── */}
      <section aria-labelledby="top-rates-title">
        <h2
          id="top-rates-title"
          className="section-eyebrow flex items-center gap-2 mb-4"
        >
          <span aria-hidden="true" className="inline-block w-6 h-px bg-accent align-middle" />
          Mejores tasas del día
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top 5 Plazo Fijo */}
          <div className="border border-border bg-panel">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <span className="text-xs font-semibold text-ink uppercase tracking-widest">
                Plazo Fijo · TEA
              </span>
              <Link
                href="/comparador?tipo=plazos-fijos"
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight size={11} />
              </Link>
            </div>
            {topPF.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted text-center">
                No disponible
              </div>
            ) : (
              <ul>
                {topPF.map((r, i) => (
                  <li
                    key={r.descripcionEntidad}
                    className="flex items-center justify-between px-4 py-3 border-b border-border/40 last:border-0 hover:bg-panel2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="tabular text-xs text-muted w-4 shrink-0">{i + 1}</span>
                      <span className="text-sm text-ink truncate">{r.descripcionEntidad}</span>
                    </div>
                    <span className="tabular font-bold text-ok shrink-0 ml-2">
                      {formatNumber(r.tea, 2)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Top 5 Billeteras */}
          <div className="border border-border bg-panel">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <span className="text-xs font-semibold text-ink uppercase tracking-widest">
                Billeteras · TNA
              </span>
              <Link
                href="/comparador?tipo=billeteras"
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                Ver todas <ArrowRight size={11} />
              </Link>
            </div>
            <ul>
              {topBilleteras.map((b, i) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-border/40 last:border-0 hover:bg-panel2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="tabular text-xs text-muted w-4 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <span className="text-sm text-ink block truncate">{b.nombre}</span>
                      {b.limiteARS && (
                        <span className="text-[10px] text-muted tabular">
                          hasta ${(b.limiteARS / 1000).toFixed(0)}K
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="tabular font-bold text-ok shrink-0 ml-2">
                    {formatNumber(b.tna, 1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
