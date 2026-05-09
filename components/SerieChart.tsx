"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { SeriePoint } from "@/lib/bcra";
import { formatNumber } from "@/lib/bcra";

interface Props {
  data: SeriePoint[];
}

const RANGES = [
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1A", days: 365 },
  { label: "5A", days: 365 * 5 },
  { label: "MAX", days: Infinity },
] as const;

export default function SerieChart({ data }: Props) {
  const [rangeIdx, setRangeIdx] = useState(2);

  const filtered = useMemo(() => {
    const days = RANGES[rangeIdx].days;
    if (!Number.isFinite(days)) return data;
    const cutoff = Date.now() - days * 86400_000;
    return data.filter((p) => new Date(p.fecha).getTime() >= cutoff);
  }, [data, rangeIdx]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const first = filtered[0].valor;
    const last = filtered[filtered.length - 1].valor;
    const min = Math.min(...filtered.map((p) => p.valor));
    const max = Math.max(...filtered.map((p) => p.valor));
    const promedio =
      filtered.reduce((acc, p) => acc + p.valor, 0) / filtered.length;
    const change = first === 0 ? 0 : ((last - first) / Math.abs(first)) * 100;
    const ultimaFecha = filtered[filtered.length - 1].fecha;
    return { first, last, min, max, promedio, change, ultimaFecha };
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="empty-state">
        El BCRA no publicó datos en este rango. Probá con un período más largo.
      </div>
    );
  }

  const positive = stats && stats.change >= 0;

  return (
    <div>
      <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-3xl md:text-4xl font-bold tabular text-accent leading-none">
            {formatNumber(stats!.last)}
          </div>
          <div
            className={`text-sm tabular mt-2 ${
              positive ? "text-ok" : "text-danger"
            }`}
          >
            <span aria-hidden="true">{positive ? "▲" : "▼"}</span>{" "}
            {formatNumber(Math.abs(stats!.change))}%
            <span className="text-muted ml-2 normal-case">
              en {RANGES[rangeIdx].label}
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted mt-1 tabular">
            Última publicación: {stats!.ultimaFecha}
          </div>
        </div>
        <div
          role="tablist"
          aria-label="Rango temporal"
          className="flex border border-border divide-x divide-border"
        >
          {RANGES.map((r, i) => {
            const active = i === rangeIdx;
            return (
              <button
                key={r.label}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRangeIdx(i)}
                className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${
                  active
                    ? "bg-accent text-bg"
                    : "text-muted hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[360px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5c518" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f5c518" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(127,127,127,0.18)" vertical={false} />
            <XAxis
              dataKey="fecha"
              stroke="rgb(140,140,140)"
              fontSize={10}
              tickLine={false}
              minTickGap={32}
            />
            <YAxis
              stroke="rgb(140,140,140)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v) => formatNumber(v, 0)}
            />
            <Tooltip
              contentStyle={{
                background: "rgb(20,20,20,0.96)",
                border: "1px solid rgba(127,127,127,0.4)",
                fontSize: 12,
                fontFamily: "JetBrains Mono",
                color: "#ededed",
              }}
              labelStyle={{ color: "rgb(160,160,160)" }}
              itemStyle={{
                color: "#f5c518",
                fontFamily: "JetBrains Mono",
                fontVariantNumeric: "tabular-nums",
              }}
              cursor={{
                stroke: "#f5c518",
                strokeOpacity: 0.3,
                strokeDasharray: "2 2",
              }}
              formatter={(v: number) => [formatNumber(v), "Valor"]}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke="#f5c518"
              strokeWidth={1.5}
              fill="url(#g)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border mt-6 border border-border">
        <div className="bg-panel p-3 min-w-0">
          <div className="section-eyebrow">Mínimo</div>
          <div className="tabular text-sm mt-1 truncate">
            {formatNumber(stats!.min)}
          </div>
        </div>
        <div className="bg-panel p-3 min-w-0">
          <div className="section-eyebrow">Máximo</div>
          <div className="tabular text-sm mt-1 truncate">
            {formatNumber(stats!.max)}
          </div>
        </div>
        <div className="bg-panel p-3 min-w-0">
          <div className="section-eyebrow">Promedio</div>
          <div className="tabular text-sm mt-1 truncate">
            {formatNumber(stats!.promedio)}
          </div>
        </div>
        <div className="bg-panel p-3 min-w-0">
          <div className="section-eyebrow">Datos</div>
          <div className="tabular text-sm mt-1">{filtered.length}</div>
        </div>
      </div>
    </div>
  );
}
