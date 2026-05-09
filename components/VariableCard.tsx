"use client";

import Link from "next/link";
import type { Variable } from "@/lib/bcra";
import { formatNumber } from "@/lib/bcra";

interface Props {
  v: Variable;
  highlight?: boolean;
  delay?: number;
  size?: "default" | "feature";
}

export default function VariableCard({
  v,
  highlight,
  delay = 0,
  size = "default",
}: Props) {
  const isFeature = size === "feature";
  return (
    <Link
      href={`/variable/${v.idVariable}`}
      className={`fade-up group block ${
        isFeature
          ? "card-emphasis hover:bg-panel2"
          : `border ${
              highlight ? "border-accent/40" : "border-border"
            } bg-panel hover:border-accent/60 hover:bg-panel2 p-4`
      } transition-all`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="section-eyebrow leading-tight">#{v.idVariable}</span>
        <span className="text-[10px] text-muted tabular">
          {v.ultFechaInformada}
        </span>
      </div>
      <h3
        className={`leading-snug mb-3 line-clamp-2 ${
          isFeature
            ? "text-ink text-sm font-display italic"
            : highlight
            ? "text-ink text-xs"
            : "text-ink/90 text-xs"
        }`}
      >
        {v.descripcion}
      </h3>
      <div
        className={`tabular font-bold ${
          isFeature
            ? "text-accent text-4xl"
            : highlight
            ? "text-accent text-2xl"
            : "text-ink text-xl"
        }`}
      >
        {formatNumber(v.ultValorInformado)}
      </div>
      {v.unidadExpresion && (
        <div className="text-[10px] text-muted mt-1 truncate">
          {v.unidadExpresion}
        </div>
      )}
      <div className="mt-2 h-px bg-border group-hover:bg-accent/40 transition-colors" />
    </Link>
  );
}
