import { NextResponse } from "next/server";
import { getEntidadesCheques, BcraError } from "@/lib/bcra";

export const revalidate = 86400; // 1 día

export async function GET() {
  try {
    const data = await getEntidadesCheques();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const status = err instanceof BcraError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
