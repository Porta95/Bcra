import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSerie, getVariables } from "@/lib/bcra";
import SerieChart from "@/components/SerieChart";
import Sparkline from "@/components/Sparkline";
import { formatNumber } from "@/lib/bcra";

export const revalidate = 1800;

export async function generateStaticParams() {
  const vars = await getVariables().catch(() => []);
  return vars
    .filter((v) => /principales/i.test(v.categoria))
    .slice(0, 60)
    .map((v) => ({ id: String(v.idVariable) }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return { title: "Variable no encontrada — Panel BCRA", robots: { index: false } };
  }
  const vars = await getVariables().catch(() => []);
  const v = vars.find((x) => x.idVariable === id);
  if (!v) {
    return { title: "Variable no encontrada — Panel BCRA", robots: { index: false } };
  }
  const baseTitle = `${v.descripcion} — Panel BCRA`;
  const title = baseTitle.length > 60 ? v.descripcion.slice(0, 60) : baseTitle;
  const description =
    `Serie histórica de "${v.descripcion}" del BCRA. Unidad: ${v.unidadExpresion}. Última publicación ${v.ultFechaInformada}.`.slice(
      0,
      155,
    );
  return {
    title,
    description,
    alternates: { canonical: `/variable/${id}` },
    openGraph: {
      title,
      description,
      url: `/variable/${id}`,
      type: "article",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function VariablePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const [variables, serie] = await Promise.all([
    getVariables().catch(() => []),
    getSerie(id).catch(() => []),
  ]);

  const meta = variables.find((v) => v.idVariable === id);

  // Compute hero stats
  const last30 = serie.slice(-30);
  const sparkData = last30.map((p) => p.valor);
  const lastValue = serie[serie.length - 1]?.valor ?? 0;
  const baseValue = serie[Math.max(0, serie.length - 30)]?.valor ?? lastValue;
  const deltaAbs = lastValue - baseValue;
  const deltaPct =
    baseValue === 0 ? 0 : (deltaAbs / Math.abs(baseValue)) * 100;
  const positive = deltaPct >= 0;
  const ultimaFecha =
    serie[serie.length - 1]?.fecha ?? meta?.ultFechaInformada ?? "—";

  const datasetLd = meta
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: meta.descripcion,
        description: `Serie ${meta.tipoSerie} (${meta.periodicidad}) publicada por el BCRA. Unidad: ${meta.unidadExpresion}. Categoría: ${meta.categoria}.`,
        url: `https://panel-bcra.vercel.app/variable/${id}`,
        identifier: String(id),
        keywords: [meta.categoria, meta.descripcion, "BCRA", "Argentina"],
        inLanguage: "es-AR",
        isAccessibleForFree: true,
        license: "https://www.bcra.gob.ar/",
        creator: {
          "@type": "GovernmentOrganization",
          name: "Banco Central de la República Argentina",
          url: "https://www.bcra.gob.ar/",
        },
        temporalCoverage: `${meta.primerFechaInformada}/${meta.ultFechaInformada}`,
        variableMeasured: {
          "@type": "PropertyValue",
          name: meta.descripcion,
          unitText: meta.unidadExpresion,
        },
        distribution: [
          {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/${id}`,
          },
        ],
      }
    : null;

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
      {
        "@type": "ListItem",
        position: 3,
        name: meta?.descripcion ?? `Variable ${id}`,
      },
    ],
  };

  return (
    <section aria-labelledby="variable-title">
      <Script
        id="ld-variable"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetLd ? [datasetLd, breadcrumbsLd] : [breadcrumbsLd],
          ),
        }}
      />

      <nav aria-label="Migas de pan" className="mb-4">
        <ol className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted">
          <li>
            <Link href="/" className="hover:text-accent transition-colors">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="/macro" className="hover:text-accent transition-colors">
              Macro
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-ink truncate max-w-[40ch]">#{id}</li>
        </ol>
      </nav>

      <div className="border-l-2 border-accent pl-4 mb-8">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="min-w-0">
            <div className="section-eyebrow" aria-hidden="true">
              Variable #{id}
              {meta?.categoria && <span className="ml-2">· {meta.categoria}</span>}
            </div>
            <h1
              id="variable-title"
              className="font-display text-2xl md:text-3xl tracking-tight mt-1 max-w-3xl"
            >
              {meta?.descripcion ?? "Variable sin descripción publicada"}
            </h1>
            {meta?.unidadExpresion && (
              <div className="text-xs text-muted mt-2">
                Unidad: {meta.unidadExpresion}
              </div>
            )}
            <div className="text-[10px] uppercase tracking-widest text-muted mt-1 tabular">
              Última publicación: {ultimaFecha}
            </div>
          </div>

          {sparkData.length > 1 && (
            <div className="min-w-0 md:min-w-[260px]">
              <div className="text-4xl md:text-5xl tabular font-bold text-accent leading-none text-right">
                {formatNumber(lastValue)}
              </div>
              <div
                className={`text-sm mt-1 tabular text-right ${
                  positive ? "text-ok" : "text-danger"
                }`}
              >
                <span aria-hidden="true">{positive ? "▲" : "▼"}</span>{" "}
                {formatNumber(Math.abs(deltaPct))}%
                <span className="text-muted ml-2 normal-case">
                  últimos 30 días
                </span>
              </div>
              <div className="mt-3">
                <Sparkline data={sparkData} positive={positive} height={48} />
              </div>
            </div>
          )}
        </div>
      </div>

      <SerieChart data={serie} />
    </section>
  );
}
