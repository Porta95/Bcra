"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Sparkline from "./Sparkline";
import { describirSituacion, formatARS } from "@/lib/bcra";
import { fmtPeriodoHumano, type BancoStat } from "@/lib/deudores-analysis";

interface Props {
  banco: BancoStat;
}

export default function BancoCard({ banco }: Props) {
  const [open, setOpen] = useState(false);
  const ultimo = banco.ultimo;
  const ultimoMonto = (ultimo?.monto ?? 0) * 1000;
  const sit = ultimo ? describirSituacion(ultimo.situacion) : null;
  const sitColor =
    sit?.tone === "ok"
      ? "text-ok"
      : sit?.tone === "warn"
      ? "text-warn"
      : sit
      ? "text-danger"
      : "text-muted";
  const spark = banco.historial.map((h) => h.monto);
  const trendPositive =
    spark.length > 1 ? spark[spark.length - 1] >= spark[0] : true;

  return (
    <article className="border border-border bg-panel hover:border-accent/40 transition-colors">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left p-4 grid grid-cols-[1fr_auto] gap-4 items-start"
      >
        <div className="min-w-0">
          <div className="font-display italic text-base text-ink truncate">
            {banco.shortName}
          </div>
          <div className="section-eyebrow mt-1 truncate" title={banco.entidad}>
            {banco.entidad}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-3">
            <KV label="Deuda actual" value={formatARS(ultimoMonto)} accent />
            {sit && (
              <KV
                label="Situación"
                value={`${ultimo?.situacion} · ${sit.label}`}
                colorClass={sitColor}
              />
            )}
            {ultimo?.diasAtrasoPago ? (
              <KV
                label="Atraso"
                value={`${ultimo.diasAtrasoPago} días`}
                colorClass="text-warn"
              />
            ) : null}
          </div>
          {banco.flags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {banco.flags.map((f) => (
                <span
                  key={f.key}
                  className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 border ${
                    f.tone === "danger"
                      ? "border-danger/50 text-danger bg-danger/5"
                      : "border-warn/50 text-warn bg-warn/5"
                  }`}
                >
                  {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 w-32 flex flex-col items-end">
          {spark.length > 1 && (
            <div className="w-full">
              <Sparkline data={spark} positive={trendPositive} height={40} />
            </div>
          )}
          <ChevronRight
            aria-hidden="true"
            size={16}
            className={`text-muted mt-2 transition-transform duration-150 ease-spring ${
              open ? "rotate-90 text-accent" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-border overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Situación</th>
                <th className="text-right">Atraso</th>
                <th className="text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {[...banco.historial].reverse().map((h, i) => {
                const s = describirSituacion(h.situacion);
                const color =
                  s.tone === "ok"
                    ? "text-ok"
                    : s.tone === "warn"
                    ? "text-warn"
                    : "text-danger";
                return (
                  <tr key={`${h.periodo}-${i}`}>
                    <td className="tabular text-muted">
                      {fmtPeriodoHumano(h.periodo)}
                    </td>
                    <td className={color}>
                      {h.situacion} · {s.label}
                    </td>
                    <td className="text-right tabular text-muted">
                      {h.atraso ? `${h.atraso}d` : "—"}
                    </td>
                    <td className="text-right tabular">
                      {formatARS(h.monto)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function KV({
  label,
  value,
  accent,
  colorClass,
}: {
  label: string;
  value: string;
  accent?: boolean;
  colorClass?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="section-eyebrow truncate">{label}</div>
      <div
        className={`mt-0.5 tabular text-sm truncate ${
          colorClass ?? (accent ? "text-accent font-bold" : "text-ink")
        }`}
      >
        {value}
      </div>
    </div>
  );
}
