import { getVariables } from "@/lib/bcra";
import VariablesGrid from "@/components/VariablesGrid";

// Re-renderea cada 30 minutos en el edge de Vercel
export const revalidate = 1800;

export default async function Home() {
  let error: string | null = null;
  let variables: Awaited<ReturnType<typeof getVariables>> = [];

  try {
    variables = await getVariables();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <div>
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">
            Macro <span className="italic text-accent">Argentina</span>
          </h1>
          <p className="text-xs text-muted mt-1 uppercase tracking-widest">
            Variables principales del Banco Central
          </p>
        </div>
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
