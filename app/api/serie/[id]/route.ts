import { NextRequest, NextResponse } from "next/server";
import { getSerie, BcraError } from "@/lib/bcra";

export const revalidate = 1800;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: "id inválido" }, { status: 400 });
  }
  const desde = req.nextUrl.searchParams.get("desde") ?? undefined;
  const hasta = req.nextUrl.searchParams.get("hasta") ?? undefined;
  try {
    const data = await getSerie(id, desde, hasta);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const status = err instanceof BcraError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
