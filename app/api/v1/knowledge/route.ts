import { NextResponse } from "next/server";
import { withCacheHeaders } from "@/lib/utils/cache";

export async function GET() {
  // PLACEHOLDER: list knowledge
  const response = NextResponse.json({ message: "knowledge API placeholder" });
  return withCacheHeaders(response, 3600);
}

export async function POST(request: Request) {
  // PLACEHOLDER: create knowledge
  const body = await request.json();
  return NextResponse.json({ message: "created", body });
}
