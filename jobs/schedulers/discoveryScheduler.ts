/**
 * Discovery Scheduler
 * Manages automated scheduling of discovery runs for RSS and Feedly sources
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { FeedlyConnector } from "@/services/discovery/connectors/feedlyConnector";
import { RSSConnector } from "@/services/discovery/connectors/rssConnector";

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

    // Fetch all active sources that are due for discovery
    const { data: sources } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .eq("status", "active")
      .lte("last_fetched_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // At least 5 minutes since last fetch
      .order("last_fetched_at", { ascending: true, nullsFirst: true })
      .limit(10);

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

  async runDiscoveryForSource(source: any): Promise<DiscoveryScheduleResult> {
    const startTime = Date.now();

    try {
      let result: { saved: number; duplicates: number; errors: number };

      if (source.source_type === "feedly") {
        const feedlyConnector = new FeedlyConnector();
        await feedlyConnector.initialize();
        
        const articles = await feedlyConnector.fetchAllArticles();
        result = await feedlyConnector.saveArticles(source.id, articles);
        
        await feedlyConnector.updateSourceLastFetched(source.id);
      } else if (source.source_type === "rss") {
        const rssConnector = new RSSConnector();
        
        const feedUrl = source.url;
        const articles = await rssConnector.fetchFeed(feedUrl);
        result = await rssConnector.saveArticles(source.id, articles);
        
        await rssConnector.updateSourceLastFetched(source.id);
      } else {
        throw new Error(`Unsupported source type: ${source.source_type}`);
      }

      return {
        sourceId: source.id,
        sourceType: source.source_type,
        articlesDiscovered: result.saved + result.duplicates + result.errors,
        articlesSaved: result.saved,
        articlesDuplicate: result.duplicates,
        articlesError: result.errors,
        durationMs: Date.now() - startTime,
        status: "success",
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Update source error
      if (source.source_type === "feedly") {
        const feedlyConnector = new FeedlyConnector();
        await feedlyConnector.initialize();
        await feedlyConnector.updateSourceError(source.id, errorMessage);
      } else if (source.source_type === "rss") {
        const rssConnector = new RSSConnector();
        await rssConnector.updateSourceError(source.id, errorMessage);
      }

      return {
        sourceId: source.id,
        sourceType: source.source_type,
        articlesDiscovered: 0,
        articlesSaved: 0,
        articlesDuplicate: 0,
        articlesError: 0,
        durationMs: Date.now() - startTime,
        status: "failed",
        error: errorMessage,
      };
    }
  }

  async queueKnowledgeExtraction(): Promise<void> {
    const supabase = createAdminClient();

    // Fetch pending discovered articles
    const { data: articles } = await supabase
      .from("discovered_articles")
      .select("*")
      .eq("status", "pending")
      .limit(50);

    if (!articles || articles.length === 0) {
      return;
    }

    for (const article of articles) {
      try {
        // Update status to processing
        await supabase
          .from("discovered_articles")
          .update({
            status: "processing",
            processing_started_at: new Date().toISOString(),
          })
          .eq("id", article.id);

        // Add to knowledge extraction queue
        await supabase
          .from("knowledge_extraction_queue")
          .insert({
            discovered_article_id: article.id,
            topic_id: null, // Will be determined by the worker
            priority: 50,
            status: "pending",
            scheduled_at: new Date().toISOString(),
          });
      } catch (error) {
        console.error(`Failed to queue article ${article.id} for extraction:`, error);
        
        // Mark as error
        await supabase
          .from("discovered_articles")
          .update({
            status: "error",
            processing_completed_at: new Date().toISOString(),
          })
          .eq("id", article.id);
      }
    }
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
