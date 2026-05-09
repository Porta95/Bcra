"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { formatARS } from "@/lib/bcra";
import { fmtPeriodoHumano, type PeriodoStat } from "@/lib/deudores-analysis";

interface Props {
  data: PeriodoStat[];
}

const SIT_COLOR: Record<number, string> = {
  0: "rgba(127,127,127,0.3)",
  1: "#4ade80",
  2: "#facc15",
  3: "#f59e0b",
  4: "#f97316",
  5: "#ef4444",
  6: "#b91c1c",
};

export default function DeudaTimeline({ data }: Props) {
  if (data.length < 2) {
    return (
      <div className="empty-state">
        Hace falta al menos 2 períodos informados para dibujar la evolución.
      </div>
    );
  }

  const enriched = data.map((p) => ({
    ...p,
    periodoHumano: fmtPeriodoHumano(p.periodo),
  }));

  return (
    <div className="border border-border bg-panel p-3">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="section-eyebrow">Evolución 24 meses</div>
        <div className="flex gap-3 text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-accent" /> Deuda total
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-ok" /> Sit. 1
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-warn" /> 2–3
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-danger" /> 4+
          </span>
        </div>
      </div>
      <div className="h-[260px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={enriched}
            margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="rgba(127,127,127,0.18)" vertical={false} />
            <XAxis
              dataKey="periodoHumano"
              stroke="rgb(140,140,140)"
              fontSize={10}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              yAxisId="left"
              stroke="rgb(140,140,140)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={70}
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000
                  ? `${(v / 1_000).toFixed(0)}k`
                  : String(v)
              }
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="rgb(140,140,140)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={20}
              ticks={[0, 1, 2, 3, 4, 5, 6]}
              domain={[0, 6]}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(20,20,20,0.96)",
                border: "1px solid rgba(127,127,127,0.4)",
                fontSize: 12,
                fontFamily: "JetBrains Mono",
                color: "#ededed",
              }}
              labelStyle={{ color: "rgb(160,160,160)" }}
              itemStyle={{
                fontFamily: "JetBrains Mono",
                fontVariantNumeric: "tabular-nums",
              }}
              formatter={(value: any, name) => {
                if (name === "Deuda") return [formatARS(value as number), "Deuda"];
                if (name === "Situación") return [String(value), "Peor sit."];
                return [String(value), name];
              }}
            />
            <Bar
              yAxisId="right"
              dataKey="peorSit"
              name="Situación"
              barSize={14}
              opacity={0.85}
            >
              {enriched.map((p, i) => (
                <Cell key={i} fill={SIT_COLOR[p.peorSit] ?? SIT_COLOR[0]} />
              ))}
            </Bar>
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="monto"
              name="Deuda"
              stroke="#f5c518"
              strokeWidth={2}
              dot={{ fill: "#f5c518", r: 2 }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
