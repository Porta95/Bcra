import { NextResponse } from "next/server";
import { consultarChequeDenunciado, BcraError } from "@/lib/bcra";

export const revalidate = 300; // 5 min

export async function GET(
  _req: Request,
  { params }: { params: { entidad: string; numero: string } },
) {
  const entidad = Number(params.entidad);
  const numero = Number(params.numero);

  if (!Number.isFinite(entidad) || !Number.isFinite(numero)) {
    return NextResponse.json(
      { ok: false, error: "Parámetros inválidos" },
      { status: 400 },
    );
  }

  try {
    const data = await consultarChequeDenunciado(entidad, numero);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const status = err instanceof BcraError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
