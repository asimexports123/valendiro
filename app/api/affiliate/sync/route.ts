import { NextResponse } from "next/server";
import { runAffiliateSync } from "@/services/affiliate/syncEngine";

function getSecret(request: Request): string | null {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret) return querySecret;

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  return request.headers.get("X-Job-Secret");
}

export async function GET(request: Request) {
  const secret = getSecret(request);
  const expectedSecret = process.env.CRON_SECRET || process.env.JOB_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAffiliateSync();
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const secret = getSecret(request);
  const expectedSecret = process.env.CRON_SECRET || process.env.JOB_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { csvText, network = "csv", merchant = "Manual CSV" } = body;

    if (!csvText || typeof csvText !== "string") {
      return NextResponse.json({ error: "Missing csvText" }, { status: 400 });
    }

    const { importAffiliateCsv } = await import("@/services/affiliate/syncEngine");
    const result = await importAffiliateCsv(csvText, network, merchant);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
