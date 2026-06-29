import { NextResponse } from "next/server";
import { withCacheHeaders } from "@/lib/utils/cache";

export async function GET() {
  // PLACEHOLDER: list topics
  const response = NextResponse.json({ message: "topics API placeholder" });
  return withCacheHeaders(response, 3600);
}

export async function POST(request: Request) {
  // PLACEHOLDER: create topics
  const body = await request.json();
  return NextResponse.json({ message: "created", body });
}
