"use client";

import { useEffect, useMemo, useState } from "react";
import type { EntidadCheques, ChequeDenunciado } from "@/lib/bcra";

export default function ChequesClient() {
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

  useEffect(() => {
    fetch("/api/cheques")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setEntidades(j.data);
        } else {
          setErrEntidades(
            "No pudimos traer la lista de bancos. Recargá la página.",
          );
        }
      })
      .catch(() =>
        setErrEntidades(
          "No pudimos traer la lista de bancos. Recargá la página.",
        ),
      )
      .finally(() => setLoadingEntidades(false));
  }, []);

  const entidadesFiltradas = useMemo(() => {
    if (!filtroBanco.trim()) return entidades;
    const q = filtroBanco.toLowerCase();
    return entidades.filter((e) => e.denominacion.toLowerCase().includes(q));
  }, [entidades, filtroBanco]);

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    if (!codigoEntidad || !numeroCheque) {
      setResultado({
        ok: false,
        error: "Elegí un banco y poné el número del cheque.",
      });
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
        setResultado({
          ok: false,
          error: json.error ?? "El BCRA no devolvió respuesta.",
        });
      }
    } catch (err) {
      setResultado({
        ok: false,
        error: `No pudimos llegar al BCRA. Probá de nuevo en un minuto. (${String(
          err,
        )})`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={consultar} className="space-y-3 mb-6 max-w-2xl">
        <div>
          <label
            htmlFor="entidad-select"
            className="section-eyebrow block mb-1"
          >
            Entidad bancaria
          </label>
          {loadingEntidades ? (
            <div className="bg-panel border border-border px-4 py-3 text-sm text-muted flex items-center gap-2">
              <span className="spinner text-muted" aria-hidden="true" />
              Cargando bancos…
            </div>
          ) : errEntidades ? (
            <div role="alert" className="bg-danger/5 border border-danger/30 px-4 py-3 text-sm text-danger">
              {errEntidades}
            </div>
          ) : (
            <>
              <input
                type="text"
                value={filtroBanco}
                onChange={(e) => setFiltroBanco(e.target.value)}
                placeholder="Buscar banco"
                aria-label="Filtrar entidades"
                className="input-sm border-b-0 mb-0"
              />
              <select
                id="entidad-select"
                value={codigoEntidad}
                onChange={(e) => setCodigoEntidad(e.target.value)}
                className="input"
              >
                <option value="">Elegí un banco</option>
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
          <label htmlFor="numero-input" className="section-eyebrow block mb-1">
            Número de cheque
          </label>
          <input
            id="numero-input"
            type="text"
            inputMode="numeric"
            value={numeroCheque}
            onChange={(e) => setNumeroCheque(e.target.value.replace(/\D/g, ""))}
            placeholder="Ej. 20377516"
            className="input tabular"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !codigoEntidad || !numeroCheque}
          aria-busy={loading}
          className="btn-primary"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="spinner" aria-hidden="true" />
              Verificando…
            </span>
          ) : (
            "Verificar cheque"
          )}
        </button>
      </form>

      {resultado?.ok === false && (
        <div
          role="alert"
          className="border border-danger/30 bg-danger/5 p-4 text-sm fade-up"
        >
          <div className="text-danger">{resultado.error}</div>
        </div>
      )}

      {resultado?.ok && (
        <ResultadoCheque data={resultado.data} entidad={resultado.entidad} />
      )}
    </>
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
    <section aria-live="polite" className="fade-up">
      <div
        className={
          denunciado
            ? "border-2 border-danger bg-danger/5 p-5 flex gap-4 items-start"
            : "border border-ok/40 bg-ok/5 p-5"
        }
      >
        {denunciado && (
          <span
            aria-hidden="true"
            className="shrink-0 w-8 h-8 rounded-full border-2 border-danger text-danger flex items-center justify-center text-lg font-bold"
          >
            !
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="section-eyebrow">Resultado</div>
          <div
            className={`font-display italic text-2xl mt-1 ${
              denunciado ? "text-danger" : "text-ok"
            }`}
          >
            {denunciado ? "Denunciado — no lo aceptes" : "No figura denunciado"}
          </div>
          <p className="text-xs text-muted mt-3 leading-relaxed">
            {denunciado
              ? "Este cheque está marcado como extraviado, sustraído o adulterado. No lo aceptes y avisale al librador."
              : "No figura denunciado en la base del BCRA. Ojo: esto no dice nada sobre los fondos. Si te preocupa el cobro, consultá el CUIT del firmante en Deudores."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border mt-5 border border-border">
        <div className="bg-panel p-4">
          <div className="section-eyebrow">Entidad</div>
          <div className="text-sm mt-1 leading-tight">{entidad}</div>
        </div>
        <div className="bg-panel p-4">
          <div className="section-eyebrow">N° de cheque</div>
          <div className="tabular text-sm mt-1">{data.numeroCheque}</div>
        </div>
        {data.fechaProcesamiento && (
          <div className="bg-panel p-4">
            <div className="section-eyebrow">Fecha proceso</div>
            <div className="tabular text-sm mt-1">
              {data.fechaProcesamiento}
            </div>
          </div>
        )}
        {data.detalle && (
          <div className="bg-panel p-4">
            <div className="section-eyebrow">Detalle</div>
            <div className="text-sm mt-1">{data.detalle}</div>
          </div>
        )}
      </div>
    </section>
  );
}
