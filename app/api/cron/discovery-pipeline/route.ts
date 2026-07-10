/**
 * Discovery Pipeline Cron — single canonical publish path.
 *
 *   1. RSS ingest → fuel DB
 *   2. Article → relevant topic → related topics
 *   3. Gap-driven fuel gather for weak topics (crawl only, no publish)
 *   4. Catalog brain rewrite → publish (no external LLM required)
 */

import { NextRequest, NextResponse } from "next/server";
import { createDiscoveryScheduler } from "@/jobs/schedulers/discoveryScheduler";
import { gatherCatalogFuelForWeakTopics } from "@/services/discovery/catalogFuelGatherer";
import { publishOriginalCatalogBatch } from "@/services/discovery/catalogOriginalPublish";
import { clearTopicIndexCache } from "@/services/discovery/topicResolver";

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
    process.env.ALLOW_RENDER = "true";
    process.env.BRAIN_AUTO_PUBLISH = "true";

    const scheduler = await createDiscoveryScheduler();

    log.push("[1/4] RSS ingest → fuel DB...");
    const discoveryResults = await scheduler.runScheduledDiscoveries();
    const articlesSaved = discoveryResults.reduce((sum, r) => sum + r.articlesSaved, 0);
    log.push(`  → ${discoveryResults.length} sources, ${articlesSaved} fuel items`);

    log.push("[2/4] Article → topic relevance → related topics...");
    const pipelineResult = await scheduler.processDiscoveredArticles(25);
    log.push(
      `  → linked=${pipelineResult.deferred}, rejected=${pipelineResult.rejected}, archived=${pipelineResult.archived}`
    );

    log.push("[3/4] Gap-driven fuel gather for weak topics (no publish)...");
    const fuelResult = await gatherCatalogFuelForWeakTopics({ topicLimit: 5 });
    log.push(
      `  → topics=${fuelResult.topicsProcessed}, fuelGathered=${fuelResult.fuelGathered}, duplicates=${fuelResult.duplicates}, skipped=${fuelResult.skipped}`
    );

    clearTopicIndexCache();
    log.push("[4/4] Catalog brain — understand → rewrite → publish...");
    const original = await publishOriginalCatalogBatch(5);
    const brainCount = original.results.filter((r) => r.rewriteEngine === "brain").length;
    log.push(
      `  → published=${original.published}, brain=${brainCount}, skipped=${original.skipped}, failed=${original.failed}`
    );

    const durationMs = Date.now() - startTime;
    log.push(`Done in ${(durationMs / 1000).toFixed(1)}s`);

    return NextResponse.json({
      success: true,
      mode: "brain",
      summary: {
        sourcesRun: discoveryResults.length,
        fuelSaved: articlesSaved,
        articlesLinked: pipelineResult.deferred,
        fuelGathered: fuelResult.fuelGathered,
        topicsFuelProcessed: fuelResult.topicsProcessed,
        topicsPublished: original.published,
        brainRewrites: brainCount,
        durationMs,
      },
      log,
      fuelGatherResults: fuelResult.topicResults,
      publishResults: original.results,
      errors: pipelineResult.errors,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.push(`Error: ${message}`);
    return NextResponse.json({ success: false, error: message, log }, { status: 500 });
  }
}
