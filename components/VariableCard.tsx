"use client";

import Link from "next/link";
import type { Variable } from "@/lib/bcra";
import { formatNumber } from "@/lib/bcra";

interface Props {
  v: Variable;
  highlight?: boolean;
  delay?: number;
}

export default function VariableCard({ v, highlight, delay = 0 }: Props) {
  return (
    <Link
      href={`/variable/${v.idVariable}`}
      className={`fade-up group block border ${
        highlight ? "border-accent/40" : "border-border"
      } bg-panel hover:border-accent/60 hover:bg-panel/80 transition-all p-4`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-widest text-muted leading-tight">
          #{v.idVariable}
        </span>
        <span className="text-[10px] text-muted tabular">{v.fecha}</span>
      </div>
      <h3
        className={`text-xs leading-snug mb-3 line-clamp-2 ${
          highlight ? "text-ink" : "text-ink/90"
        }`}
      >
        {v.descripcion}
      </h3>
      <div
        className={`tabular font-bold ${
          highlight ? "text-accent text-2xl" : "text-ink text-xl"
        }`}
      >
        {formatNumber(v.valor)}
      </div>
      <div className="mt-2 h-px bg-border group-hover:bg-accent/40 transition-colors" />
    </Link>
  );
}
