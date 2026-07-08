/**
 * Discovery Pipeline Cron
 *
 * Canonical RSS → Knowledge pipeline (automated):
 *   1. Knowledge ingest (discovery_system_sources → Connector → Adapter → Orchestrator)
 *   2. Article pipeline (assemble → render → publish → graph)
 *
 * Schedule: every 2 hours
 * Auth: Vercel cron header or Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { createDiscoveryScheduler } from "@/jobs/schedulers/discoveryScheduler";
import { enrichThinCatalog } from "@/services/discovery/catalogEnrichment";
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

    const scheduler = await createDiscoveryScheduler();

    log.push("[1/2] Running RSS discovery...");
    const discoveryResults = await scheduler.runScheduledDiscoveries();
    const articlesSaved = discoveryResults.reduce((sum, r) => sum + r.articlesSaved, 0);
    log.push(`  → ${discoveryResults.length} sources, ${articlesSaved} new articles`);

    log.push("[2/3] Processing discovered articles through canonical pipeline...");
    const pipelineResult = await scheduler.processDiscoveredArticles(25);
    log.push(
      `  → processed=${pipelineResult.processed}, published=${pipelineResult.published}, catalogMatches=${pipelineResult.catalogMatches}, archived=${pipelineResult.archived}, rejected=${pipelineResult.rejected}, failed=${pipelineResult.failed}`
    );

    clearTopicIndexCache();
    log.push("[3/3] Enriching thin catalog topics from accumulated sources...");
    const enrichment = await enrichThinCatalog(15);
    log.push(
      `  → enriched=${enrichment.enriched}, skipped=${enrichment.skipped}, failed=${enrichment.failed}`
    );

    const durationMs = Date.now() - startTime;
    log.push(`Done in ${(durationMs / 1000).toFixed(1)}s`);
    console.log(`[DiscoveryPipelineCron]\n${log.join("\n")}`);

    return NextResponse.json({
      success: true,
      summary: {
        sourcesRun: discoveryResults.length,
        articlesSaved,
        articlesProcessed: pipelineResult.processed,
        articlesPublished: pipelineResult.published,
        catalogMatches: pipelineResult.catalogMatches,
        deferred: pipelineResult.deferred,
        articlesArchived: pipelineResult.archived,
        articlesRejected: pipelineResult.rejected,
        articlesFailed: pipelineResult.failed,
        topicsEnriched: enrichment.enriched,
        topicsEnrichmentSkipped: enrichment.skipped,
        durationMs,
      },
      log,
      errors: pipelineResult.errors,
      enrichment: enrichment.results.filter((r) => r.status === "enriched"),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.push(`Error: ${message}`);
    console.error(`[DiscoveryPipelineCron] ${message}`);
    return NextResponse.json({ success: false, error: message, log }, { status: 500 });
  }
}
