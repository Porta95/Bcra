import Link from "next/link";
import { getSerie, getVariables } from "@/lib/bcra";
import SerieChart from "@/components/SerieChart";

export const revalidate = 1800;

export default async function VariablePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  const [variables, serie] = await Promise.all([
    getVariables().catch(() => []),
    getSerie(id).catch(() => []),
  ]);

  const meta = variables.find((v) => v.idVariable === id);

  return (
    <div>
      <Link
        href="/"
        className="text-xs text-muted hover:text-accent uppercase tracking-widest"
      >
        ← Volver al panel
      </Link>

      <div className="mt-4 mb-8 border-l-2 border-accent pl-4">
        <div className="text-[10px] uppercase tracking-widest text-muted">
          Variable #{id}
        </div>
        <h1 className="font-display text-2xl md:text-3xl tracking-tight mt-1 max-w-3xl">
          {meta?.descripcion ?? "Sin descripción"}
        </h1>
        {meta?.categoria && (
          <div className="text-xs text-muted mt-2">{meta.categoria}</div>
        )}
      </div>

      <SerieChart data={serie} />
    </div>
  );
}
