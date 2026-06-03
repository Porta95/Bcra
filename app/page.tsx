import Script from "next/script";
import {
  getCajasAhorros,
  getPaquetesProductos,
  getPlazosFijos,
  getPrestamosHipotecarios,
  getPrestamosPersonales,
  getPrestamosPrendarios,
  getTarjetasCredito,
} from "@/lib/bcra";
import { BILLETERAS, getBilleterasUpdatedAt } from "@/lib/billeteras-data";
import ComparadorList from "@/components/ComparadorList";
import TipoSelector from "@/components/TipoSelector";
import { TIPOS, type Tipo } from "@/lib/transparencia";
import type { SubTipoPF } from "@/lib/comparador-helpers";
import type { Metadata } from "next";

export const revalidate = 21600; // 6h

export const metadata: Metadata = {
  title: "Comparador BCRA — tasas y comisiones por banco",
  description:
    "Compará plazos fijos, préstamos, tarjetas y cajas de ahorro de todos los bancos del país. Datos oficiales del BCRA, actualizados a diario.",
  alternates: { canonical: "/" },
};

const FETCHERS: Partial<Record<Tipo, () => Promise<any[]>>> = {
  "plazos-fijos": getPlazosFijos,
  "personales": getPrestamosPersonales,
  "hipotecarios": getPrestamosHipotecarios,
  "prendarios": getPrestamosPrendarios,
  "tarjetas": getTarjetasCredito,
  "cajas": getCajasAhorros,
  "paquetes": getPaquetesProductos,
};

function isTipo(s: string | undefined): s is Tipo {
  return TIPOS.some((t) => t.id === s);
}

function isSubPF(s: string | undefined): s is SubTipoPF {
  return s === "tradicional" || s === "uva" || s === "uva-precancelable";
}

const websiteLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://panel-bcra.vercel.app/#website",
      url: "https://panel-bcra.vercel.app/",
      name: "Panel BCRA",
      inLanguage: "es-AR",
      description:
        "Comparador de productos financieros, central de deudores, cheques y macro del BCRA.",
      potentialAction: {
        "@type": "SearchAction",
        target:
          "https://panel-bcra.vercel.app/deudores?cuit={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://panel-bcra.vercel.app/#org",
      name: "Panel BCRA",
      url: "https://panel-bcra.vercel.app/",
      logo: "https://panel-bcra.vercel.app/opengraph-image",
    },
  ],
};

export default async function Home({
  searchParams,
}: {
  searchParams: { tipo?: string; sub?: string };
}) {
  const tipo: Tipo = isTipo(searchParams.tipo)
    ? searchParams.tipo
    : "billeteras";
  const tipoLabel = TIPOS.find((t) => t.id === tipo)?.label ?? "";
  const initialSub: SubTipoPF | undefined =
    tipo === "plazos-fijos" && isSubPF(searchParams.sub)
      ? searchParams.sub
      : undefined;

  let data: any[] = [];
  let error: string | null = null;

  if (tipo === "billeteras") {
    data = BILLETERAS as any[];
  } else {
    const fetcher = FETCHERS[tipo];
    if (fetcher) {
      try {
        data = await fetcher();
      } catch (e) {
        error = e instanceof Error ? e.message : "Error desconocido";
      }
    }
  }

  const ultimaActualizacion =
    tipo === "billeteras"
      ? getBilleterasUpdatedAt()
      : (data
          .map((r) => r.fechaInformacion as string | undefined)
          .filter((x): x is string => !!x)
          .sort()
          .pop() ?? null);

  return (
    <section aria-labelledby="comparador-title">
      <Script
        id="ld-home"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <div className="mb-6 hero-rule">
        <div className="section-eyebrow" aria-hidden="true">
          Comparador · Datos BCRA
        </div>
        <h1
          id="comparador-title"
          className="font-display text-display tracking-tight mt-1"
        >
          Qué banco te conviene{" "}
          <span className="italic text-accent">hoy</span>
        </h1>
        <p className="text-xs text-muted mt-3 max-w-2xl leading-relaxed">
          {tipo === "billeteras"
            ? "Tasas de rendimiento de billeteras virtuales y cuentas remuneradas de apertura gratuita en Argentina."
            : "Tasas, comisiones y condiciones que cada banco le declara al BCRA. Ordenado por mejor primero. Las condiciones reales pueden variar según tu perfil."}
        </p>
        {!error && data.length > 0 && (
          <div className="text-[10px] tabular text-muted mt-3 uppercase tracking-widest">
            {tipoLabel}
            {ultimaActualizacion && ` · actualizado ${ultimaActualizacion}`}
          </div>
        )}
      </div>

      <TipoSelector active={tipo} />

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
        <ComparadorList tipo={tipo} data={data} initialSub={initialSub} />
      )}
    </section>
  );
}
