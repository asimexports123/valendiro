import { NextResponse } from "next/server";
import { withCacheHeaders } from "@/lib/utils/cache";

export async function GET() {
  // PLACEHOLDER: list entities
  const response = NextResponse.json({ message: "entities API placeholder" });
  return withCacheHeaders(response, 3600);
}

export async function POST(request: Request) {
  // PLACEHOLDER: create entities
  const body = await request.json();
  return NextResponse.json({ message: "created", body });
}
