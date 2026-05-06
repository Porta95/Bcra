import { getVariables } from "@/lib/bcra";
import VariablesGrid from "@/components/VariablesGrid";

export const revalidate = 1800;

export default async function MacroPage() {
  let error: string | null = null;
  let variables: Awaited<ReturnType<typeof getVariables>> = [];

  try {
    variables = await getVariables();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <div>
      <div className="mb-8 border-l-2 border-accent pl-4">
        <div className="text-[10px] uppercase tracking-widest text-muted">
          Estadísticas Monetarias v4.0 · BCRA
        </div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">
          Macro <span className="italic text-accent">Argentina</span>
        </h1>
      </div>

      {error ? (
        <div className="border border-red/30 bg-red/5 p-4 text-sm">
          <div className="text-red mb-1">No se pudo conectar al BCRA</div>
          <div className="text-muted text-xs">{error}</div>
        </div>
      ) : (
        <VariablesGrid variables={variables} />
      )}
    </div>
  );
}
