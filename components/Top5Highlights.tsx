import Link from "next/link";
import { formatARS, formatPct, shortBankName } from "@/lib/bcra";
import type { Tipo } from "@/lib/transparencia";

interface Props {
  tipo: Tipo;
  data: any[];
}

export default function Top5Highlights({ tipo, data }: Props) {
  const top = pickTop5(tipo, data);
  if (!top.length) return null;

  const isLowerBetter =
    tipo === "personales" ||
    tipo === "hipotecarios" ||
    tipo === "prendarios" ||
    tipo === "tarjetas" ||
    tipo === "paquetes";

  return (
    <section className="mb-8">
      <h2 className="section-eyebrow mb-3 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block w-6 h-px bg-accent align-middle"
        />
        Top 5 — {isLowerBetter ? "más bajos" : "más altos"}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border border border-border">
        {top.map((row, i) => (
          <Top5Card key={i} row={row} tipo={tipo} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}

function pickTop5(tipo: Tipo, data: any[]) {
  if (!data.length) return [];

  function get(r: any) {
    switch (tipo) {
      case "plazos-fijos":
        return r.tasaEfectivaAnualMinima ?? -Infinity;
      case "personales":
      case "hipotecarios":
      case "prendarios":
        return r.tasaEfectivaAnualMaxima ?? Infinity;
      case "tarjetas":
        return r.tasaEfectivaAnualMaximaFinanciacion ?? Infinity;
      case "paquetes":
        return r.comisionMaximaMantenimiento ?? Infinity;
      case "cajas":
        return r.procesoSimplificadoDebidaDiligencia === "SI" ? 1 : 0;
      case "billeteras":
        return r.tna ?? 0;
    }
  }

  const dir =
    tipo === "plazos-fijos" || tipo === "cajas" || tipo === "billeteras" ? -1 : 1;

  const sorted = [...data]
    .filter((r) => {
      const v = get(r);
      return Number.isFinite(v) && v !== null;
    })
    .sort((a, b) => {
      const va = get(a) as number;
      const vb = get(b) as number;
      return (va - vb) * dir;
    });

  // dedupe por banco
  const seen = new Set<number>();
  const uniques: any[] = [];
  for (const r of sorted) {
    if (seen.has(r.codigoEntidad)) continue;
    seen.add(r.codigoEntidad);
    uniques.push(r);
    if (uniques.length === 5) break;
  }
  return uniques;
}

function Top5Card({ row, tipo, rank }: { row: any; tipo: Tipo; rank: number }) {
  const banco = shortBankName(row.descripcionEntidad);
  const { metric, label, secondary } = describeRow(row, tipo);

  return (
    <Link
      href={`/?tipo=${tipo}#${row.codigoEntidad}`}
      className="bg-panel hover:bg-panel2 transition-colors p-4 group block min-w-0"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="section-eyebrow group-hover:text-accent transition-colors">
          {label}
        </span>
        <span className="text-[10px] tabular text-mutedSoft">#{rank}</span>
      </div>
      <div className="text-2xl tabular font-bold text-accent leading-none truncate">
        {metric}
      </div>
      <div className="text-xs text-ink mt-2 line-clamp-2 leading-tight">
        {banco}
      </div>
      {secondary && (
        <div className="text-[10px] text-muted mt-2 tabular truncate">
          {secondary}
        </div>
      )}
    </Link>
  );
}

function describeRow(
  r: any,
  tipo: Tipo,
): { metric: string; label: string; secondary?: string } {
  switch (tipo) {
    case "plazos-fijos":
      return {
        label: "TEA desde",
        metric: formatPct(r.tasaEfectivaAnualMinima ?? 0),
        secondary: r.montoMinimoInvertir
          ? `Mín. ${formatARS(r.montoMinimoInvertir)} · ${
              r.plazoMinimoInvertirDias ?? 30
            }d`
          : undefined,
      };
    case "personales":
    case "hipotecarios":
    case "prendarios":
      return {
        label: "TEA hasta",
        metric: formatPct(r.tasaEfectivaAnualMaxima ?? 0),
        secondary: r.costoFinancieroEfectivoTotalMaximo
          ? `CFT ${formatPct(r.costoFinancieroEfectivoTotalMaximo)}`
          : undefined,
      };
    case "tarjetas":
      return {
        label: "TEA financ.",
        metric: formatPct(r.tasaEfectivaAnualMaximaFinanciacion ?? 0),
        secondary: r.nombreCorto || r.nombreCompleto,
      };
    case "paquetes":
      return {
        label: "Mantenimiento",
        metric: formatARS(r.comisionMaximaMantenimiento ?? 0),
        secondary: r.nombreCorto || r.nombreCompleto,
      };
    case "cajas":
      return {
        label: "Apertura simpl.",
        metric: r.procesoSimplificadoDebidaDiligencia === "SI" ? "Sí" : "—",
        secondary: undefined,
      };
    case "billeteras":
      return {
        label: "TNA",
        metric: formatPct(r.tna ?? 0),
        secondary: r.nombre,
      };
  }
}
