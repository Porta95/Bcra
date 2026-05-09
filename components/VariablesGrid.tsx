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

  const { feature, highlights, rest } = useMemo(() => {
    const filtered = query.trim()
      ? variables.filter((v) =>
          v.descripcion.toLowerCase().includes(query.toLowerCase()),
        )
      : variables;

    if (query.trim()) {
      return { feature: null as Variable | null, highlights: [] as Variable[], rest: filtered };
    }

    const principales = filtered.filter((v) => v.categoria === PRINCIPALES);
    const otras = filtered.filter((v) => v.categoria !== PRINCIPALES);

    return {
      feature: principales[0] ?? null,
      highlights: principales.slice(1),
      rest: otras,
    };
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
          placeholder="Buscar variable… (reservas, tasa, inflación, base monetaria)"
          className="input"
        />
      </div>
      <div className="mb-6 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted tabular">
        <span>{variables.length} series</span>
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

      {!query && feature && (
        <>
          <h2 className="section-eyebrow mb-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-6 h-px bg-accent align-middle"
            />
            Principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="md:col-span-2">
              <VariableCard v={feature} highlight size="feature" />
            </div>
            {highlights.slice(0, 1).map((v, i) => (
              <VariableCard
                key={v.idVariable}
                v={v}
                highlight
                delay={(i + 1) * 40}
              />
            ))}
          </div>
          {highlights.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
              {highlights.slice(1).map((v, i) => (
                <VariableCard
                  key={v.idVariable}
                  v={v}
                  highlight
                  delay={(i + 2) * 40}
                />
              ))}
            </div>
          )}
        </>
      )}

      <h2 className="section-eyebrow mb-3 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block w-6 h-px bg-accent align-middle"
        />
        {query ? `Resultados (${rest.length})` : "Todas las series"}
      </h2>
      {rest.length === 0 ? (
        <div className="empty-state">
          {query
            ? `Sin resultados para "${query}". Probá con otra palabra (ej. reservas, dólar, tasa).`
            : "Sin variables disponibles."}
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
