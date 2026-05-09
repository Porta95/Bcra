import { fmtPeriodoHumano, type BancoStat } from "@/lib/deudores-analysis";
import { formatARS } from "@/lib/bcra";

interface Props {
  bancos: BancoStat[];
  periodos: string[];
}

const SIT_BG: Record<number, string> = {
  0: "bg-border",
  1: "bg-ok",
  2: "bg-warn/70",
  3: "bg-warn",
  4: "bg-danger/80",
  5: "bg-danger",
  6: "bg-danger",
};

export default function DeudaHeatmap({ bancos, periodos }: Props) {
  if (!bancos.length || !periodos.length) {
    return (
      <div className="empty-state">
        Sin datos para armar el mapa de calor.
      </div>
    );
  }

  return (
    <div className="border border-border bg-panel overflow-x-auto">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="section-eyebrow">
            Mapa de calor — entidad × período
          </div>
          <div className="flex gap-2 text-[10px] text-muted items-center">
            <span className="inline-block w-3 h-3 bg-border" />
            <span>—</span>
            <span className="inline-block w-3 h-3 bg-ok ml-2" />
            <span>1</span>
            <span className="inline-block w-3 h-3 bg-warn/70 ml-2" />
            <span>2</span>
            <span className="inline-block w-3 h-3 bg-warn ml-2" />
            <span>3</span>
            <span className="inline-block w-3 h-3 bg-danger/80 ml-2" />
            <span>4</span>
            <span className="inline-block w-3 h-3 bg-danger ml-2" />
            <span>5–6</span>
          </div>
        </div>
        <div className="min-w-fit">
          <div
            className="grid gap-px text-[9px]"
            style={{
              gridTemplateColumns: `minmax(120px, 200px) repeat(${periodos.length}, minmax(16px, 1fr))`,
            }}
          >
            <div className="bg-bg" />
            {periodos.map((p, i) => (
              <div
                key={p}
                className="bg-bg text-muted text-center tabular py-1"
                style={{
                  writingMode:
                    periodos.length > 12 ? ("vertical-rl" as const) : "horizontal-tb",
                  transform: periodos.length > 12 ? "rotate(180deg)" : undefined,
                  fontSize: 9,
                }}
                title={fmtPeriodoHumano(p)}
              >
                {/* mostrar mes/año compacto */}
                {i % Math.max(1, Math.floor(periodos.length / 12)) === 0
                  ? fmtPeriodoHumano(p)
                  : ""}
              </div>
            ))}

            {bancos.map((b) => (
              <BancoRow key={b.entidad} banco={b} periodos={periodos} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BancoRow({ banco, periodos }: { banco: BancoStat; periodos: string[] }) {
  const byPeriodo = new Map(banco.historial.map((h) => [h.periodo, h]));

  return (
    <>
      <div className="bg-panel2 px-2 py-1 text-xs text-ink truncate" title={banco.entidad}>
        {banco.shortName}
      </div>
      {periodos.map((p) => {
        const h = byPeriodo.get(p);
        const sit = h?.situacion ?? 0;
        return (
          <div
            key={p}
            className={`${SIT_BG[sit] ?? SIT_BG[0]} h-5 transition-opacity hover:opacity-70`}
            title={
              h
                ? `${fmtPeriodoHumano(p)} · sit. ${sit} · ${formatARS(h.monto)}`
                : `${fmtPeriodoHumano(p)} · sin reporte`
            }
          />
        );
      })}
    </>
  );
}
