"use client";

import Link from "next/link";
import { TIPOS, type Tipo } from "./TransparenciaTable";

export default function TipoSelector({ active }: { active: Tipo }) {
  return (
    <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
      {TIPOS.map((t) => (
        <Link
          key={t.id}
          href={`/?tipo=${t.id}`}
          scroll={false}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border whitespace-nowrap transition-colors ${
            active === t.id
              ? "bg-accent text-bg border-accent"
              : "border-border text-muted hover:text-ink hover:border-ink/40"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
