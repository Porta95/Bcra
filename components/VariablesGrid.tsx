"use client";

import { useMemo, useState } from "react";
import VariableCard from "./VariableCard";
import type { Variable } from "@/lib/bcra";

const PRINCIPALES = "Principales Variables";

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

    // Categoría "Principales Variables" arriba (definida por el BCRA en v4)
    const highlights = filtered.filter((v) => v.categoria === PRINCIPALES);
    const rest = filtered.filter((v) => v.categoria !== PRINCIPALES);
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
          {rest.slice(0, 200).map((v, i) => (
            <VariableCard
              key={v.idVariable}
              v={v}
              delay={Math.min(i, 20) * 20}
            />
          ))}
        </div>
      )}
      {!query && rest.length > 200 && (
        <div className="mt-6 text-center text-xs text-muted">
          Mostrando 200 de {rest.length} series. Usá el buscador para encontrar
          una específica.
        </div>
      )}
    </>
  );
}
