import { NextResponse } from "next/server";
import { withCacheHeaders } from "@/lib/utils/cache";

export async function GET() {
  // PLACEHOLDER: list articles
  const response = NextResponse.json({ message: "articles API placeholder" });
  return withCacheHeaders(response, 3600);
}

export async function POST(request: Request) {
  // PLACEHOLDER: create articles
  const body = await request.json();
  return NextResponse.json({ message: "created", body });
}
