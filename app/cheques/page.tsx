"use client";

import { useEffect, useMemo, useState } from "react";
import type { EntidadCheques, ChequeDenunciado } from "@/lib/bcra";

export default function ChequesPage() {
  const [entidades, setEntidades] = useState<EntidadCheques[]>([]);
  const [loadingEntidades, setLoadingEntidades] = useState(true);
  const [errEntidades, setErrEntidades] = useState<string | null>(null);

  const [codigoEntidad, setCodigoEntidad] = useState<string>("");
  const [numeroCheque, setNumeroCheque] = useState("");
  const [filtroBanco, setFiltroBanco] = useState("");

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<
    | { ok: true; data: ChequeDenunciado; entidad: string }
    | { ok: false; error: string }
    | null
  >(null);

  // Carga el listado de entidades una sola vez
  useEffect(() => {
    fetch("/api/cheques")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setEntidades(j.data);
        } else {
          setErrEntidades(j.error ?? "Error cargando entidades");
        }
      })
      .catch((e) => setErrEntidades(String(e)))
      .finally(() => setLoadingEntidades(false));
  }, []);

  const entidadesFiltradas = useMemo(() => {
    if (!filtroBanco.trim()) return entidades;
    const q = filtroBanco.toLowerCase();
    return entidades.filter((e) =>
      e.denominacion.toLowerCase().includes(q),
    );
  }, [entidades, filtroBanco]);

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    if (!codigoEntidad || !numeroCheque) {
      setResultado({ ok: false, error: "Seleccioná entidad y número" });
      return;
    }
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch(`/api/cheques/${codigoEntidad}/${numeroCheque}`);
      const json = await res.json();
      if (json.ok) {
        const ent = entidades.find(
          (e) => e.codigoEntidad === Number(codigoEntidad),
        );
        setResultado({
          ok: true,
          data: json.data,
          entidad: ent?.denominacion ?? "—",
        });
      } else {
        setResultado({ ok: false, error: json.error ?? "Error" });
      }
    } catch (err) {
      setResultado({ ok: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8 border-l-2 border-accent pl-4">
        <div className="text-[10px] uppercase tracking-widest text-muted">
          Cheques Denunciados · BCRA
        </div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">
          Verificación <span className="italic text-accent">de cheques</span>
        </h1>
        <p className="text-xs text-muted mt-3 max-w-2xl leading-relaxed">
          Consultá si un cheque fue denunciado como{" "}
          <span className="text-ink">extraviado, sustraído o adulterado</span>.
          Útil antes de aceptar un cheque de un tercero. Si lo que querés es
          buscar cheques rechazados <em>por sin fondos</em> de un CUIT específico,
          usá la solapa{" "}
          <a href="/deudores" className="text-accent hover:underline">
            Deudores
          </a>
          .
        </p>
      </div>

      <form onSubmit={consultar} className="space-y-3 mb-6 max-w-2xl">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted block mb-1">
            Entidad bancaria
          </label>
          {loadingEntidades ? (
            <div className="bg-panel border border-border px-4 py-3 text-sm text-muted">
              Cargando entidades...
            </div>
          ) : errEntidades ? (
            <div className="bg-red/5 border border-red/30 px-4 py-3 text-sm text-red">
              {errEntidades}
            </div>
          ) : (
            <>
              <input
                type="text"
                value={filtroBanco}
                onChange={(e) => setFiltroBanco(e.target.value)}
                placeholder="Filtrar lista..."
                className="w-full bg-panel border border-border focus:border-accent/60 focus:outline-none px-3 py-2 text-xs mb-1"
              />
              <select
                value={codigoEntidad}
                onChange={(e) => setCodigoEntidad(e.target.value)}
                className="w-full bg-panel border border-border focus:border-accent/60 focus:outline-none px-3 py-3 text-sm"
              >
                <option value="">— Seleccionar entidad —</option>
                {entidadesFiltradas.map((e) => (
                  <option key={e.codigoEntidad} value={e.codigoEntidad}>
                    [{e.codigoEntidad}] {e.denominacion}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted block mb-1">
            Número de cheque
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={numeroCheque}
            onChange={(e) => setNumeroCheque(e.target.value.replace(/\D/g, ""))}
            placeholder="Ej. 20377516"
            className="w-full bg-panel border border-border focus:border-accent/60 focus:outline-none px-4 py-3 text-sm tabular placeholder:text-muted"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !codigoEntidad || !numeroCheque}
          className="bg-accent text-bg px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Consultando..." : "Consultar"}
        </button>
      </form>

      {resultado?.ok === false && (
        <div className="border border-red/30 bg-red/5 p-4 text-sm fade-up">
          <div className="text-red">{resultado.error}</div>
        </div>
      )}

      {resultado?.ok && <ResultadoCheque data={resultado.data} entidad={resultado.entidad} />}
    </div>
  );
}

function ResultadoCheque({
  data,
  entidad,
}: {
  data: ChequeDenunciado;
  entidad: string;
}) {
  const denunciado = data.denunciado === true;

  return (
    <div className="fade-up">
      <div
        className={`border-2 p-5 ${
          denunciado
            ? "border-red bg-red/5"
            : "border-green/40 bg-green/5"
        }`}
      >
        <div className="text-[10px] uppercase tracking-widest text-muted">
          Resultado
        </div>
        <div
          className={`font-display text-2xl mt-1 ${
            denunciado ? "text-red" : "text-green"
          }`}
        >
          {denunciado ? "⚠ Denunciado" : "✓ No denunciado"}
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          {denunciado
            ? "Este cheque figura en la base de cheques denunciados como extraviado, sustraído o adulterado. Tener precaución."
            : "El cheque no figura denunciado en la base del BCRA. Esto no garantiza que no tenga problemas de fondos — para eso usá la consulta por CUIT en la solapa Deudores."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border mt-5 border border-border">
        <div className="bg-panel p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted">
            Entidad
          </div>
          <div className="text-sm mt-1 leading-tight">{entidad}</div>
        </div>
        <div className="bg-panel p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted">
            N° de cheque
          </div>
          <div className="tabular text-sm mt-1">{data.numeroCheque}</div>
        </div>
        {data.fechaProcesamiento && (
          <div className="bg-panel p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted">
              Fecha proceso
            </div>
            <div className="tabular text-sm mt-1">{data.fechaProcesamiento}</div>
          </div>
        )}
        {data.detalle && (
          <div className="bg-panel p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted">
              Detalle
            </div>
            <div className="text-sm mt-1">{data.detalle}</div>
          </div>
        )}
      </div>
    </div>
  );
}
