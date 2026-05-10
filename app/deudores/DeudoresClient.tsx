"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import {
  formatARS,
  type DeudasResponse,
  type ChequesResponse,
} from "@/lib/bcra";
import {
  analyze,
  type AnalysisResult,
  type FlagInfo,
} from "@/lib/deudores-analysis";
import ScoreRadial from "@/components/ScoreRadial";
import DeudaTimeline from "@/components/DeudaTimeline";
import DeudaHeatmap from "@/components/DeudaHeatmap";
import BancoCard from "@/components/BancoCard";

interface ApiResponse {
  ok: boolean;
  error?: string;
  data?: {
    deudas: DeudasResponse | null;
    historicas: DeudasResponse | null;
    cheques: ChequesResponse | null;
  };
}

type TabKey = "resumen" | "bancos" | "historico" | "cheques";

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
          <div className="skeleton h-48" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="skeleton h-20" />
            <div className="skeleton h-20" />
            <div className="skeleton h-20" />
          </div>
          <div className="skeleton h-64" />
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
  const analysis = useMemo(() => analyze(data), [data]);
  const denom =
    data.deudas?.denominacion ||
    data.historicas?.denominacion ||
    data.cheques?.denominacion ||
    "Sin denominación informada";

  const [tab, setTab] = useState<TabKey>("resumen");
  const cantBancos = analysis.bancos.length;
  const cantCheques = analysis.cheques.total;
  const cantPeriodos = analysis.timeline.length;

  return (
    <article aria-label="Informe de deudor" className="fade-up space-y-6">
      <HeaderReporte denom={denom} analysis={analysis} />

      <KpiStrip analysis={analysis} />

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { key: "resumen", label: "Resumen" },
          { key: "bancos", label: `Bancos · ${cantBancos}` },
          {
            key: "historico",
            label: `Histórico · ${cantPeriodos}m`,
            disabled: cantPeriodos < 1,
          },
          { key: "cheques", label: `Cheques · ${cantCheques}`, disabled: cantCheques === 0 },
        ]}
      />

      {tab === "resumen" && <ResumenTab analysis={analysis} />}
      {tab === "bancos" && <BancosTab analysis={analysis} />}
      {tab === "historico" && <HistoricoTab analysis={analysis} />}
      {tab === "cheques" && <ChequesTab data={data.cheques} />}
    </article>
  );
}

function HeaderReporte({
  denom,
  analysis,
}: {
  denom: string;
  analysis: AnalysisResult;
}) {
  const { tier, score } = analysis;
  return (
    <div className="card-emphasis">
      <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
        <ScoreRadial score={score} tier={tier} />
        <div className="min-w-0">
          <div className="section-eyebrow">Titular</div>
          <div className="text-xl md:text-2xl font-display italic mt-1 break-words">
            {denom}
          </div>
          <p className="text-xs text-muted mt-3 leading-relaxed">
            {tier.label}.{" "}
            <span className="text-mutedSoft">
              Score derivado del peor estado actual, días de atraso, cheques
              rechazados y flags activos. No es un score crediticio comercial —
              es una lectura rápida de los datos del BCRA.
            </span>
          </p>
          {analysis.flags.length > 0 && (
            <FlagsRow flags={analysis.flags} />
          )}
        </div>
      </div>
    </div>
  );
}

function FlagsRow({ flags }: { flags: FlagInfo[] }) {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {flags.map((f) => (
        <span
          key={f.key}
          className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${
            f.tone === "danger"
              ? "border-danger/50 text-danger bg-danger/5"
              : "border-warn/50 text-warn bg-warn/5"
          }`}
        >
          {f.label}
        </span>
      ))}
    </div>
  );
}

function KpiStrip({ analysis }: { analysis: AnalysisResult }) {
  const { kpis, cheques } = analysis;
  const delta = kpis.deltaDeuda12m;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border border border-border">
      <Kpi label="Deuda actual" value={formatARS(kpis.deudaTotal)} accent />
      <Kpi
        label="Δ 12 meses"
        value={
          delta === null
            ? "—"
            : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`
        }
        tone={delta === null ? "neutral" : delta > 0 ? "warn" : "ok"}
      />
      <Kpi
        label="Peor situación"
        value={kpis.peorSituacion ? `Sit. ${kpis.peorSituacion}` : "—"}
        tone={
          kpis.peorSituacion <= 1
            ? "ok"
            : kpis.peorSituacion <= 3
            ? "warn"
            : "danger"
        }
      />
      <Kpi
        label="Meses en rojo"
        value={String(kpis.mesesEnRojo)}
        tone={kpis.mesesEnRojo === 0 ? "ok" : "danger"}
      />
      <Kpi
        label="Entidades activas"
        value={String(kpis.entidadesActivas)}
      />
      <Kpi
        label="Cheques rechazados"
        value={String(cheques.total)}
        tone={cheques.total === 0 ? "ok" : "danger"}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "neutral",
  accent,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn" | "danger";
  accent?: boolean;
}) {
  const colorClass = accent
    ? "text-accent"
    : tone === "ok"
    ? "text-ok"
    : tone === "warn"
    ? "text-warn"
    : tone === "danger"
    ? "text-danger"
    : "text-ink";

  return (
    <div className="bg-panel2 p-4 min-w-0">
      <div className="section-eyebrow truncate">{label}</div>
      <div
        className={`tabular text-base md:text-lg mt-1 truncate font-bold ${colorClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function Tabs({
  items,
  active,
  onChange,
}: {
  items: { key: TabKey; label: string; disabled?: boolean }[];
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  return (
    <div role="tablist" className="border-b border-border flex overflow-x-auto">
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <button
            key={it.key}
            role="tab"
            aria-selected={isActive}
            disabled={it.disabled}
            onClick={() => onChange(it.key)}
            className={`px-4 py-2.5 text-[11px] uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 disabled:opacity-30 disabled:cursor-not-allowed ${
              isActive
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function ResumenTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="section-eyebrow mb-3 flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block w-6 h-px bg-accent align-middle"
          />
          Lectura rápida
        </h2>
        {analysis.insights.length > 0 ? (
          <ul className="space-y-2">
            {analysis.insights.map((s, i) => (
              <li
                key={i}
                className="card flex items-start gap-3 fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="inline-block w-1.5 h-3.5 bg-accent shrink-0 mt-1"
                />
                <span className="text-sm text-ink leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">Sin observaciones para destacar.</div>
        )}
      </section>

      {analysis.timeline.length >= 2 && (
        <section>
          <h2 className="section-eyebrow mb-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-6 h-px bg-accent align-middle"
            />
            Evolución
          </h2>
          <DeudaTimeline data={analysis.timeline} />
        </section>
      )}

      {analysis.kpis.picoDeuda.periodo &&
        analysis.kpis.picoDeuda.monto > analysis.kpis.deudaTotal && (
          <div className="text-[11px] text-muted leading-relaxed border-l-2 border-borderStrong pl-3">
            <strong className="text-ink">Pico de deuda:</strong>{" "}
            {formatARS(analysis.kpis.picoDeuda.monto)} en{" "}
            {analysis.kpis.picoDeuda.periodo}.
          </div>
        )}
    </div>
  );
}

function BancosTab({ analysis }: { analysis: AnalysisResult }) {
  if (!analysis.bancos.length) {
    return (
      <div className="empty-state">
        Sin entidades reportando deuda en el sistema financiero.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted">
        Cada card es una entidad que reportó deuda en algún momento. Tocá para
        ver el detalle por período.
      </p>
      <div className="grid gap-3">
        {analysis.bancos.map((b) => (
          <BancoCard key={b.entidad} banco={b} />
        ))}
      </div>
    </div>
  );
}

function HistoricoTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-6">
      <DeudaTimeline data={analysis.timeline} />
      <DeudaHeatmap
        bancos={analysis.bancos}
        periodos={analysis.heatmapPeriodos}
      />
    </div>
  );
}

function ChequesTab({ data }: { data: ChequesResponse | null }) {
  if (!data || !data.causales?.length) {
    return (
      <div className="border border-ok/20 bg-ok/5 text-ok p-4 text-sm flex items-center gap-2">
        <Check size={16} aria-hidden="true" />
        Sin cheques rechazados. Todo en orden.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.causales.map((entidad) => (
        <section key={entidad.entidad}>
          <div className="section-eyebrow mb-2">Entidad {entidad.entidad}</div>
          {(entidad.detalle ?? []).map((c) => (
            <div key={c.causal} className="mb-4">
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
                    {(c.detalle ?? []).map((d) => (
                      <tr key={d.nroCheque}>
                        <td className="tabular">{d.nroCheque}</td>
                        <td className="tabular text-muted">{d.fechaRechazo}</td>
                        <td className="text-right tabular text-danger">
                          {formatARS(d.monto)}
                        </td>
                        <td
                          className={`tabular ${
                            d.fechaPago ? "text-ok" : "text-muted"
                          }`}
                        >
                          {d.fechaPago ?? "Sin pagar"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
