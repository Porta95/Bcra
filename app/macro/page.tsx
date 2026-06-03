import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { TrendingDown, TrendingUp } from "lucide-react";
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

// Patrones para detectar variables clave. Si el BCRA renombra algo, ajustar regex.
const TICKER_PATTERNS: { key: string; label: string; match: RegExp; cat?: RegExp }[] = [
  {
    key: "reservas",
    label: "Reservas (USD)",
    match: /^reservas internacionales\s*$/i,
    cat: /principales/i,
  },
  {
    key: "dolar_mayorista",
    label: "Dólar mayorista",
    match: /tipo de cambio mayorista/i,
  },
  {
    key: "dolar_minorista",
    label: "Dólar minorista",
    match: /tipo de cambio.*minorista|tipo de cambio de referencia/i,
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
  {
    key: "ipc_anual",
    label: "Inflación interanual",
    match: /variación.*anual.*índice.*precios|inflación.*interanual|variación interanual.*ipc/i,
  },
  {
    key: "base",
    label: "Base Monetaria",
    match: /^base monetaria\b/i,
  },
  {
    key: "m2",
    label: "M2 Privado",
    match: /m2 privado/i,
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
          className="text-display font-bold tracking-tight mt-1"
        >
          Las variables que mueven la{" "}
          <span className="text-accent">economía</span>
        </h1>
        <p className="text-sm text-muted mt-3 max-w-2xl leading-relaxed">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border mb-8">
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

          <h2 className="section-eyebrow mb-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-6 h-px bg-accent align-middle"
            />
            Explorar todas las series
          </h2>
          <VariablesGrid variables={variables} />
        </>
      )}
    </section>
  );
}
