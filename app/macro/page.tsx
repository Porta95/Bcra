import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import {
  getSerie,
  getVariables,
  formatNumber,
  type Variable,
} from "@/lib/bcra";
import VariablesGrid from "@/components/VariablesGrid";
import Sparkline from "@/components/Sparkline";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Macro Argentina — variables del BCRA",
  description:
    "Reservas, base monetaria, inflación, tasas y dólar oficial. Más de 1100 variables del BCRA con gráficos históricos. Actualizado diariamente.",
  alternates: { canonical: "/macro" },
};

const macroLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Panel BCRA · Macro Argentina",
  url: "https://panel-bcra.vercel.app/macro",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any (web)",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" },
  inLanguage: "es-AR",
  description:
    "Más de 1100 variables monetarias y financieras del BCRA con series históricas.",
};

const breadcrumbsLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: "https://panel-bcra.vercel.app/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Macro",
      item: "https://panel-bcra.vercel.app/macro",
    },
  ],
};

// Patrones para detectar variables clave por descripción.
// Si el BCRA renombra algo, hay que ajustar los regex.
const TICKER_PATTERNS: { key: string; label: string; match: RegExp; cat?: RegExp }[] = [
  {
    key: "reservas",
    label: "Reservas (USD)",
    match: /^reservas internacionales\s*$/i,
    cat: /principales/i,
  },
  {
    key: "dolar",
    label: "Dólar mayorista",
    match: /tipo de cambio mayorista/i,
  },
  {
    key: "tpm",
    label: "Tasa de política",
    match: /tasas? de interés de política monetaria/i,
  },
  {
    key: "ipc",
    label: "Inflación mensual",
    match: /variación mensual del índice de precios al consumidor/i,
  },
];

function pickByPatterns(vars: Variable[]) {
  return TICKER_PATTERNS.map((p) => {
    const v = vars.find((x) => {
      if (!p.match.test(x.descripcion)) return false;
      if (p.cat && !p.cat.test(x.categoria)) return false;
      return true;
    });
    return v ? { key: p.key, label: p.label, v } : null;
  }).filter((x): x is { key: string; label: string; v: Variable } => !!x);
}

function groupByCategoria(vars: Variable[]) {
  const map = new Map<string, Variable[]>();
  for (const v of vars) {
    if (v.categoria === "Principales Variables") continue;
    const list = map.get(v.categoria) ?? [];
    list.push(v);
    map.set(v.categoria, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([categoria, items]) => ({ categoria, items }));
}

function recentlyUpdated(vars: Variable[], n = 8) {
  return [...vars]
    .filter((v) => v.categoria === "Principales Variables")
    .sort((a, b) => b.ultFechaInformada.localeCompare(a.ultFechaInformada))
    .slice(0, n);
}

export default async function MacroPage() {
  let error: string | null = null;
  let variables: Variable[] = [];
  let ticker: { key: string; label: string; v: Variable; spark: number[]; delta: number }[] = [];

  try {
    variables = await getVariables();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  if (variables.length) {
    const picks = pickByPatterns(variables);
    ticker = await Promise.all(
      picks.map(async (p) => {
        const serie = await getSerie(p.v.idVariable).catch(() => []);
        const last30 = serie.slice(-30).map((x) => x.valor);
        const last = serie[serie.length - 1]?.valor ?? p.v.ultValorInformado;
        const base = serie[Math.max(0, serie.length - 30)]?.valor ?? last;
        const delta = base === 0 ? 0 : ((last - base) / Math.abs(base)) * 100;
        return { key: p.key, label: p.label, v: p.v, spark: last30, delta };
      }),
    );
  }

  const recientes = recentlyUpdated(variables);
  const categorias = groupByCategoria(variables);

  return (
    <section aria-labelledby="macro-title">
      <Script
        id="ld-macro"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([macroLd, breadcrumbsLd]),
        }}
      />
      <div className="mb-8 hero-rule">
        <div className="section-eyebrow" aria-hidden="true">
          Variables Macro · BCRA
        </div>
        <h1
          id="macro-title"
          className="font-display text-display tracking-tight mt-1"
        >
          Las variables que mueven la{" "}
          <span className="italic text-accent">economía</span>
        </h1>
        <p className="text-xs text-muted mt-3 max-w-2xl leading-relaxed">
          Reservas, inflación, tasas, base monetaria y más de 1000 series del
          BCRA. Cada valor se publica con la frecuencia que define el banco
          central.
        </p>
        {!error && variables.length > 0 && (
          <div className="text-[10px] tabular text-muted mt-3 uppercase tracking-widest">
            {variables.length} series · cache 30min
          </div>
        )}
      </div>

      {error ? (
        <div className="border border-danger/30 bg-danger/5 p-4 text-sm">
          <div className="text-danger mb-1">El BCRA no responde ahora mismo</div>
          <div className="text-muted text-xs">
            Probá en unos minutos. Detalle: {error}
          </div>
        </div>
      ) : (
        <>
          {ticker.length > 0 && (
            <>
              <h2 className="section-eyebrow mb-3 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block w-6 h-px bg-accent align-middle"
                />
                Hoy en el BCRA
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border mb-8">
                {ticker.map((t) => (
                  <Link
                    key={t.key}
                    href={`/variable/${t.v.idVariable}`}
                    className="bg-panel hover:bg-panel2 transition-colors p-4 group"
                  >
                    <div className="section-eyebrow group-hover:text-accent">
                      {t.label}
                    </div>
                    <div className="tabular text-2xl font-bold text-ink mt-1 truncate">
                      {formatNumber(t.v.ultValorInformado)}
                    </div>
                    <div
                      className={`text-xs tabular mt-1 inline-flex items-center gap-1 ${
                        t.delta >= 0 ? "text-ok" : "text-danger"
                      }`}
                    >
                      {t.delta >= 0 ? (
                        <TrendingUp size={12} aria-hidden="true" />
                      ) : (
                        <TrendingDown size={12} aria-hidden="true" />
                      )}
                      {formatNumber(Math.abs(t.delta))}%
                      <span className="text-muted ml-2 normal-case">30d</span>
                    </div>
                    {t.spark.length > 1 && (
                      <div className="mt-3">
                        <Sparkline
                          data={t.spark}
                          positive={t.delta >= 0}
                          height={32}
                        />
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </>
          )}

          {recientes.length > 0 && (
            <>
              <h2 className="section-eyebrow mb-3 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block w-6 h-px bg-accent align-middle"
                />
                Movimientos recientes
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                {recientes.map((v) => (
                  <Link
                    key={v.idVariable}
                    href={`/variable/${v.idVariable}`}
                    className="card hover:border-accent/60 hover:bg-panel2 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="section-eyebrow">#{v.idVariable}</span>
                      <span className="text-[10px] text-muted tabular">
                        {v.ultFechaInformada}
                      </span>
                    </div>
                    <h3 className="text-xs leading-snug mb-2 line-clamp-2 text-ink/90">
                      {v.descripcion}
                    </h3>
                    <div className="tabular font-bold text-accent text-lg">
                      {formatNumber(v.ultValorInformado)}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {categorias.length > 0 && (
            <>
              <h2 className="section-eyebrow mb-3 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block w-6 h-px bg-accent align-middle"
                />
                Por categoría
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-10">
                {categorias.slice(0, 9).map((c) => (
                  <details
                    key={c.categoria}
                    className="card group [&[open]]:border-accent/60"
                  >
                    <summary className="cursor-pointer list-none flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-muted">
                          {c.items.length} series
                        </div>
                        <div className="text-sm text-ink mt-1">
                          {c.categoria}
                        </div>
                      </div>
                      <ChevronRight
                        aria-hidden="true"
                        size={16}
                        className="text-muted group-open:text-accent group-open:rotate-90 transition-transform"
                      />
                    </summary>
                    <ul className="mt-4 pt-3 border-t border-border space-y-2 max-h-72 overflow-y-auto">
                      {c.items.slice(0, 30).map((v) => (
                        <li key={v.idVariable}>
                          <Link
                            href={`/variable/${v.idVariable}`}
                            className="flex items-center justify-between gap-2 text-xs hover:text-accent transition-colors"
                          >
                            <span className="truncate">{v.descripcion}</span>
                            <span className="tabular text-muted shrink-0">
                              {formatNumber(v.ultValorInformado)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </>
          )}

          <h2 className="section-eyebrow mb-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-6 h-px bg-accent align-middle"
            />
            Buscador completo
          </h2>
          <VariablesGrid variables={variables} />
        </>
      )}
    </section>
  );
}
