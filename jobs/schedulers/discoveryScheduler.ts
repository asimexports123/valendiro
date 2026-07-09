/**
 * Discovery Scheduler
 * Manages automated scheduling of discovery runs via Knowledge Ingest Orchestrator.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  runKnowledgeIngestForSourceWithErrorHandling,
  toRegisteredKnowledgeSource,
} from "@/services/discovery/ingest/knowledgeIngestOrchestrator";
import {
  processArticlePipelineBatch,
  recoverStuckArticles,
} from "@/services/discovery/articlePipeline";

export interface DiscoveryScheduleResult {
  sourceId: string;
  sourceType: string;
  articlesDiscovered: number;
  articlesSaved: number;
  articlesDuplicate: number;
  articlesError: number;
  durationMs: number;
  status: "success" | "failed";
  error: string | null;
}

export class DiscoveryScheduler {
  async runScheduledDiscoveries(): Promise<DiscoveryScheduleResult[]> {
    const supabase = createAdminClient();
    const results: DiscoveryScheduleResult[] = [];

    // Fetch all active sources that are due for discovery (include never-fetched)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: sources } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .eq("status", "active")
      .or(`last_fetched_at.is.null,last_fetched_at.lte.${fiveMinAgo}`)
      .order("last_fetched_at", { ascending: true, nullsFirst: true })
      .limit(20);

    if (!sources || sources.length === 0) {
      return results;
    }

    for (const source of sources) {
      const result = await this.runDiscoveryForSource(source);
      results.push(result);

      // Update metrics
      await this.recordMetrics(source.id, result);
    }

    return results;
  }

  async runDiscoveryForSource(source: Record<string, unknown>): Promise<DiscoveryScheduleResult> {
    const startTime = Date.now();
    const registered = toRegisteredKnowledgeSource(source);

    const ingest = await runKnowledgeIngestForSourceWithErrorHandling(registered);

    if (ingest.status === "failed") {
      return {
        sourceId: registered.id,
        sourceType: registered.source_type,
        articlesDiscovered: 0,
        articlesSaved: 0,
        articlesDuplicate: 0,
        articlesError: 0,
        durationMs: Date.now() - startTime,
        status: "failed",
        error: ingest.error,
      };
    }

    return {
      sourceId: registered.id,
      sourceType: registered.source_type,
      articlesDiscovered: ingest.saved + ingest.duplicates + ingest.errors,
      articlesSaved: ingest.saved,
      articlesDuplicate: ingest.duplicates,
      articlesError: ingest.errors,
      durationMs: Date.now() - startTime,
      status: "success",
      error: null,
    };
  }

  /**
   * Process discovered articles through the canonical pipeline automatically.
   * Replaces the dead knowledge_extraction_queue insert-only path.
   */
  async processDiscoveredArticles(limit = 10) {
    await recoverStuckArticles();
    return processArticlePipelineBatch(limit);
  }

  /** @deprecated Use processDiscoveredArticles — kept for callers during migration */
  async queueKnowledgeExtraction(): Promise<void> {
    await this.processDiscoveredArticles(10);
  }

  async recordMetrics(sourceId: string, result: DiscoveryScheduleResult): Promise<void> {
    const supabase = createAdminClient();

    // Record articles discovered metric
    await supabase
      .from("discovery_metrics")
      .insert({
        source_id: sourceId,
        metric_type: "articles_discovered",
        metric_value: result.articlesDiscovered,
        metadata: {
          source_type: result.sourceType,
          duration_ms: result.durationMs,
        },
      });

    // Record articles accepted metric
    if (result.articlesSaved > 0) {
      await supabase
        .from("discovery_metrics")
        .insert({
          source_id: sourceId,
          metric_type: "articles_accepted",
          metric_value: result.articlesSaved,
        });
    }

    // Record articles rejected metric
    if (result.articlesDuplicate > 0) {
      await supabase
        .from("discovery_metrics")
        .insert({
          source_id: sourceId,
          metric_type: "articles_rejected",
          metric_value: result.articlesDuplicate,
          metadata: { reason: "duplicate" },
        });
    }

    // Record processing time metric
    await supabase
      .from("discovery_metrics")
      .insert({
        source_id: sourceId,
        metric_type: "processing_time",
        metric_value: result.durationMs / 1000, // Convert to seconds
      });
  }

  async startContinuousDiscovery(): Promise<void> {
    const supabase = createAdminClient();

    // Ensure discovery schedules exist for all active sources
    const { data: sources } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .eq("status", "active");

    if (!sources || sources.length === 0) {
      return;
    }

    for (const source of sources) {
      const { data: existingSchedule } = await supabase
        .from("discovery_schedule")
        .select("*")
        .eq("source_id", source.id)
        .single();

      if (!existingSchedule) {
        // Create schedule for this source
        const nextRun = new Date(Date.now() + source.fetch_interval_minutes * 60 * 1000);
        
        await supabase
          .from("discovery_schedule")
          .insert({
            source_id: source.id,
            schedule_type: "interval",
            schedule_config: {
              interval_minutes: source.fetch_interval_minutes,
            },
            next_run_at: nextRun.toISOString(),
            status: "active",
          });
      }
    }
  }

  async updateSchedules(): Promise<void> {
    const supabase = createAdminClient();

    // Update next_run_at for completed schedules
    const { data: completedSchedules } = await supabase
      .from("discovery_schedule")
      .select(`
        id, source_id, schedule_config,
        discovery_system_sources(fetch_interval_minutes)
      `)
      .eq("status", "active")
      .lte("next_run_at", new Date().toISOString())
      .limit(10);

    if (!completedSchedules || completedSchedules.length === 0) {
      return;
    }

    for (const schedule of completedSchedules) {
      const intervalMinutes = (schedule as any).discovery_system_sources?.fetch_interval_minutes || 60;
      const nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000);

      await supabase
        .from("discovery_schedule")
        .update({
          next_run_at: nextRun.toISOString(),
          last_run_at: new Date().toISOString(),
        })
        .eq("id", schedule.id);
    }
  }
}

export async function createDiscoveryScheduler(): Promise<DiscoveryScheduler> {
  return new DiscoveryScheduler();
}
