"use client";

import { useMemo, useState } from "react";
import { formatARS, formatPct, shortBankName } from "@/lib/bcra";
import { type Tipo } from "@/lib/transparencia";

interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  get: (row: T) => string | number | null;
  sort: (row: T) => number;
  render: (row: T) => React.ReactNode;
}

function getColumns(tipo: Tipo): Column<any>[] {
  const banco: Column<any> = {
    key: "banco",
    label: "Entidad",
    get: (r) => r.descripcionEntidad,
    sort: (r) => r.descripcionEntidad?.localeCompare?.("") ?? 0,
    render: (r) => (
      <span className="text-ink">{shortBankName(r.descripcionEntidad)}</span>
    ),
  };
  const fecha: Column<any> = {
    key: "fecha",
    label: "Actualizado",
    align: "right",
    get: (r) => r.fechaInformacion,
    sort: (r) => new Date(r.fechaInformacion).getTime() || 0,
    render: (r) => (
      <span className="text-muted tabular text-[11px]">{r.fechaInformacion}</span>
    ),
  };

  switch (tipo) {
    case "plazos-fijos":
      return [
        banco,
        {
          key: "producto",
          label: "Producto",
          get: (r) => r.nombreCorto,
          sort: () => 0,
          render: (r) => <span>{r.nombreCorto || r.nombreCompleto}</span>,
        },
        {
          key: "tea",
          label: "TEA (desde)",
          align: "right",
          get: (r) => r.tasaEfectivaAnualMinima,
          sort: (r) => -(r.tasaEfectivaAnualMinima ?? 0),
          render: (r) => (
            <span className="text-accent tabular font-bold">
              {formatPct(r.tasaEfectivaAnualMinima ?? 0)}
            </span>
          ),
        },
        {
          key: "min",
          label: "Mín. invertir",
          align: "right",
          get: (r) => r.montoMinimoInvertir,
          sort: (r) => r.montoMinimoInvertir ?? 0,
          render: (r) => (
            <span className="tabular text-muted">
              {formatARS(r.montoMinimoInvertir ?? 0)}
            </span>
          ),
        },
        {
          key: "dias",
          label: "Plazo (días)",
          align: "right",
          get: (r) => r.plazoMinimoInvertirDias,
          sort: (r) => r.plazoMinimoInvertirDias ?? 0,
          render: (r) => (
            <span className="tabular text-muted">
              {r.plazoMinimoInvertirDias}d
            </span>
          ),
        },
        fecha,
      ];

    case "personales":
    case "hipotecarios":
    case "prendarios":
      return [
        banco,
        {
          key: "denom",
          label: "Moneda",
          get: (r) => r.denominacion,
          sort: (r) => r.denominacion?.localeCompare?.("") ?? 0,
          render: (r) => (
            <span className="text-[11px] text-muted">{r.denominacion}</span>
          ),
        },
        {
          key: "tea",
          label: "TEA (hasta)",
          align: "right",
          get: (r) => r.tasaEfectivaAnualMaxima,
          sort: (r) => r.tasaEfectivaAnualMaxima ?? Infinity,
          render: (r) => (
            <span className="text-accent tabular font-bold">
              {formatPct(r.tasaEfectivaAnualMaxima ?? 0)}
            </span>
          ),
        },
        {
          key: "cft",
          label: "CFT (costo total)",
          align: "right",
          get: (r) => r.costoFinancieroEfectivoTotalMaximo,
          sort: (r) => r.costoFinancieroEfectivoTotalMaximo ?? Infinity,
          render: (r) => (
            <span className="tabular text-danger">
              {formatPct(r.costoFinancieroEfectivoTotalMaximo ?? 0)}
            </span>
          ),
        },
        {
          key: "max",
          label: "Monto máx",
          align: "right",
          get: (r) => r.montoMaximoOtorgable,
          sort: (r) => -(r.montoMaximoOtorgable ?? 0),
          render: (r) => (
            <span className="tabular text-muted">
              {formatARS(r.montoMaximoOtorgable ?? 0)}
            </span>
          ),
        },
        {
          key: "plazo",
          label: "Plazo (meses)",
          align: "right",
          get: (r) => r.plazoMaximoOtorgable,
          sort: (r) => -(r.plazoMaximoOtorgable ?? 0),
          render: (r) => (
            <span className="tabular text-muted">{r.plazoMaximoOtorgable}m</span>
          ),
        },
      ];

    case "tarjetas":
      return [
        banco,
        {
          key: "tarjeta",
          label: "Tarjeta",
          get: (r) => r.nombreCorto,
          sort: () => 0,
          render: (r) => <span>{r.nombreCorto}</span>,
        },
        {
          key: "tea",
          label: "TEA financiación",
          align: "right",
          get: (r) => r.tasaEfectivaAnualMaximaFinanciacion,
          sort: (r) => r.tasaEfectivaAnualMaximaFinanciacion ?? Infinity,
          render: (r) => (
            <span className="text-accent tabular font-bold">
              {formatPct(r.tasaEfectivaAnualMaximaFinanciacion ?? 0)}
            </span>
          ),
        },
        {
          key: "mant",
          label: "Mantenimiento",
          align: "right",
          get: (r) => r.comisionMaximaAdministracionMantenimiento,
          sort: (r) => r.comisionMaximaAdministracionMantenimiento ?? Infinity,
          render: (r) => (
            <span className="tabular text-muted">
              {formatARS(r.comisionMaximaAdministracionMantenimiento ?? 0)}
            </span>
          ),
        },
        {
          key: "renov",
          label: "Renovación",
          align: "right",
          get: (r) => r.comisionMaximaRenovacion,
          sort: (r) => r.comisionMaximaRenovacion ?? Infinity,
          render: (r) => (
            <span className="tabular text-muted">
              {formatARS(r.comisionMaximaRenovacion ?? 0)}
            </span>
          ),
        },
        {
          key: "seg",
          label: "Segmento",
          get: (r) => r.segmento,
          sort: () => 0,
          render: (r) => (
            <span className="text-[11px] text-muted">{r.segmento}</span>
          ),
        },
      ];

    case "cajas":
      return [
        banco,
        {
          key: "ddd",
          label: "Apertura simplificada",
          get: (r) => r.procesoSimplificadoDebidaDiligencia,
          sort: () => 0,
          render: (r) => {
            const si = r.procesoSimplificadoDebidaDiligencia === "SI";
            return (
              <span className={si ? "text-ok" : "text-muted"}>
                {si ? "Sí" : "—"}
              </span>
            );
          },
        },
        fecha,
      ];

    case "paquetes":
      return [
        banco,
        {
          key: "paquete",
          label: "Paquete",
          get: (r) => r.nombreCorto,
          sort: () => 0,
          render: (r) => <span>{r.nombreCorto}</span>,
        },
        {
          key: "mant",
          label: "Mantenimiento",
          align: "right",
          get: (r) => r.comisionMaximaMantenimiento,
          sort: (r) => r.comisionMaximaMantenimiento ?? Infinity,
          render: (r) => (
            <span className="text-accent tabular font-bold">
              {formatARS(r.comisionMaximaMantenimiento ?? 0)}
            </span>
          ),
        },
        {
          key: "ingreso",
          label: "Ingreso mín",
          align: "right",
          get: (r) => r.ingresoMinimoMensual,
          sort: (r) => r.ingresoMinimoMensual ?? 0,
          render: (r) => (
            <span className="tabular text-muted">
              {formatARS(r.ingresoMinimoMensual ?? 0)}
            </span>
          ),
        },
        {
          key: "seg",
          label: "Segmento",
          get: (r) => r.segmento,
          sort: () => 0,
          render: (r) => (
            <span className="text-[11px] text-muted">{r.segmento}</span>
          ),
        },
      ];
  }
}

interface Props {
  tipo: Tipo;
  data: any[];
}

export default function TransparenciaTable({ tipo, data }: Props) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const cols = useMemo(() => getColumns(tipo), [tipo]);

  const filtered = useMemo(() => {
    let rows = data;
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.descripcionEntidad ?? "").toLowerCase().includes(q) ||
          (r.nombreCompleto ?? "").toLowerCase().includes(q) ||
          (r.nombreCorto ?? "").toLowerCase().includes(q),
      );
    }
    if (sortKey) {
      const col = cols.find((c) => c.key === sortKey);
      if (col) {
        rows = [...rows].sort((a, b) => {
          const va = col.sort(a);
          const vb = col.sort(b);
          return sortDir === "asc" ? va - vb : vb - va;
        });
      }
    }
    return rows;
  }, [data, query, sortKey, sortDir, cols]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <>
      <div className="mb-2">
        <label htmlFor="tabla-search" className="sr-only">
          Buscar banco o producto
        </label>
        <input
          id="tabla-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por banco o producto"
          className="input"
        />
      </div>
      <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted tabular">
        <span>
          Mostrando {filtered.length} de {data.length}
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
            ? `Ningún banco coincide con "${query}".`
            : "Sin productos para mostrar."}
        </div>
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {cols.map((c) => {
                  const isSorted = sortKey === c.key;
                  return (
                    <th
                      key={c.key}
                      className={`cursor-pointer hover:text-accent select-none ${
                        c.align === "right" ? "text-right" : "text-left"
                      }`}
                      aria-sort={
                        isSorted
                          ? sortDir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="uppercase tracking-widest"
                      >
                        {c.label}
                        {isSorted && (
                          <span aria-hidden="true" className="ml-1 text-accent">
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((row, i) => (
                <tr key={i}>
                  {cols.map((c) => (
                    <td
                      key={c.key}
                      className={c.align === "right" ? "text-right" : "text-left"}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <div className="p-3 text-center text-xs text-muted border-t border-border">
              Mostrando 500 de {filtered.length}. Usá el buscador para refinar.
            </div>
          )}
        </div>
      )}
    </>
  );
}
