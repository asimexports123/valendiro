import { NextResponse } from "next/server";

export function errorResponse(
  error: unknown,
  status = 500,
): NextResponse {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}
