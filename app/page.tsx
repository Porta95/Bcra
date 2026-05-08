import {
  getCajasAhorros,
  getPaquetesProductos,
  getPlazosFijos,
  getPrestamosHipotecarios,
  getPrestamosPersonales,
  getPrestamosPrendarios,
  getTarjetasCredito,
} from "@/lib/bcra";
import TransparenciaTable from "@/components/TransparenciaTable";
import TipoSelector from "@/components/TipoSelector";
import { TIPOS, type Tipo } from "@/lib/transparencia";

export const revalidate = 21600; // 6h

const FETCHERS: Record<Tipo, () => Promise<any[]>> = {
  "plazos-fijos": getPlazosFijos,
  "personales": getPrestamosPersonales,
  "hipotecarios": getPrestamosHipotecarios,
  "prendarios": getPrestamosPrendarios,
  "tarjetas": getTarjetasCredito,
  "cajas": getCajasAhorros,
  "paquetes": getPaquetesProductos,
};

function isTipo(s: string | undefined): s is Tipo {
  return TIPOS.some((t) => t.id === s);
}

export default async function Home({
  searchParams,
}: {
  searchParams: { tipo?: string };
}) {
  const tipo: Tipo = isTipo(searchParams.tipo) ? searchParams.tipo : "plazos-fijos";
  const tipoLabel = TIPOS.find((t) => t.id === tipo)?.label ?? "";

  let data: any[] = [];
  let error: string | null = null;
  try {
    data = await FETCHERS[tipo]();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <div>
      <div className="mb-6 border-l-2 border-accent pl-4">
        <div className="text-[10px] uppercase tracking-widest text-muted">
          Régimen de Transparencia · BCRA
        </div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">
          Comparador <span className="italic text-accent">{tipoLabel}</span>
        </h1>
        <p className="text-xs text-muted mt-3 max-w-2xl leading-relaxed">
          Datos publicados por las entidades financieras según la normativa del
          BCRA. Tasas, comisiones y condiciones declaradas. Tocá los encabezados
          para ordenar.
        </p>
      </div>

      <TipoSelector active={tipo} />

      {error ? (
        <div className="border border-red/30 bg-red/5 p-4 text-sm">
          <div className="text-red mb-1">No se pudo conectar al BCRA</div>
          <div className="text-muted text-xs">{error}</div>
        </div>
      ) : (
        <TransparenciaTable tipo={tipo} data={data} />
      )}
    </div>
  );
}
