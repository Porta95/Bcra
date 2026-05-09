import type { Metadata } from "next";
import Link from "next/link";
import {
  getPlazosFijos,
  getVariables,
  getSerie,
  formatNumber,
  formatPct,
  shortBankName,
} from "@/lib/bcra";
import Sparkline from "@/components/Sparkline";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "TEA vs inflación — ¿el plazo fijo le gana?",
  description:
    "Comparamos la mejor TEA del sistema bancario contra la inflación mensual del BCRA. La respuesta directa: sí o no.",
  alternates: { canonical: "/contexto" },
};

function findInflationVariable(vars: { descripcion: string; idVariable: number; categoria: string }[]) {
  const candidates = vars.filter((v) =>
    /inflación|\bipc\b|precios al consumidor/i.test(v.descripcion),
  );
  // Preferimos la variación mensual del IPC; descartamos interanual y expectativas
  const mensual = candidates.find(
    (v) =>
      /mensual/i.test(v.descripcion) &&
      /precios al consumidor|ipc|inflación/i.test(v.descripcion) &&
      !/interanual|expectativ|relevamiento/i.test(v.descripcion),
  );
  if (mensual) return mensual;
  const general = candidates.find(
    (v) =>
      !/interanual|expectativ|relevamiento/i.test(v.descripcion),
  );
  if (general) return general;
  return candidates[0] ?? null;
}

export default async function ContextoPage() {
  let error: string | null = null;
  let mejorTea: number | null = null;
  let mejorBanco: string | null = null;
  let teaMensualPct: number | null = null;
  let inflacionMensualPct: number | null = null;
  let inflacionSerie: number[] = [];
  let inflacionVarId: number | null = null;
  let inflacionDesc: string | null = null;
  let inflacionFecha: string | null = null;
  let topPlazosFijos: { banco: string; tea: number }[] = [];

  try {
    const [pf, vars] = await Promise.all([
      getPlazosFijos().catch(() => []),
      getVariables().catch(() => []),
    ]);

    const sortedPf = [...pf].sort(
      (a, b) =>
        (b.tasaEfectivaAnualMinima ?? 0) - (a.tasaEfectivaAnualMinima ?? 0),
    );
    const top5 = sortedPf.slice(0, 5);
    if (top5[0]) {
      mejorTea = top5[0].tasaEfectivaAnualMinima ?? null;
      mejorBanco = shortBankName(top5[0].descripcionEntidad);
    }
    topPlazosFijos = top5.map((r) => ({
      banco: shortBankName(r.descripcionEntidad),
      tea: r.tasaEfectivaAnualMinima ?? 0,
    }));

    const inflVar = findInflationVariable(vars);
    if (inflVar) {
      inflacionVarId = inflVar.idVariable;
      inflacionDesc = inflVar.descripcion;
      const serie = await getSerie(inflVar.idVariable).catch(() => []);
      const last12 = serie.slice(-12);
      inflacionSerie = last12.map((p) => p.valor);
      const lastPoint = serie[serie.length - 1];
      inflacionMensualPct = lastPoint?.valor ?? null;
      inflacionFecha = lastPoint?.fecha ?? null;
    }

    if (mejorTea !== null) {
      teaMensualPct = mejorTea / 12;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  const lecaInflacion =
    teaMensualPct !== null && inflacionMensualPct !== null
      ? teaMensualPct - inflacionMensualPct
      : null;

  const gana = lecaInflacion !== null && lecaInflacion > 0;

  return (
    <section aria-labelledby="contexto-title">
      <div className="mb-8 hero-rule">
        <div className="section-eyebrow" aria-hidden="true">
          Contexto · Comparativa
        </div>
        <h1
          id="contexto-title"
          className="font-display text-3xl md:text-4xl tracking-tight mt-1"
        >
          ¿El plazo fijo le gana a la{" "}
          <span className="italic text-accent">inflación</span>?
        </h1>
        <p className="text-xs text-muted mt-3 max-w-2xl leading-relaxed">
          Comparamos la mejor TEA mínima de los plazos fijos publicados por los
          bancos contra la última inflación mensual informada por el BCRA.
          Aproximación rápida: TEA / 12 vs inflación del último mes. No es
          asesoría — es información pública leída en voz alta.
        </p>
      </div>

      {error || lecaInflacion === null ? (
        <div className="border border-danger/30 bg-danger/5 p-4 text-sm">
          <div className="text-danger mb-1">
            No pudimos armar la comparación
          </div>
          <div className="text-muted text-xs">
            {error ?? "Faltan datos de plazos fijos o inflación."}
          </div>
        </div>
      ) : (
        <>
          <div
            className={`p-8 md:p-12 mb-8 ${
              gana
                ? "border-2 border-ok/40 bg-ok/5"
                : "border-2 border-danger bg-danger/5"
            }`}
          >
            <div className="section-eyebrow">Respuesta corta</div>
            <div
              className={`font-display italic text-4xl md:text-6xl mt-2 ${
                gana ? "text-ok" : "text-danger"
              }`}
            >
              {gana ? "Sí, le gana." : "No, te come la inflación."}
            </div>
            <p className="text-sm text-muted mt-4 max-w-3xl leading-relaxed">
              {gana
                ? `La mejor tasa mensual disponible (${formatPct(
                    teaMensualPct!,
                  )}) supera la inflación del último mes (${formatPct(
                    inflacionMensualPct!,
                  )}) por ${formatPct(lecaInflacion)} puntos.`
                : `La inflación del último mes (${formatPct(
                    inflacionMensualPct!,
                  )}) supera la mejor tasa mensual disponible (${formatPct(
                    teaMensualPct!,
                  )}) por ${formatPct(Math.abs(lecaInflacion))} puntos. En términos reales, perdés poder de compra.`}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-border border border-border mb-8">
            <div className="bg-panel p-6">
              <div className="section-eyebrow">Mejor TEA del sistema</div>
              <div className="text-3xl tabular text-accent font-bold mt-2">
                {formatPct(mejorTea!)}
              </div>
              <div className="text-sm text-muted mt-1">
                ≈ {formatPct(teaMensualPct!)} mensual
              </div>
              <div className="text-xs text-ink mt-3">{mejorBanco}</div>
              <Link
                href="/?tipo=plazos-fijos"
                className="text-[10px] uppercase tracking-widest text-muted hover:text-accent mt-4 inline-block"
              >
                → Ver el comparador completo
              </Link>
            </div>

            <div className="bg-panel p-6">
              <div className="section-eyebrow">
                Inflación · último mes informado
              </div>
              <div className="text-3xl tabular text-danger font-bold mt-2">
                {formatPct(inflacionMensualPct!)}
              </div>
              <div className="text-sm text-muted mt-1">
                {inflacionDesc}
              </div>
              {inflacionFecha && (
                <div className="text-xs text-muted mt-1 tabular">
                  Publicado: {inflacionFecha}
                </div>
              )}
              {inflacionSerie.length > 1 && (
                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted mb-1">
                    Últimos 12 meses
                  </div>
                  <Sparkline
                    data={inflacionSerie}
                    positive={false}
                    height={48}
                  />
                </div>
              )}
              {inflacionVarId !== null && (
                <Link
                  href={`/variable/${inflacionVarId}`}
                  className="text-[10px] uppercase tracking-widest text-muted hover:text-accent mt-3 inline-block"
                >
                  → Serie histórica completa
                </Link>
              )}
            </div>
          </div>

          {topPlazosFijos.length > 0 && (
            <>
              <h2 className="section-eyebrow mb-3 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block w-6 h-px bg-accent align-middle"
                />
                Top 5 plazos fijos vs inflación
              </h2>
              <div className="border border-border overflow-x-auto mb-8">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Banco</th>
                      <th className="text-right">TEA</th>
                      <th className="text-right">Mensual</th>
                      <th className="text-right">vs IPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPlazosFijos.map((p, i) => {
                      const mensual = p.tea / 12;
                      const diff = mensual - (inflacionMensualPct ?? 0);
                      const winning = diff > 0;
                      return (
                        <tr key={i}>
                          <td>{p.banco}</td>
                          <td className="text-right tabular text-accent font-bold">
                            {formatPct(p.tea)}
                          </td>
                          <td className="text-right tabular text-muted">
                            {formatPct(mensual)}
                          </td>
                          <td
                            className={`text-right tabular ${
                              winning ? "text-ok" : "text-danger"
                            }`}
                          >
                            {winning ? "+" : ""}
                            {formatPct(diff)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="text-[11px] text-muted leading-relaxed border-l-2 border-borderStrong pl-4">
            <strong className="text-ink">Letra chica:</strong> la TEA es la tasa
            efectiva anual; la dividimos por 12 como aproximación. La
            comparación correcta sería tasa efectiva mensual contra inflación
            mensual; usamos la simplificación porque la mayoría de bancos
            publica TEA, no TEM. Si la diferencia es chica (menos de 1pp), el
            resultado puede invertirse según la tasa efectiva real.{" "}
            <Link href="/macro" className="text-accent hover:underline">
              Más variables macro →
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
