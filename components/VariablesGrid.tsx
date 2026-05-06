"use client";

import { useMemo, useState } from "react";
import VariableCard from "./VariableCard";
import type { Variable } from "@/lib/bcra";

// IDs de variables que destacamos arriba como "headlines"
const HIGHLIGHT_IDS = [
  1,   // Reservas internacionales
  4,   // Tipo de cambio minorista
  5,   // Tipo de cambio mayorista
  15,  // Base monetaria
  6,   // Tasa BADLAR
  27,  // Inflación mensual
  28,  // Inflación interanual
];

interface Props {
  variables: Variable[];
}

export default function VariablesGrid({ variables }: Props) {
  const [query, setQuery] = useState("");

  const { highlights, rest } = useMemo(() => {
    const filtered = query.trim()
      ? variables.filter((v) =>
          v.descripcion.toLowerCase().includes(query.toLowerCase()),
        )
      : variables;

    if (query.trim()) {
      return { highlights: [], rest: filtered };
    }

    const highlights = HIGHLIGHT_IDS
      .map((id) => filtered.find((v) => v.idVariable === id))
      .filter((v): v is Variable => Boolean(v));
    const highlightSet = new Set(highlights.map((v) => v.idVariable));
    const rest = filtered.filter((v) => !highlightSet.has(v.idVariable));

    return { highlights, rest };
  }, [query, variables]);

  return (
    <>
      <div className="mb-6 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar variable... (reservas, tasa, inflación, base monetaria)"
          className="w-full bg-panel border border-border focus:border-accent/60 focus:outline-none px-4 py-3 text-sm placeholder:text-muted"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted tabular">
          {variables.length} series
        </span>
      </div>

      {highlights.length > 0 && (
        <>
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted mb-3">
            ━ Principales
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {highlights.map((v, i) => (
              <VariableCard key={v.idVariable} v={v} highlight delay={i * 40} />
            ))}
          </div>
        </>
      )}

      <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted mb-3">
        ━ {query ? `Resultados (${rest.length})` : "Todas las series"}
      </h2>
      {rest.length === 0 ? (
        <div className="text-muted text-sm py-12 text-center border border-border">
          No hay coincidencias para «{query}»
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {rest.map((v, i) => (
            <VariableCard key={v.idVariable} v={v} delay={Math.min(i, 20) * 20} />
          ))}
        </div>
      )}
    </>
  );
}
