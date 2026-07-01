/**
 * Autonomous Pipeline Cron
 *
 * Runs every 4 hours (via Vercel Cron or external scheduler).
 * Full content lifecycle WITHOUT human intervention:
 *
 *   1. Generate topics for subcategories
 *   2. Quality-check draft articles → promote passing ones
 *   3. Inject internal links
 *   4. Drip-publish ready articles
 *
 * Setup:
 *   Vercel: add cron to vercel.json with schedule "0 0,4,8,12,16,20 * * *"
 *   External: POST with Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { batchAutoGenerate } from "@/services/demand/topicAutoGenerator";
import { batchQualityCheck } from "@/services/publishing/qualityGuardrails";
import { batchInjectLinks } from "@/services/intelligence/contentLinkInjector";
import { executeDripPublish } from "@/services/publishing/dripPublisher";

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

  const startTime = Date.now();
  const log: string[] = [];

  try {
    // Step 1: Topic Generation
    log.push("[1/4] Auto-generating topics...");
    const topicResult = await batchAutoGenerate({
      maxTopicsPerSubcategory: 20,
      strategies: ["decomposition", "long-tail"],
      limitSubcategories: 10,
    });
    log.push(`  → ${topicResult.totalTopicsQueued} topics queued across ${topicResult.totalSubcategories} subcategories`);

    // Step 2: Quality Check & Promote
    log.push("[2/4] Quality checking drafts...");
    const qualityResult = await batchQualityCheck({
      limit: 30,
      promoteOnPass: true,
    });
    log.push(`  → ${qualityResult.articlesChecked} checked, ${qualityResult.promoted} promoted`);

    // Step 3: Link Injection
    log.push("[3/4] Injecting internal links...");
    const linkResult = await batchInjectLinks({
      limit: 20,
      onlyUnprocessed: true,
    });
    log.push(`  → ${linkResult.articlesModified} articles linked, ${linkResult.totalLinksInjected} links`);

    // Step 4: Drip Publish
    log.push("[4/4] Drip publishing...");
    const publishResult = await executeDripPublish();
    log.push(`  → ${publishResult.articlesPublished} published, ${publishResult.articlesRemaining} remaining`);

    const durationMs = Date.now() - startTime;
    log.push(`Done in ${(durationMs / 1000).toFixed(1)}s`);
    console.log(`[AutonomousPipeline]\n${log.join("\n")}`);

    return NextResponse.json({
      success: true,
      summary: {
        topicsQueued: topicResult.totalTopicsQueued,
        articlesPromoted: qualityResult.promoted,
        linksInjected: linkResult.totalLinksInjected,
        articlesPublished: publishResult.articlesPublished,
        durationMs,
      },
      log,
    });
  } catch (err: any) {
    log.push(`Error: ${err.message}`);
    console.error(`[AutonomousPipeline] ${err.message}`);
    return NextResponse.json({ success: false, error: err.message, log }, { status: 500 });
  }
}
