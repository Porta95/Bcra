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
  const [rangeIdx, setRangeIdx] = useState(2); // default: 1 año

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
    const change = first === 0 ? 0 : ((last - first) / Math.abs(first)) * 100;
    return { first, last, min, max, change };
  }, [filtered]);

  if (filtered.length === 0) {
    return <div className="text-muted text-sm py-12 text-center">Sin datos</div>;
  }

  const positive = stats && stats.change >= 0;

  return (
    <div>
      <div className="flex items-end justify-between mb-4 gap-4 flex-wrap">
        <div>
          <div className="text-3xl md:text-4xl font-bold tabular text-accent leading-none">
            {formatNumber(stats!.last)}
          </div>
          <div
            className={`text-sm tabular mt-2 ${
              positive ? "text-green" : "text-red"
            }`}
          >
            {positive ? "▲" : "▼"} {formatNumber(Math.abs(stats!.change))}%
            <span className="text-muted ml-2 normal-case">
              en {RANGES[rangeIdx].label}
            </span>
          </div>
        </div>
        <div className="flex border border-border">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${
                i === rangeIdx
                  ? "bg-accent text-bg"
                  : "text-muted hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
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
            <CartesianGrid stroke="#1f1f1f" vertical={false} />
            <XAxis
              dataKey="fecha"
              stroke="#666"
              fontSize={10}
              tickLine={false}
              minTickGap={32}
            />
            <YAxis
              stroke="#666"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v) => formatNumber(v, 0)}
            />
            <Tooltip
              contentStyle={{
                background: "#111",
                border: "1px solid #1f1f1f",
                fontSize: 12,
                fontFamily: "JetBrains Mono",
              }}
              labelStyle={{ color: "#666" }}
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

      <div className="grid grid-cols-3 gap-px bg-border mt-6 border border-border">
        <div className="bg-panel p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted">Mínimo</div>
          <div className="tabular text-sm mt-1">{formatNumber(stats!.min)}</div>
        </div>
        <div className="bg-panel p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted">Máximo</div>
          <div className="tabular text-sm mt-1">{formatNumber(stats!.max)}</div>
        </div>
        <div className="bg-panel p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted">Puntos</div>
          <div className="tabular text-sm mt-1">{filtered.length}</div>
        </div>
      </div>
    </div>
  );
}
