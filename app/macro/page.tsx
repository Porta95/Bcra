import type { Metadata } from "next";
import Script from "next/script";
import { getVariables } from "@/lib/bcra";
import VariablesGrid from "@/components/VariablesGrid";

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

export default async function MacroPage() {
  let error: string | null = null;
  let variables: Awaited<ReturnType<typeof getVariables>> = [];

  try {
    variables = await getVariables();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
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
          className="font-display text-3xl md:text-4xl tracking-tight mt-1"
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
          <div className="text-danger mb-1">
            El BCRA no responde ahora mismo
          </div>
          <div className="text-muted text-xs">
            Probá en unos minutos. Detalle: {error}
          </div>
        </div>
      ) : (
        <VariablesGrid variables={variables} />
      )}
    </section>
  );
}
