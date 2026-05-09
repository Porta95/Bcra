"use client";

import { useState } from "react";
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
  const [cuit, setCuit] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    const clean = cuit.replace(/\D/g, "");
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

  return (
    <>
      <form
        onSubmit={consultar}
        className="flex gap-2 mb-8 max-w-xl"
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

      {result?.error && (
        <div
          role="alert"
          className="border border-danger/30 bg-danger/5 p-4 text-sm"
        >
          <div className="text-danger">{result.error}</div>
        </div>
      )}

      {loading && !result && (
        <div className="space-y-3" aria-hidden="true">
          <div className="skeleton h-24" />
          <div className="skeleton h-12" />
          <div className="skeleton h-12" />
        </div>
      )}

      {result?.ok && result.data && <Reporte data={result.data} />}
    </>
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
