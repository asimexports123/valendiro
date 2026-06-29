import { NextResponse } from "next/server";
import { withCacheHeaders } from "@/lib/utils/cache";

export async function GET() {
  // PLACEHOLDER: list questions
  const response = NextResponse.json({ message: "questions API placeholder" });
  return withCacheHeaders(response, 3600);
}

export async function POST(request: Request) {
  // PLACEHOLDER: create questions
  const body = await request.json();
  return NextResponse.json({ message: "created", body });
}
