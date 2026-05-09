"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EntidadCheques, ChequeDenunciado } from "@/lib/bcra";

export default function ChequesClient() {
  const [entidades, setEntidades] = useState<EntidadCheques[]>([]);
  const [loadingEntidades, setLoadingEntidades] = useState(true);
  const [errEntidades, setErrEntidades] = useState<string | null>(null);

  const [bancoQuery, setBancoQuery] = useState("");
  const [bancoSel, setBancoSel] = useState<EntidadCheques | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [numeroCheque, setNumeroCheque] = useState("");

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
        if (j.ok) setEntidades(j.data);
        else
          setErrEntidades(
            "No pudimos traer la lista de bancos. Recargá la página.",
          );
      })
      .catch(() =>
        setErrEntidades(
          "No pudimos traer la lista de bancos. Recargá la página.",
        ),
      )
      .finally(() => setLoadingEntidades(false));
  }, []);

  const filtered = useMemo(() => {
    if (!bancoQuery.trim()) return entidades.slice(0, 12);
    const q = bancoQuery.toLowerCase();
    return entidades
      .filter(
        (e) =>
          e.denominacion.toLowerCase().includes(q) ||
          String(e.codigoEntidad).includes(q),
      )
      .slice(0, 12);
  }, [entidades, bancoQuery]);

  function selectBanco(e: EntidadCheques) {
    setBancoSel(e);
    setBancoQuery(e.denominacion);
    setOpen(false);
  }

  function onKeyDown(ev: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (ev.key === "ArrowDown" || ev.key === "Enter") {
        setOpen(true);
        ev.preventDefault();
      }
      return;
    }
    if (ev.key === "ArrowDown") {
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
      ev.preventDefault();
    } else if (ev.key === "ArrowUp") {
      setHighlight((h) => Math.max(0, h - 1));
      ev.preventDefault();
    } else if (ev.key === "Enter") {
      if (filtered[highlight]) {
        selectBanco(filtered[highlight]);
        ev.preventDefault();
      }
    } else if (ev.key === "Escape") {
      setOpen(false);
    }
  }

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    if (!bancoSel || !numeroCheque) {
      setResultado({
        ok: false,
        error: "Elegí un banco y poné el número del cheque.",
      });
      return;
    }
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch(
        `/api/cheques/${bancoSel.codigoEntidad}/${numeroCheque}`,
      );
      const json = await res.json();
      if (json.ok) {
        setResultado({
          ok: true,
          data: json.data,
          entidad: bancoSel.denominacion,
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

  const previewListo = !!bancoSel && numeroCheque.length > 0;

  return (
    <>
      <form onSubmit={consultar} className="space-y-4 mb-6 max-w-2xl">
        <div className="relative">
          <label htmlFor="banco-input" className="section-eyebrow block mb-1">
            Banco emisor
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
                ref={inputRef}
                id="banco-input"
                type="text"
                value={bancoQuery}
                onChange={(e) => {
                  setBancoQuery(e.target.value);
                  setOpen(true);
                  setHighlight(0);
                  if (bancoSel && e.target.value !== bancoSel.denominacion) {
                    setBancoSel(null);
                  }
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 100)}
                onKeyDown={onKeyDown}
                placeholder="Buscá por nombre o código (ej. Galicia, ICBC, 7…)"
                role="combobox"
                aria-expanded={open}
                aria-controls="banco-listbox"
                aria-autocomplete="list"
                className="input"
              />
              {open && filtered.length > 0 && (
                <ul
                  ref={listRef}
                  id="banco-listbox"
                  role="listbox"
                  className="absolute left-0 right-0 mt-1 bg-panel2 border border-borderStrong max-h-64 overflow-y-auto z-30 shadow-2xl"
                >
                  {filtered.map((e, i) => (
                    <li
                      key={e.codigoEntidad}
                      role="option"
                      aria-selected={i === highlight}
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        selectBanco(e);
                      }}
                      onMouseEnter={() => setHighlight(i)}
                      className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-3 ${
                        i === highlight ? "bg-accent text-bg" : "text-ink hover:bg-panel"
                      }`}
                    >
                      <span
                        className={`tabular text-[10px] ${
                          i === highlight ? "text-bg/70" : "text-muted"
                        }`}
                      >
                        [{String(e.codigoEntidad).padStart(3, "0")}]
                      </span>
                      <span className="truncate">{e.denominacion}</span>
                    </li>
                  ))}
                </ul>
              )}
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

        {previewListo && (
          <ChequePreview entidad={bancoSel!.denominacion} numero={numeroCheque} />
        )}

        <button
          type="submit"
          disabled={loading || !bancoSel || !numeroCheque}
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

function ChequePreview({
  entidad,
  numero,
}: {
  entidad: string;
  numero: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="border border-dashed border-borderStrong bg-panel/40 p-4 fade-up"
    >
      <div className="section-eyebrow mb-2">Vas a verificar</div>
      <div className="border border-border bg-bg p-4 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted">
              Banco
            </div>
            <div className="text-sm text-ink truncate">{entidad}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted">
              N° cheque
            </div>
            <div className="text-sm tabular text-ink">{numero}</div>
          </div>
        </div>
        <div className="mt-6 border-t border-dashed border-border pt-3 flex items-end justify-between text-[10px] text-muted">
          <span>Pague a la orden de</span>
          <span className="tabular">$ ____________</span>
        </div>
        <div className="absolute top-2 right-2 text-[9px] text-muted/60 tabular">
          PREVIEW
        </div>
      </div>
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
