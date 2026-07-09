/**
 * @deprecated Phase 0 — Demand pipeline cron RETIRED.
 * @architecture-frozen — Route kept for rollback visibility; always returns 410.
 * Canonical cron: /api/cron/discovery-pipeline
 */

import { NextRequest, NextResponse } from "next/server";
import {
  DEMAND_PIPELINE_DISABLED_MESSAGE,
  DEMAND_PIPELINE_FROZEN,
} from "@/lib/architecture/frozen";

const CRON_SECRET = process.env.CRON_SECRET || "";

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron") === "true") return true;
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (CRON_SECRET && auth === CRON_SECRET) return true;
  if (process.env.NODE_ENV === "development") return true;
  return false;
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.warn("[AutonomousPipeline] RETIRED — demand cron disabled (Phase 0 architecture freeze)");

  return NextResponse.json(
    {
      success: false,
      retired: true,
      frozen: DEMAND_PIPELINE_FROZEN,
      error: DEMAND_PIPELINE_DISABLED_MESSAGE,
      canonicalCron: "/api/cron/discovery-pipeline",
    },
    { status: 410 }
  );
}
