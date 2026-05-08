"use client";

import { useMemo, useState } from "react";
import { formatARS, formatNumber, formatPct, shortBankName } from "@/lib/bcra";
import { TIPOS, type Tipo } from "@/lib/transparencia";

interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  get: (row: T) => string | number | null;
  sort: (row: T) => number;
  render: (row: T) => React.ReactNode;
}

// Definimos columnas por tipo. Mantenemos el set chico para que entre en mobile.
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
          label: "TEA mín",
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
          label: "Plazo mín",
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
          label: "TEA máx",
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
          label: "CFT",
          align: "right",
          get: (r) => r.costoFinancieroEfectivoTotalMaximo,
          sort: (r) => r.costoFinancieroEfectivoTotalMaximo ?? Infinity,
          render: (r) => (
            <span className="tabular text-red">
              {formatPct(r.costoFinancieroEfectivoTotalMaximo ?? 0)}
            </span>
          ),
        },
        {
          key: "max",
          label: "Máx",
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
          label: "Plazo",
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
          label: "Mant.",
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
          label: "Renov.",
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
              <span className={si ? "text-green" : "text-muted"}>
                {si ? "✓ Sí" : "—"}
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
      <div className="mb-4 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar banco o producto..."
          className="w-full bg-panel border border-border focus:border-accent/60 focus:outline-none px-4 py-3 text-sm placeholder:text-muted"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted tabular">
          {filtered.length} / {data.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted text-sm py-12 text-center border border-border">
          Sin resultados
        </div>
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-panel text-muted uppercase tracking-widest sticky top-0">
              <tr>
                {cols.map((c) => (
                  <th
                    key={c.key}
                    className={`p-2 font-normal cursor-pointer hover:text-accent select-none ${
                      c.align === "right" ? "text-right" : "text-left"
                    }`}
                    onClick={() => toggleSort(c.key)}
                  >
                    {c.label}
                    {sortKey === c.key && (
                      <span className="ml-1 text-accent">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-border hover:bg-panel/50 transition-colors"
                >
                  {cols.map((c) => (
                    <td
                      key={c.key}
                      className={`p-2 ${
                        c.align === "right" ? "text-right" : "text-left"
                      }`}
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

