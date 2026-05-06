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

export default function DeudoresPage() {
  const [cuit, setCuit] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    const clean = cuit.replace(/\D/g, "");
    if (clean.length !== 11) {
      setResult({ ok: false, error: "El CUIT/CUIL/CDI debe tener 11 dígitos" });
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
        error: err instanceof Error ? err.message : "Error de red",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8 border-l-2 border-accent pl-4">
        <div className="text-[10px] uppercase tracking-widest text-muted">
          Central de Deudores · BCRA
        </div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">
          Consulta por <span className="italic text-accent">CUIT</span>
        </h1>
        <p className="text-xs text-muted mt-3 max-w-2xl leading-relaxed">
          Informe consolidado de financiaciones otorgadas por el sistema financiero
          y cheques rechazados. Datos del último período informado por las
          entidades. Sin necesidad de registrarse — fuente: api.bcra.gob.ar
        </p>
      </div>

      <form onSubmit={consultar} className="flex gap-2 mb-8 max-w-xl">
        <input
          type="text"
          inputMode="numeric"
          value={cuit}
          onChange={(e) => setCuit(e.target.value)}
          placeholder="20-12345678-3"
          className="flex-1 bg-panel border border-border focus:border-accent/60 focus:outline-none px-4 py-3 text-sm tabular placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-bg px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "Consultar"}
        </button>
      </form>

      {result?.error && (
        <div className="border border-red/30 bg-red/5 p-4 text-sm">
          <div className="text-red">{result.error}</div>
        </div>
      )}

      {result?.ok && result.data && (
        <Reporte data={result.data} />
      )}
    </div>
  );
}

function Reporte({
  data,
}: {
  data: NonNullable<ApiResponse["data"]>;
}) {
  const { deudas, historicas, cheques } = data;
  const denom =
    deudas?.denominacion ||
    historicas?.denominacion ||
    cheques?.denominacion ||
    "Sin denominación informada";

  const totalDeuda = deudas?.periodos
    ?.flatMap((p) => p.entidades)
    .reduce((acc, e) => acc + (e.monto ?? 0) * 1000, 0) ?? 0;

  const peorSituacion = deudas?.periodos
    ?.flatMap((p) => p.entidades)
    .reduce((max, e) => Math.max(max, e.situacion ?? 1), 1) ?? 1;

  const sitInfo = describirSituacion(peorSituacion);
  const sitColor =
    sitInfo.tone === "ok"
      ? "text-green"
      : sitInfo.tone === "warn"
      ? "text-accent"
      : "text-red";

  const tieneCheques = (cheques?.causales?.length ?? 0) > 0;

  return (
    <div className="fade-up space-y-8">
      {/* Header del reporte */}
      <div className="border border-border bg-panel p-5">
        <div className="text-[10px] uppercase tracking-widest text-muted">
          Titular
        </div>
        <div className="text-xl font-display mt-1">{denom}</div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border mt-5 border border-border">
          <div className="bg-bg p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted">
              Deuda total
            </div>
            <div className="tabular text-lg mt-1">
              {totalDeuda > 0 ? formatARS(totalDeuda) : "—"}
            </div>
          </div>
          <div className="bg-bg p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted">
              Peor situación
            </div>
            <div className={`text-sm mt-1 ${sitColor}`}>{sitInfo.label}</div>
          </div>
          <div className="bg-bg p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted">
              Cheques rechazados
            </div>
            <div className={`tabular text-lg mt-1 ${tieneCheques ? "text-red" : "text-green"}`}>
              {tieneCheques
                ? cheques?.causales
                    ?.flatMap((c) => c.detalle.flatMap((d) => d.detalle))
                    .length ?? 0
                : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Deudas actuales */}
      <Section title="Deudas actuales (último período informado)">
        {deudas?.periodos?.length ? (
          deudas.periodos.map((p) => (
            <PeriodoTable key={p.periodo} periodo={p} />
          ))
        ) : (
          <Empty msg="Sin deudas informadas en el sistema financiero" tone="ok" />
        )}
      </Section>

      {/* Históricas */}
      <Section title="Historial — últimos 24 meses">
        {historicas?.periodos?.length ? (
          <div className="border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-panel text-muted uppercase tracking-widest">
                <tr>
                  <th className="text-left p-2 font-normal">Período</th>
                  <th className="text-left p-2 font-normal">Entidad</th>
                  <th className="text-left p-2 font-normal">Sit.</th>
                  <th className="text-right p-2 font-normal">Monto</th>
                </tr>
              </thead>
              <tbody>
                {historicas.periodos.flatMap((p) =>
                  p.entidades.map((e, i) => (
                    <tr
                      key={`${p.periodo}-${e.entidad}-${i}`}
                      className="border-t border-border"
                    >
                      <td className="p-2 tabular text-muted">{p.periodo}</td>
                      <td className="p-2">{e.entidad}</td>
                      <td className="p-2 tabular">{e.situacion}</td>
                      <td className="p-2 text-right tabular">
                        {formatARS((e.monto ?? 0) * 1000)}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty msg="Sin historial informado" tone="ok" />
        )}
      </Section>

      {/* Cheques rechazados */}
      <Section title="Cheques rechazados">
        {tieneCheques ? (
          cheques!.causales.map((entidad) => (
            <div key={entidad.entidad} className="mb-4">
              <div className="text-[10px] uppercase tracking-widest text-muted mb-2">
                Entidad {entidad.entidad}
              </div>
              {entidad.detalle.map((c) => (
                <div key={c.causal} className="mb-3">
                  <div className="text-xs text-red mb-2">▮ {c.causal}</div>
                  <div className="border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-panel text-muted uppercase tracking-widest">
                        <tr>
                          <th className="text-left p-2 font-normal">Cheque</th>
                          <th className="text-left p-2 font-normal">Rechazo</th>
                          <th className="text-right p-2 font-normal">Monto</th>
                          <th className="text-left p-2 font-normal">Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.detalle.map((d) => (
                          <tr key={d.nroCheque} className="border-t border-border">
                            <td className="p-2 tabular">{d.nroCheque}</td>
                            <td className="p-2 tabular text-muted">
                              {d.fechaRechazo}
                            </td>
                            <td className="p-2 text-right tabular text-red">
                              {formatARS(d.monto)}
                            </td>
                            <td className="p-2 tabular text-muted">
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
          <Empty msg="Sin cheques rechazados informados" tone="ok" />
        )}
      </Section>
    </div>
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
    <div>
      <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted mb-3">
        ━ {title}
      </h2>
      {children}
    </div>
  );
}

function Empty({ msg, tone }: { msg: string; tone: "ok" | "bad" }) {
  return (
    <div
      className={`border p-4 text-sm ${
        tone === "ok"
          ? "border-green/20 bg-green/5 text-green"
          : "border-red/20 bg-red/5 text-red"
      }`}
    >
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
      <div className="text-[10px] uppercase tracking-widest text-muted mb-2">
        Período {periodo.periodo}
      </div>
      <div className="border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-panel text-muted uppercase tracking-widest">
            <tr>
              <th className="text-left p-2 font-normal">Entidad</th>
              <th className="text-left p-2 font-normal">Situación</th>
              <th className="text-right p-2 font-normal">Atraso</th>
              <th className="text-right p-2 font-normal">Monto</th>
            </tr>
          </thead>
          <tbody>
            {periodo.entidades.map((e, i) => {
              const sit = describirSituacion(e.situacion);
              const color =
                sit.tone === "ok"
                  ? "text-green"
                  : sit.tone === "warn"
                  ? "text-accent"
                  : "text-red";
              return (
                <tr key={i} className="border-t border-border">
                  <td className="p-2">{e.entidad}</td>
                  <td className={`p-2 ${color}`}>
                    {e.situacion} · {sit.label}
                  </td>
                  <td className="p-2 text-right tabular text-muted">
                    {e.diasAtrasoPago ? `${e.diasAtrasoPago}d` : "—"}
                  </td>
                  <td className="p-2 text-right tabular">
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
