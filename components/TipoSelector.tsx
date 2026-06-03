"use client";

import Link from "next/link";
import { TIPOS, type Tipo } from "@/lib/transparencia";

export default function TipoSelector({ active }: { active: Tipo }) {
  return (
    <div
      role="tablist"
      aria-label="Tipo de producto"
      className="flex gap-1 mb-6 overflow-x-auto pb-1"
    >
      {TIPOS.map((t) => {
        const isActive = active === t.id;
        return (
          <Link
            key={t.id}
            href={`/comparador?tipo=${t.id}`}
            scroll={false}
            role="tab"
            aria-selected={isActive}
            className={`px-3 py-2 sm:py-2 text-[11px] uppercase tracking-widest border whitespace-nowrap transition-colors ${
              isActive
                ? "bg-accent text-bg border-accent"
                : "border-border text-muted hover:text-ink hover:border-borderStrong"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
