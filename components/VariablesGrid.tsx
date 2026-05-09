"use client";

import { useMemo, useState } from "react";
import VariableCard from "./VariableCard";
import type { Variable } from "@/lib/bcra";

interface Props {
  variables: Variable[];
}

export default function VariablesGrid({ variables }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return variables;
    return variables.filter((v) =>
      v.descripcion.toLowerCase().includes(q),
    );
  }, [query, variables]);

  return (
    <>
      <div className="mb-2">
        <label htmlFor="macro-search" className="sr-only">
          Buscar variable
        </label>
        <input
          id="macro-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar entre las 1100+ series… (reservas, BADLAR, encajes, dólar)"
          className="input"
        />
      </div>
      <div className="mb-6 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted tabular">
        <span>
          {query ? `Resultados (${filtered.length})` : `${variables.length} series`}
        </span>
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="btn-ghost py-1"
          >
            Limpiar
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          {query
            ? `Sin resultados para "${query}". Probá con otra palabra (ej. reservas, dólar, tasa).`
            : "Sin variables disponibles."}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.slice(0, 200).map((v, i) => (
            <VariableCard
              key={v.idVariable}
              v={v}
              delay={Math.min(i, 20) * 20}
            />
          ))}
        </div>
      )}
      {!query && filtered.length > 200 && (
        <div className="mt-6 text-center text-xs text-muted">
          Mostrando 200 de {filtered.length} series. Usá el buscador para
          encontrar una específica.
        </div>
      )}
    </>
  );
}
