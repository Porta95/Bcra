import { NextResponse } from "next/server";
import {
  getDeudas,
  getDeudasHistoricas,
  getChequesRechazados,
  BcraError,
} from "@/lib/bcra";

export const revalidate = 21600; // 6h

export async function GET(
  _req: Request,
  { params }: { params: { cuit: string } },
) {
  const { cuit } = params;
  try {
    // Lanzamos las 3 llamadas en paralelo. Si alguna falla con 404
    // (que es habitual para CUITs sin antecedentes), igual mostramos el resto.
    const [deudas, historicas, cheques] = await Promise.allSettled([
      getDeudas(cuit),
      getDeudasHistoricas(cuit),
      getChequesRechazados(cuit),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        deudas: deudas.status === "fulfilled" ? deudas.value : null,
        historicas: historicas.status === "fulfilled" ? historicas.value : null,
        cheques: cheques.status === "fulfilled" ? cheques.value : null,
      },
    });
  } catch (err) {
    const status = err instanceof BcraError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
