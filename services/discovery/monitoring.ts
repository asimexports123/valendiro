/**
 * Discovery Monitoring Service
 * Monitors health and performance of the discovery system
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface DiscoveryHealth {
  status: "healthy" | "degraded" | "unhealthy";
  activeSources: number;
  failedSources: number;
  articlesPending: number;
  articlesProcessing: number;
  articlesAcceptedLast24h: number;
  articlesRejectedLast24h: number;
  averageProcessingTime: number;
  errorRate: number;
  lastDiscoveryRun: string | null;
  issues: string[];
}

export interface SourceHealth {
  sourceId: string;
  sourceType: string;
  name: string;
  status: string;
  lastFetchedAt: string | null;
  errorCount: number;
  lastError: string | null;
  articlesDiscoveredLast24h: number;
  averageProcessingTime: number;
  health: "healthy" | "degraded" | "unhealthy";
}

export class DiscoveryMonitoringService {
  async getSystemHealth(): Promise<DiscoveryHealth> {
    const supabase = createAdminClient();
    const issues: string[] = [];

    // Get source health
    const { data: sources } = await supabase
      .from("discovery_system_sources")
      .select("*");

    const activeSources = (sources || []).filter(s => s.status === "active").length;
    const failedSources = (sources || []).filter(s => s.status === "failed").length;

    if (activeSources === 0) {
      issues.push("No active discovery sources configured");
    }

    if (failedSources > 0) {
      issues.push(`${failedSources} source(s) in failed state`);
    }

    // Get article processing status
    const { data: articles } = await supabase
      .from("discovered_articles")
      .select("status");

    const pending = (articles || []).filter(a => a.status === "pending").length;
    const processing = (articles || []).filter(a => a.status === "processing").length;

    if (pending > 1000) {
      issues.push(`${pending} articles pending processing (backlog)`);
    }

    // Get 24h metrics
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: metrics } = await supabase
      .from("discovery_metrics")
      .select("*")
      .gte("recorded_at", since);

    const accepted24h = (metrics || []).filter(m => m.metric_type === "articles_accepted").length;
    const rejected24h = (metrics || []).filter(m => m.metric_type === "articles_rejected").length;
    
    const processingTimes = (metrics || [])
      .filter(m => m.metric_type === "processing_time")
      .map(m => Number(m.metric_value));
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;

    // Calculate error rate
    const totalAttempts = accepted24h + rejected24h;
    const errorRate = totalAttempts > 0 ? rejected24h / totalAttempts : 0;

    if (errorRate > 0.5) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
    }

    // Get last discovery run
    const { data: schedules } = await supabase
      .from("discovery_schedule")
      .select("last_run_at")
      .order("last_run_at", { ascending: false, nullsFirst: false })
      .limit(1);

    const lastRun = schedules && schedules.length > 0 ? schedules[0].last_run_at : null;
    
    if (lastRun) {
      const hoursSinceLastRun = (Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastRun > 2 && activeSources > 0) {
        issues.push(`Last discovery run was ${hoursSinceLastRun.toFixed(1)} hours ago`);
      }
    }

    // Determine overall health
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (issues.length >= 3 || activeSources === 0) {
      status = "unhealthy";
    } else if (issues.length >= 1) {
      status = "degraded";
    }

    return {
      status,
      activeSources,
      failedSources,
      articlesPending: pending,
      articlesProcessing: processing,
      articlesAcceptedLast24h: accepted24h,
      articlesRejectedLast24h: rejected24h,
      averageProcessingTime: avgProcessingTime,
      errorRate,
      lastDiscoveryRun: lastRun,
      issues,
    };
  }

  async getSourceHealth(sourceId: string): Promise<SourceHealth | null> {
    const supabase = createAdminClient();

    const { data: source } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (!source) {
      return null;
    }

    // Get 24h metrics for this source
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: metrics } = await supabase
      .from("discovery_metrics")
      .select("*")
      .eq("source_id", sourceId)
      .gte("recorded_at", since);

    const discovered24h = (metrics || [])
      .filter(m => m.metric_type === "articles_discovered")
      .reduce((sum, m) => sum + Number(m.metric_value), 0);
    
    const processingTimes = (metrics || [])
      .filter(m => m.metric_type === "processing_time")
      .map(m => Number(m.metric_value));
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;

    // Determine source health
    let health: "healthy" | "degraded" | "unhealthy" = "healthy";
    
    if (source.status === "failed" || source.error_count > 10) {
      health = "unhealthy";
    } else if (source.error_count > 3 || source.status === "paused") {
      health = "degraded";
    }

    return {
      sourceId: source.id,
      sourceType: source.source_type,
      name: source.name,
      status: source.status,
      lastFetchedAt: source.last_fetched_at,
      errorCount: source.error_count,
      lastError: source.last_error,
      articlesDiscoveredLast24h: discovered24h,
      averageProcessingTime: avgProcessingTime,
      health,
    };
  }

  async getAllSourceHealth(): Promise<SourceHealth[]> {
    const supabase = createAdminClient();

    const { data: sources } = await supabase
      .from("discovery_system_sources")
      .select("*");

    if (!sources || sources.length === 0) {
      return [];
    }

    const healthPromises = sources.map(source => this.getSourceHealth(source.id));
    const healthResults = await Promise.all(healthPromises);

    return healthResults.filter((h): h is SourceHealth => h !== null);
  }

  async autoRecoverFailedSources(): Promise<{ recovered: number; failed: number }> {
    const supabase = createAdminClient();

    const { data: failedSources } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .eq("status", "failed");

    if (!failedSources || failedSources.length === 0) {
      return { recovered: 0, failed: 0 };
    }

    let recovered = 0;
    let failed = 0;

    for (const source of failedSources) {
      try {
        // Reset error count and reactivate
        await supabase
          .from("discovery_system_sources")
          .update({
            status: "active",
            error_count: 0,
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", source.id);

        recovered++;
      } catch (error) {
        console.error(`Failed to recover source ${source.id}:`, error);
        failed++;
      }
    }

    return { recovered, failed };
  }

  async cleanupStaleArticles(olderThanHours: number = 72): Promise<{ cleaned: number }> {
    const supabase = createAdminClient();

    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();

    const { data: staleArticles } = await supabase
      .from("discovered_articles")
      .select("id")
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .limit(1000);

    if (!staleArticles || staleArticles.length === 0) {
      return { cleaned: 0 };
    }

    // Mark stale articles as rejected
    const { error } = await supabase
      .from("discovered_articles")
      .update({
        status: "rejected",
        rejection_reason: "stale_pending_too_long",
        processing_completed_at: new Date().toISOString(),
      })
      .in("id", staleArticles.map(a => a.id));

    if (error) {
      console.error("Failed to cleanup stale articles:", error);
      return { cleaned: 0 };
    }

    return { cleaned: staleArticles.length };
  }

  async getProcessingQueueStats(): Promise<{
    pending: number;
    inProgress: number;
    completedLast24h: number;
    failedLast24h: number;
    averageWaitTime: number;
  }> {
    const supabase = createAdminClient();

    const { data: queue } = await supabase
      .from("knowledge_extraction_queue")
      .select("*");

    const pending = (queue || []).filter(q => q.status === "pending").length;
    const inProgress = (queue || []).filter(q => q.status === "in_progress").length;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const completedLast24h = (queue || []).filter(
      q => q.status === "completed" && new Date(q.completed_at) > new Date(since)
    ).length;
    const failedLast24h = (queue || []).filter(
      q => q.status === "failed" && new Date(q.completed_at) > new Date(since)
    ).length;

    // Calculate average wait time for pending items
    const pendingItems = (queue || []).filter(q => q.status === "pending");
    const waitTimes = pendingItems.map(q => 
      Date.now() - new Date(q.scheduled_at).getTime()
    );
    const averageWaitTime = waitTimes.length > 0 
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length 
      : 0;

    return {
      pending,
      inProgress,
      completedLast24h,
      failedLast24h,
      averageWaitTime,
    };
  }

  async recordHealthCheck(): Promise<void> {
    const supabase = createAdminClient();
    
    const health = await this.getSystemHealth();

    // Record as a metric
    await supabase
      .from("discovery_metrics")
      .insert({
        metric_type: "system_health",
        metric_value: health.status === "healthy" ? 1 : health.status === "degraded" ? 0.5 : 0,
        metadata: {
          status: health.status,
          active_sources: health.activeSources,
          failed_sources: health.failedSources,
          pending_articles: health.articlesPending,
          issues: health.issues,
        },
      });
  }
}

export async function createDiscoveryMonitoringService(): Promise<DiscoveryMonitoringService> {
  return new DiscoveryMonitoringService();
}
