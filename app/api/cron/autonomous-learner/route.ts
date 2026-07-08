/**
 * Autonomous Learner Cron — gap-driven knowledge acquisition loop.
 *
 * The catalog drives discovery. The web supplies evidence. The engine decides what to learn next.
 */

import { NextRequest, NextResponse } from "next/server";
import { runAutonomousLearner } from "@/services/learning/autonomousLearner";

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

  const start = Date.now();
  const log: string[] = [];

  try {
    process.env.ALLOW_RENDER = "true";

    log.push("[AutonomousLearner] Starting gap-driven learning cycle...");
    const result = await runAutonomousLearner({ topicLimit: 10 });

    log.push(`  Evaluated: ${result.topicsEvaluated} weakest topics`);
    log.push(`  Improved: ${result.topicsImproved}`);
    log.push(`  Rejected (regression): ${result.topicsRejected}`);
    log.push(`  Failed: ${result.topicsFailed}`);

    for (const r of result.results.filter((x) => x.status === "improved")) {
      log.push(`  ✓ ${r.topicSlug}: ${r.reason}`);
      if (r.before && r.after) {
        log.push(
          `    richness ${r.before.richness}→${r.after.richness}, words ${r.before.words}→${r.after.words}, facts ${r.before.facts}→${r.after.facts}`
        );
      }
    }

    const durationMs = Date.now() - start;
    log.push(`Done in ${(durationMs / 1000).toFixed(1)}s`);

    console.log(`[AutonomousLearnerCron]\n${log.join("\n")}`);

    return NextResponse.json({
      success: true,
      summary: {
        ...result,
        durationMs,
      },
      log,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message, log }, { status: 500 });
  }
}
