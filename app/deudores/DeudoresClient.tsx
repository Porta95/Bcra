"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  describirSituacion,
  formatARS,
  type DeudasResponse,
  type ChequesResponse,
} from "@/lib/bcra";

interface ApiResponse {
  ok: boolean;
  error?: string;
  data?: {
    deudas: DeudasResponse | null;
    historicas: DeudasResponse | null;
    cheques: ChequesResponse | null;
  };
}

export default function DeudoresClient() {
  const searchParams = useSearchParams();
  const [cuit, setCuit] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const qp = searchParams.get("cuit");
    if (qp) {
      const clean = qp.replace(/\D/g, "");
      if (clean.length === 11) {
        setCuit(clean);
        buscar(clean);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function buscar(rawCuit: string) {
    const clean = rawCuit.replace(/\D/g, "");
    if (clean.length !== 11) {
      setResult({
        ok: false,
        error:
          "El CUIT, CUIL o CDI tiene que tener 11 dígitos. Revisá los números.",
      });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/deudores/${clean}`);
      const json: ApiResponse = await res.json();
      setResult(json);
      if (json.ok) {
        setHistory((h) => [clean, ...h.filter((x) => x !== clean)].slice(0, 5));
      }
    } catch (err) {
      setResult({
        ok: false,
        error:
          err instanceof Error
            ? `No pudimos llegar al BCRA. Probá de nuevo en un minuto. (${err.message})`
            : "No pudimos llegar al BCRA. Probá de nuevo en un minuto.",
      });
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    buscar(cuit);
  }

  function ejemplo(c: string) {
    setCuit(c);
    buscar(c);
  }

  const showResults = result || loading;

  return (
    <>
      <div
        className={
          showResults
            ? "sticky top-[57px] z-10 -mx-4 px-4 py-3 bg-bg/90 backdrop-blur border-b border-border mb-6"
            : "mb-8"
        }
      >
        <form
          onSubmit={onSubmit}
          className="flex gap-2 max-w-xl"
          aria-describedby="cuit-help"
        >
          <label htmlFor="cuit-input" className="sr-only">
            CUIT, CUIL o CDI (11 dígitos)
          </label>
          <input
            id="cuit-input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={cuit}
            onChange={(e) => setCuit(e.target.value)}
            placeholder="20-12345678-3"
            className="input flex-1 tabular"
          />
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="btn-primary"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="spinner" aria-hidden="true" />
                Buscando…
              </span>
            ) : (
              "Consultá tu CUIT"
            )}
          </button>
        </form>
        <p id="cuit-help" className="sr-only">
          Ingresá un CUIT, CUIL o CDI argentino de 11 dígitos. La consulta es
          gratuita y anónima.
        </p>
      </div>

      {!showResults && (
        <div className="mb-8 fade-up">
          <div className="section-eyebrow mb-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-6 h-px bg-accent align-middle"
            />
            Probá con un ejemplo
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            <ExemploBtn
              titulo="Mercado Libre"
              cuit="30-70308853-4"
              hint="Empresa grande"
              onClick={ejemplo}
            />
            <ExemploBtn
              titulo="Banco Galicia"
              cuit="30-50000173-5"
              hint="Banco"
              onClick={ejemplo}
            />
            <ExemploBtn
              titulo="YPF"
              cuit="30-54668997-9"
              hint="Petrolera"
              onClick={ejemplo}
            />
          </div>
          <p className="text-[11px] text-muted mt-3 leading-relaxed">
            La Central de Deudores del BCRA es información pública por Ley de
            Entidades Financieras. Podés consultar cualquier CUIT, CUIL o CDI.
          </p>
        </div>
      )}

      {history.length > 1 && showResults && (
        <div className="mb-6 flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-widest">
          <span className="text-muted">Recientes</span>
          {history.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => ejemplo(c)}
              className={`px-2 py-1 border tabular ${
                c === cuit.replace(/\D/g, "")
                  ? "border-accent text-accent"
                  : "border-border text-muted hover:text-ink hover:border-borderStrong"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {result?.error && (
        <div
          role="alert"
          className="border border-danger/30 bg-danger/5 p-4 text-sm fade-up"
        >
          <div className="text-danger">{result.error}</div>
        </div>
      )}

      {loading && !result && (
        <div className="space-y-3" aria-hidden="true">
          <div className="skeleton h-32" />
          <div className="skeleton h-12" />
          <div className="skeleton h-12" />
          <div className="skeleton h-12" />
        </div>
      )}

      {result?.ok && result.data && <Reporte data={result.data} />}
    </>
  );
}

function ExemploBtn({
  titulo,
  cuit,
  hint,
  onClick,
}: {
  titulo: string;
  cuit: string;
  hint: string;
  onClick: (cuit: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(cuit)}
      className="card text-left hover:border-accent/60 hover:bg-panel2 transition-all group"
    >
      <div className="section-eyebrow group-hover:text-accent transition-colors">
        {hint}
      </div>
      <div className="font-display italic text-base mt-1 text-ink">
        {titulo}
      </div>
      <div className="tabular text-[10px] text-muted mt-2">{cuit}</div>
    </button>
  );
}

function Reporte({ data }: { data: NonNullable<ApiResponse["data"]> }) {
  const { deudas, historicas, cheques } = data;
  const denom =
    deudas?.denominacion ||
    historicas?.denominacion ||
    cheques?.denominacion ||
    "Sin denominación informada";

  const totalDeuda =
    deudas?.periodos
      ?.flatMap((p) => p.entidades)
      .reduce((acc, e) => acc + (e.monto ?? 0) * 1000, 0) ?? 0;

  const peorSituacion =
    deudas?.periodos
      ?.flatMap((p) => p.entidades)
      .reduce((max, e) => Math.max(max, e.situacion ?? 1), 1) ?? 1;

  const sitInfo = describirSituacion(peorSituacion);
  const sitColor =
    sitInfo.tone === "ok"
      ? "text-ok"
      : sitInfo.tone === "warn"
      ? "text-warn"
      : "text-danger";

  const tieneCheques = (cheques?.causales?.length ?? 0) > 0;
  const cantidadCheques = tieneCheques
    ? cheques?.causales
        ?.flatMap((c) => c.detalle.flatMap((d) => d.detalle))
        .length ?? 0
    : 0;

  return (
    <article aria-label="Informe de deudor" className="fade-up space-y-8">
      <div className="card-emphasis">
        <div className="section-eyebrow">Titular</div>
        <div className="text-xl font-display italic mt-1">{denom}</div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border mt-5 border border-border">
          <div className="bg-panel2 p-4 min-w-0">
            <div className="section-eyebrow">Deuda total</div>
            <div className="tabular text-lg mt-1 truncate">
              {totalDeuda > 0 ? formatARS(totalDeuda) : "—"}
            </div>
          </div>
          <div className="bg-panel2 p-4 min-w-0">
            <div className="section-eyebrow">Peor situación</div>
            <div className={`text-sm mt-1 ${sitColor}`}>{sitInfo.label}</div>
          </div>
          <div className="bg-panel2 p-4 min-w-0">
            <div className="section-eyebrow">Cheques rechazados</div>
            <div
              className={`tabular text-lg mt-1 ${
                tieneCheques ? "text-danger" : "text-ok"
              }`}
            >
              {cantidadCheques}
            </div>
          </div>
        </div>
      </div>

      <Section title="Deudas actuales (último período informado)">
        {deudas?.periodos?.length ? (
          deudas.periodos.map((p) => (
            <PeriodoTable key={p.periodo} periodo={p} />
          ))
        ) : (
          <Empty msg="No hay deudas informadas. Limpio en el último período." />
        )}
      </Section>

      <Section title="Historial — últimos 24 meses">
        {historicas?.periodos?.length ? (
          <div className="border border-border overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Entidad</th>
                  <th>Situación</th>
                  <th className="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {historicas.periodos.flatMap((p) =>
                  p.entidades.map((e, i) => (
                    <tr key={`${p.periodo}-${e.entidad}-${i}`}>
                      <td className="tabular text-muted">{p.periodo}</td>
                      <td>{e.entidad}</td>
                      <td className="tabular">{e.situacion}</td>
                      <td className="text-right tabular">
                        {formatARS((e.monto ?? 0) * 1000)}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty msg="Sin movimientos en los últimos 24 meses." />
        )}
      </Section>

      <Section title="Cheques rechazados">
        {tieneCheques ? (
          cheques!.causales.map((entidad) => (
            <div key={entidad.entidad} className="mb-4">
              <div className="section-eyebrow mb-2">
                Entidad {entidad.entidad}
              </div>
              {entidad.detalle.map((c) => (
                <div key={c.causal} className="mb-3">
                  <div className="text-xs text-danger mb-2 flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block w-1.5 h-3.5 bg-danger"
                    />
                    {c.causal}
                  </div>
                  <div className="border border-border overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>N° de cheque</th>
                          <th>Fecha rechazo</th>
                          <th className="text-right">Monto</th>
                          <th>Fecha pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.detalle.map((d) => (
                          <tr key={d.nroCheque}>
                            <td className="tabular">{d.nroCheque}</td>
                            <td className="tabular text-muted">
                              {d.fechaRechazo}
                            </td>
                            <td className="text-right tabular text-danger">
                              {formatARS(d.monto)}
                            </td>
                            <td className="tabular text-muted">
                              {d.fechaPago ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <Empty msg="Sin cheques rechazados. Todo en orden." />
        )}
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="section-eyebrow mb-3 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block w-6 h-px bg-accent align-middle"
        />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="border border-ok/20 bg-ok/5 text-ok p-4 text-sm">
      ✓ {msg}
    </div>
  );
}

function PeriodoTable({
  periodo,
}: {
  periodo: NonNullable<DeudasResponse["periodos"]>[number];
}) {
  return (
    <div className="mb-4">
      <div className="section-eyebrow mb-2">Período {periodo.periodo}</div>
      <div className="border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Entidad</th>
              <th>Situación</th>
              <th className="text-right">Atraso</th>
              <th className="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {periodo.entidades.map((e, i) => {
              const sit = describirSituacion(e.situacion);
              const color =
                sit.tone === "ok"
                  ? "text-ok"
                  : sit.tone === "warn"
                  ? "text-warn"
                  : "text-danger";
              return (
                <tr key={i}>
                  <td>{e.entidad}</td>
                  <td className={color}>
                    {e.situacion} · {sit.label}
                  </td>
                  <td className="text-right tabular text-muted">
                    {e.diasAtrasoPago ? `${e.diasAtrasoPago}d` : "—"}
                  </td>
                  <td className="text-right tabular">
                    {formatARS((e.monto ?? 0) * 1000)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
