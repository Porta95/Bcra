"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  formatARS,
  formatPct,
  shortBankName,
} from "@/lib/bcra";
import {
  SUBTIPOS_PF,
  type SubTipoPF,
  bucketPlazoFijo,
  dedupeByBank,
} from "@/lib/comparador-helpers";
import { type Tipo } from "@/lib/transparencia";
import BankAvatar from "./BankAvatar";

interface Props {
  tipo: Tipo;
  data: any[];
  initialSub?: SubTipoPF;
}

interface RowSpec {
  primary: string;
  primaryLabel: string;
  primarySort: number;
  primaryTone: "accent" | "ok" | "warn" | "danger";
  chip: string;
  secondary?: string;
  row: any;
}

function describeRow(tipo: Tipo, r: any): RowSpec {
  switch (tipo) {
    case "plazos-fijos": {
      const sub = bucketPlazoFijo(r);
      const subLabel =
        sub === "tradicional"
          ? "Tradicional"
          : sub === "uva"
          ? "UVA"
          : "UVA precancelable";
      return {
        primary: formatPct(r.tasaEfectivaAnualMinima ?? 0),
        primaryLabel: "TEA",
        primarySort: -(r.tasaEfectivaAnualMinima ?? 0),
        primaryTone: "accent",
        chip: subLabel,
        secondary:
          r.montoMinimoInvertir
            ? `Mín. ${formatARS(r.montoMinimoInvertir)} · ${
                r.plazoMinimoInvertirDias ?? 30
              } días`
            : `${r.plazoMinimoInvertirDias ?? 30} días`,
        row: r,
      };
    }
    case "personales":
    case "hipotecarios":
    case "prendarios": {
      return {
        primary: formatPct(r.tasaEfectivaAnualMaxima ?? 0),
        primaryLabel: "TEA",
        primarySort: r.tasaEfectivaAnualMaxima ?? Infinity,
        primaryTone: "danger",
        chip: r.denominacion || "Préstamo",
        secondary: r.costoFinancieroEfectivoTotalMaximo
          ? `CFT ${formatPct(r.costoFinancieroEfectivoTotalMaximo)}`
          : r.plazoMaximoOtorgable
          ? `Hasta ${r.plazoMaximoOtorgable} meses`
          : undefined,
        row: r,
      };
    }
    case "tarjetas": {
      return {
        primary: formatPct(r.tasaEfectivaAnualMaximaFinanciacion ?? 0),
        primaryLabel: "TEA financ.",
        primarySort: r.tasaEfectivaAnualMaximaFinanciacion ?? Infinity,
        primaryTone: "danger",
        chip: r.nombreCorto || "Tarjeta",
        secondary: r.segmento || undefined,
        row: r,
      };
    }
    case "cajas": {
      const si = r.procesoSimplificadoDebidaDiligencia === "SI";
      return {
        primary: si ? "Sí" : "No",
        primaryLabel: "Apertura simpl.",
        primarySort: si ? -1 : 1,
        primaryTone: si ? "ok" : "warn",
        chip: "Caja de ahorro",
        row: r,
      };
    }
    case "paquetes": {
      return {
        primary: formatARS(r.comisionMaximaMantenimiento ?? 0),
        primaryLabel: "Mantenimiento",
        primarySort: r.comisionMaximaMantenimiento ?? Infinity,
        primaryTone: "danger",
        chip: r.nombreCorto || "Paquete",
        secondary: r.segmento || undefined,
        row: r,
      };
    }
  }
}

function rendimientoPF(tea: number, monto: number, plazoDias: number) {
  return monto * (1 + (tea / 100) * (plazoDias / 365));
}

function tieneMetricaValida(tipo: Tipo, r: any): boolean {
  switch (tipo) {
    case "plazos-fijos":
      return (r.tasaEfectivaAnualMinima ?? 0) > 0;
    case "personales":
    case "hipotecarios":
    case "prendarios":
      return (
        Number.isFinite(r.tasaEfectivaAnualMaxima) &&
        r.tasaEfectivaAnualMaxima > 0
      );
    case "tarjetas":
      return (
        Number.isFinite(r.tasaEfectivaAnualMaximaFinanciacion) &&
        r.tasaEfectivaAnualMaximaFinanciacion > 0
      );
    case "paquetes":
      return r.comisionMaximaMantenimiento !== null && r.comisionMaximaMantenimiento !== undefined;
    case "cajas":
      return true;
  }
}

export default function ComparadorList({ tipo, data, initialSub }: Props) {
  const [query, setQuery] = useState("");
  const [calcOn, setCalcOn] = useState(false);
  const [monto, setMonto] = useState(500_000);
  const [plazoDias, setPlazoDias] = useState(30);
  const [sub, setSub] = useState<SubTipoPF>(initialSub ?? "tradicional");

  const filteredBySub = useMemo(() => {
    if (tipo !== "plazos-fijos") return data;
    return data.filter((r) => bucketPlazoFijo(r) === sub);
  }, [tipo, data, sub]);

  const validRows = useMemo(
    () => filteredBySub.filter((r) => tieneMetricaValida(tipo, r)),
    [tipo, filteredBySub],
  );

  const dedupedRows = useMemo(
    () => dedupeByBank(tipo, validRows),
    [tipo, validRows],
  );

  const rows = useMemo(() => {
    const all = dedupedRows.map((r) => describeRow(tipo, r));
    let out = all;
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((spec) => {
        const banco = shortBankName(spec.row.descripcionEntidad ?? "");
        return (
          banco.toLowerCase().includes(q) ||
          (spec.row.descripcionEntidad ?? "").toLowerCase().includes(q) ||
          spec.chip.toLowerCase().includes(q)
        );
      });
    }
    return [...out].sort((a, b) => a.primarySort - b.primarySort);
  }, [dedupedRows, tipo, query]);

  const totalSinFiltro = dedupedRows.length;

  return (
    <div className="space-y-4">
      {tipo === "plazos-fijos" && (
        <SubTabs sub={sub} onChange={setSub} />
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar banco o billetera"
          aria-label="Buscar banco o producto"
          className="input flex-1 min-w-[200px]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="btn-ghost py-1.5"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="text-[10px] uppercase tracking-widest text-muted tabular">
        Mostrando {rows.length} de {totalSinFiltro}{" "}
        {totalSinFiltro === 1 ? "entidad" : "entidades"}
        {query && ` · filtrado "${query}"`}
      </div>

      {tipo === "plazos-fijos" && (
        <CalcStrip
          calcOn={calcOn}
          setCalcOn={setCalcOn}
          monto={monto}
          setMonto={setMonto}
          plazoDias={plazoDias}
          setPlazoDias={setPlazoDias}
        />
      )}

      {rows.length === 0 ? (
        <div className="empty-state">
          {query
            ? `Ninguna entidad coincide con "${query}".`
            : "Sin entidades para mostrar."}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.slice(0, 200).map((spec, i) => (
            <RowCard
              key={`${spec.row.codigoEntidad}-${i}`}
              spec={spec}
              tipo={tipo}
              calc={
                tipo === "plazos-fijos" && calcOn
                  ? { monto, plazoDias }
                  : undefined
              }
              rank={i + 1}
            />
          ))}
          {rows.length > 200 && (
            <div className="text-center text-[10px] text-muted py-3">
              Mostrando 200 de {rows.length}. Refiná con el buscador.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubTabs({
  sub,
  onChange,
}: {
  sub: SubTipoPF;
  onChange: (s: SubTipoPF) => void;
}) {
  return (
    <div role="tablist" className="border-b border-border flex overflow-x-auto">
      {SUBTIPOS_PF.map((t) => {
        const active = sub === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`px-4 py-2.5 text-[11px] uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${
              active
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function CalcStrip({
  calcOn,
  setCalcOn,
  monto,
  setMonto,
  plazoDias,
  setPlazoDias,
}: {
  calcOn: boolean;
  setCalcOn: (v: boolean) => void;
  monto: number;
  setMonto: (n: number) => void;
  plazoDias: number;
  setPlazoDias: (n: number) => void;
}) {
  return (
    <div className="border border-border bg-panel p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="section-eyebrow">Calculadora</div>
        <button
          type="button"
          onClick={() => setCalcOn(!calcOn)}
          className={`text-[10px] uppercase tracking-widest px-2 py-1 border transition-colors ${
            calcOn
              ? "border-accent text-accent"
              : "border-border text-muted hover:text-ink hover:border-borderStrong"
          }`}
        >
          {calcOn ? "Activa" : "Activar"}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted block mb-1">
            Monto a invertir{" "}
            <span className="text-accent tabular ml-2">{formatARS(monto)}</span>
          </label>
          <input
            type="range"
            min={50_000}
            max={10_000_000}
            step={50_000}
            value={monto}
            onChange={(e) => setMonto(Number(e.target.value))}
            disabled={!calcOn}
            aria-label="Monto a invertir"
            className="w-full accent-accent disabled:opacity-40"
          />
          <div className="flex justify-between text-[9px] text-muted tabular mt-1">
            <span>$50k</span>
            <span>$10M</span>
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted block mb-1">
            Plazo{" "}
            <span className="text-accent tabular ml-2">{plazoDias} días</span>
          </label>
          <div className="flex gap-1 flex-wrap">
            {[30, 60, 90, 180, 365].map((d) => (
              <button
                key={d}
                type="button"
                disabled={!calcOn}
                onClick={() => setPlazoDias(d)}
                className={`px-2 py-1 text-[10px] uppercase tracking-widest border transition-colors disabled:opacity-40 ${
                  plazoDias === d && calcOn
                    ? "border-accent text-accent"
                    : "border-border text-muted hover:text-ink hover:border-borderStrong"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>
      {calcOn && (
        <p className="text-[10px] text-muted mt-3 leading-relaxed">
          Aparece "Te llevás" debajo de cada TEA con la estimación lineal de
          rendimiento al vencimiento. No compone capitalizaciones intermedias.
        </p>
      )}
    </div>
  );
}

function RowCard({
  spec,
  tipo,
  calc,
  rank,
}: {
  spec: RowSpec;
  tipo: Tipo;
  calc?: { monto: number; plazoDias: number };
  rank: number;
}) {
  const banco = shortBankName(spec.row.descripcionEntidad ?? "");
  const toneClass =
    spec.primaryTone === "accent"
      ? "text-accent"
      : spec.primaryTone === "ok"
      ? "text-ok"
      : spec.primaryTone === "danger"
      ? "text-danger"
      : "text-warn";

  let calcText: string | null = null;
  if (calc && tipo === "plazos-fijos") {
    const tea = spec.row.tasaEfectivaAnualMinima ?? 0;
    if (tea > 0) {
      const rinde = rendimientoPF(tea, calc.monto, calc.plazoDias);
      calcText = `Te llevás ${formatARS(rinde)}`;
    }
  }

  const isTop = rank <= 3;

  return (
    <article
      className={`border bg-panel hover:bg-panel2 transition-colors p-3 sm:p-4 flex items-center gap-3 sm:gap-4 ${
        isTop ? "border-accent/40" : "border-border"
      }`}
    >
      <BankAvatar name={spec.row.descripcionEntidad ?? "—"} size={44} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm sm:text-base text-ink truncate">{banco}</div>
          {isTop && (
            <span className="text-[9px] uppercase tracking-widest text-accent tabular shrink-0">
              #{rank}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest border border-border text-muted px-1.5 py-0.5 truncate max-w-[180px]">
            {spec.chip}
          </span>
          {spec.secondary && (
            <span className="text-[10px] text-mutedSoft tabular">
              {spec.secondary}
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 min-w-[80px]">
        <div className={`text-xl sm:text-2xl font-bold tabular ${toneClass}`}>
          {spec.primary}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted">
          {spec.primaryLabel}
        </div>
        {calcText && (
          <div className="text-[10px] text-ok mt-1 tabular leading-tight">
            {calcText}
          </div>
        )}
      </div>
    </article>
  );
}
