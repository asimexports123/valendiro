/**
 * Autonomous Pipeline Orchestrator
 * 
 * Orchestrates the complete autonomous discovery and knowledge pipeline:
 * RSS → Discovery → Deduplication → Trust Scoring → Knowledge Extraction → Graph Update → Gap Analysis → Regeneration → Internal Links
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { processAllRSSFeeds } from "../discovery/rssDiscoveryService";
import { processArticlePipelineBatch } from "../discovery/articlePipeline";
import { analyzeAllTopicGaps } from "../discovery/gapAnalysisService";
import { regenerateAllInternalLinks } from "../discovery/internalLinkService";
import { runHealthCheck, startContinuousMonitoring } from "../monitoring/selfMonitoringService";
import { processRegenerationQueue } from "../regeneration/contentRegenerationQueue";

const supabase = createAdminClient();

export interface PipelineRunResult {
  stage: string;
  success: boolean;
  processed: number;
  details: any;
  duration: number;
}

/**
 * Run the complete autonomous pipeline
 */
export async function runAutonomousPipeline(): Promise<PipelineRunResult[]> {
  console.log(`[Orchestrator] Starting autonomous pipeline run`);
  const startTime = Date.now();
  const results: PipelineRunResult[] = [];

  try {
    // Stage 1: Discovery
    console.log(`[Orchestrator] Stage 1: Discovery`);
    const discoveryStart = Date.now();
    const discoveryResult = await runDiscoveryStage();
    const discoveryDuration = Date.now() - discoveryStart;
    results.push({
      stage: 'discovery',
      success: discoveryResult.success,
      processed: discoveryResult.processed,
      details: discoveryResult,
      duration: discoveryDuration,
    });

    // Stage 2: Deduplication
    console.log(`[Orchestrator] Stage 2: Deduplication`);
    const deduplicationStart = Date.now();
    const deduplicationResult = await runDeduplicationStage();
    const deduplicationDuration = Date.now() - deduplicationStart;
    results.push({
      stage: 'deduplication',
      success: deduplicationResult.success,
      processed: deduplicationResult.processed,
      details: deduplicationResult,
      duration: deduplicationDuration,
    });

    // Stage 3: Knowledge Extraction
    console.log(`[Orchestrator] Stage 3: Knowledge Extraction`);
    const extractionStart = Date.now();
    const extractionResult = await runExtractionStage();
    const extractionDuration = Date.now() - extractionStart;
    results.push({
      stage: 'extraction',
      success: extractionResult.success,
      processed: extractionResult.processed,
      details: extractionResult,
      duration: extractionDuration,
    });

    // Stage 4: Gap Analysis
    console.log(`[Orchestrator] Stage 4: Gap Analysis`);
    const gapAnalysisStart = Date.now();
    const gapAnalysisResult = await runGapAnalysisStage();
    const gapAnalysisDuration = Date.now() - gapAnalysisStart;
    results.push({
      stage: 'gap_analysis',
      success: gapAnalysisResult.success,
      processed: gapAnalysisResult.processed,
      details: gapAnalysisResult,
      duration: gapAnalysisDuration,
    });

    // Stage 5: Regeneration
    console.log(`[Orchestrator] Stage 5: Regeneration`);
    const regenerationStart = Date.now();
    const regenerationResult = await runRegenerationStage();
    const regenerationDuration = Date.now() - regenerationStart;
    results.push({
      stage: 'regeneration',
      success: regenerationResult.success,
      processed: regenerationResult.processed,
      details: regenerationResult,
      duration: regenerationDuration,
    });

    // Stage 6: Internal Links
    console.log(`[Orchestrator] Stage 6: Internal Links`);
    const linksStart = Date.now();
    const linksResult = await runInternalLinksStage();
    const linksDuration = Date.now() - linksStart;
    results.push({
      stage: 'internal_links',
      success: linksResult.success,
      processed: linksResult.processed,
      details: linksResult,
      duration: linksDuration,
    });

    const totalDuration = Date.now() - startTime;
    console.log(`[Orchestrator] Pipeline completed in ${totalDuration}ms`);

    // Log pipeline run to database
    await logPipelineRun(results, totalDuration);

    return results;

  } catch (error: any) {
    console.error(`[Orchestrator] Pipeline failed:`, error);
    results.push({
      stage: 'pipeline',
      success: false,
      processed: 0,
      details: { error: error.message },
      duration: Date.now() - startTime,
    });
    return results;
  }
}

/**
 * Run discovery stage
 */
async function runDiscoveryStage(): Promise<{ success: boolean; processed: number }> {
  try {
    const result = await processAllRSSFeeds();
    return { success: true, processed: result.discovered };
  } catch (error) {
    console.error(`[Orchestrator] Discovery stage failed:`, error);
    return { success: false, processed: 0 };
  }
}

/**
 * Run deduplication stage — canonical path deduplicates at RSS ingest; no-op here.
 */
async function runDeduplicationStage(): Promise<{ success: boolean; processed: number }> {
  return { success: true, processed: 0 };
}

/**
 * Run knowledge extraction stage via canonical article pipeline
 */
async function runExtractionStage(): Promise<{ success: boolean; processed: number }> {
  try {
    const result = await processArticlePipelineBatch(10);
    return { success: result.failed === 0, processed: result.published };
  } catch (error) {
    console.error(`[Orchestrator] Extraction stage failed:`, error);
    return { success: false, processed: 0 };
  }
}

/**
 * Run gap analysis stage
 */
async function runGapAnalysisStage(): Promise<{ success: boolean; processed: number }> {
  try {
    const result = await analyzeAllTopicGaps();
    return { success: true, processed: result.analyzed };
  } catch (error) {
    console.error(`[Orchestrator] Gap analysis stage failed:`, error);
    return { success: false, processed: 0 };
  }
}

/**
 * Run regeneration stage
 */
async function runRegenerationStage(): Promise<{ success: boolean; processed: number }> {
  try {
    await processRegenerationQueue();
    return { success: true, processed: 1 };
  } catch (error) {
    console.error(`[Orchestrator] Regeneration stage failed:`, error);
    return { success: false, processed: 0 };
  }
}

/**
 * Run internal links stage
 */
async function runInternalLinksStage(): Promise<{ success: boolean; processed: number }> {
  try {
    const result = await regenerateAllInternalLinks();
    return { success: true, processed: result.processed };
  } catch (error) {
    console.error(`[Orchestrator] Internal links stage failed:`, error);
    return { success: false, processed: 0 };
  }
}

/**
 * Log pipeline run to database
 */
async function logPipelineRun(results: PipelineRunResult[], totalDuration: number): Promise<void> {
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  await supabase
    .from("pipeline_runs")
    .insert({
      stages: results,
      total_duration: totalDuration,
      success: successCount === totalCount,
      stages_completed: successCount,
      stages_total: totalCount,
      run_at: new Date().toISOString(),
    });
}

/**
 * Start autonomous pipeline scheduler
 */
export function startAutonomousScheduler(intervalMinutes = 60): void {
  console.log(`[Orchestrator] Starting autonomous scheduler (interval: ${intervalMinutes} minutes)`);

  setInterval(async () => {
    try {
      console.log(`[Orchestrator] Scheduled pipeline run`);
      await runAutonomousPipeline();
    } catch (error) {
      console.error(`[Orchestrator] Scheduled pipeline run failed:`, error);
    }
  }, intervalMinutes * 60 * 1000);
}

/**
 * Initialize complete autonomous system
 */
export async function initializeAutonomousSystem(): Promise<void> {
  console.log(`[Orchestrator] Initializing autonomous system`);

  // Start continuous monitoring
  startContinuousMonitoring(5); // Check every 5 minutes

  // Start autonomous pipeline scheduler
  startAutonomousScheduler(60); // Run every hour

  // Run initial health check
  await runHealthCheck();

  console.log(`[Orchestrator] Autonomous system initialized`);
}
