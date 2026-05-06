import { NextResponse } from "next/server";
import { getVariables, BcraError } from "@/lib/bcra";

export const revalidate = 1800; // 30 min

export async function GET() {
  try {
    const variables = await getVariables();
    return NextResponse.json({ ok: true, data: variables });
  } catch (err) {
    const status = err instanceof BcraError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
