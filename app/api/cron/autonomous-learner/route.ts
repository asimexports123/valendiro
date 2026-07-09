/**
 * @deprecated Parallel publish cron RETIRED.
 * @architecture-frozen — Route kept for rollback visibility; always returns 410.
 * Canonical cron: /api/cron/discovery-pipeline
 *
 * Manual scripts may still import runAutonomousLearner from services/learning/autonomousLearner.
 */

import { NextRequest, NextResponse } from "next/server";
import { parallelCronDisabledResponse } from "@/lib/architecture/frozen";

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

  console.warn(
    "[AutonomousLearner] RETIRED — gap-driven fuel acquisition runs in discovery-pipeline step 3"
  );

  return NextResponse.json(parallelCronDisabledResponse("autonomous-learner"), { status: 410 });
}
