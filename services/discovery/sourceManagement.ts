/**
 * Source Management Service
 * Manages Feedly and RSS feed sources for autonomous discovery
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface CreateFeedlySourceInput {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  userId: string;
  fetchIntervalMinutes?: number;
}

export interface CreateRSSSourceInput {
  name: string;
  url: string;
  fetchIntervalMinutes?: number;
}

export interface DiscoverySource {
  id: string;
  sourceType: string;
  name: string;
  url: string | null;
  status: string;
  lastFetchedAt: string | null;
  fetchIntervalMinutes: number;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export class SourceManagementService {
  async configureFeedly(input: CreateFeedlySourceInput): Promise<void> {
    const supabase = createAdminClient();

    // Check if Feedly config already exists
    const { data: existingConfig } = await supabase
      .from("feedly_config")
      .select("*")
      .single();

    if (existingConfig) {
      // Update existing config
      await supabase
        .from("feedly_config")
        .update({
          access_token: input.accessToken,
          refresh_token: input.refreshToken,
          token_expires_at: input.tokenExpiresAt,
          user_id: input.userId,
          updated_at: new Date().toISOString(),
        });
    } else {
      // Create new config
      await supabase
        .from("feedly_config")
        .insert({
          access_token: input.accessToken,
          refresh_token: input.refreshToken,
          token_expires_at: input.tokenExpiresAt,
          user_id: input.userId,
        });
    }

    // Ensure Feedly source exists
    await this.ensureFeedlySource(input.fetchIntervalMinutes);
  }

  async ensureFeedlySource(fetchIntervalMinutes: number = 60): Promise<void> {
    const supabase = createAdminClient();

    const { data: existingSource } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .eq("source_type", "feedly")
      .single();

    if (!existingSource) {
      await supabase
        .from("discovery_system_sources")
        .insert({
          source_type: "feedly",
          name: "Feedly",
          url: null,
          config: {},
          status: "active",
          fetch_interval_minutes: fetchIntervalMinutes,
        });
    }
  }

  async addRSSSource(input: CreateRSSSourceInput): Promise<DiscoverySource> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("discovery_system_sources")
      .insert({
        source_type: "rss",
        name: input.name,
        url: input.url,
        config: {},
        status: "active",
        fetch_interval_minutes: input.fetchIntervalMinutes || 60,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add RSS source: ${error.message}`);
    }

    return this.mapSource(data);
  }

  async removeSource(sourceId: string): Promise<void> {
    const supabase = createAdminClient();

    await supabase
      .from("discovery_system_sources")
      .update({
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId);
  }

  async pauseSource(sourceId: string): Promise<void> {
    const supabase = createAdminClient();

    await supabase
      .from("discovery_system_sources")
      .update({
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId);
  }

  async resumeSource(sourceId: string): Promise<void> {
    const supabase = createAdminClient();

    await supabase
      .from("discovery_system_sources")
      .update({
        status: "active",
        error_count: 0,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId);
  }

  async updateSourceInterval(sourceId: string, intervalMinutes: number): Promise<void> {
    const supabase = createAdminClient();

    await supabase
      .from("discovery_system_sources")
      .update({
        fetch_interval_minutes: intervalMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId);

    // Update corresponding schedule if exists
    await supabase
      .from("discovery_schedule")
      .update({
        schedule_config: { interval_minutes: intervalMinutes },
        updated_at: new Date().toISOString(),
      })
      .eq("source_id", sourceId);
  }

  async getAllSources(): Promise<DiscoverySource[]> {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .order("created_at", { ascending: false });

    return (data || []).map(this.mapSource);
  }

  async getActiveSources(): Promise<DiscoverySource[]> {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    return (data || []).map(this.mapSource);
  }

  async getSource(sourceId: string): Promise<DiscoverySource | null> {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (!data) {
      return null;
    }

    return this.mapSource(data);
  }

  async testRSSSource(url: string): Promise<{ success: boolean; error?: string; articleCount?: number }> {
    const { RSSConnector } = await import("@/services/discovery/connectors/rssConnector");
    const connector = new RSSConnector();

    try {
      const articles = await connector.fetchFeed(url);
      return {
        success: true,
        articleCount: articles.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testFeedlyConnection(): Promise<{ success: boolean; error?: string; subscriptionCount?: number }> {
    const { FeedlyConnector } = await import("@/services/discovery/connectors/feedlyConnector");
    const connector = new FeedlyConnector();

    try {
      await connector.initialize();
      const subscriptions = await connector.getSubscriptions();
      return {
        success: true,
        subscriptionCount: subscriptions.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getSourceMetrics(sourceId: string, hours: number = 24): Promise<any> {
    const supabase = createAdminClient();

    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data: metrics } = await supabase
      .from("discovery_metrics")
      .select("*")
      .eq("source_id", sourceId)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false });

    // Aggregate metrics
    const aggregated = {
      articlesDiscovered: 0,
      articlesAccepted: 0,
      articlesRejected: 0,
      averageProcessingTime: 0,
      errorRate: 0,
    };

    let processingTimeSum = 0;
    let processingTimeCount = 0;
    let totalAttempts = 0;
    let errors = 0;

    for (const metric of metrics || []) {
      switch (metric.metric_type) {
        case "articles_discovered":
          aggregated.articlesDiscovered += Number(metric.metric_value);
          totalAttempts++;
          break;
        case "articles_accepted":
          aggregated.articlesAccepted += Number(metric.metric_value);
          break;
        case "articles_rejected":
          aggregated.articlesRejected += Number(metric.metric_value);
          break;
        case "processing_time":
          processingTimeSum += Number(metric.metric_value);
          processingTimeCount++;
          break;
      }
    }

    if (processingTimeCount > 0) {
      aggregated.averageProcessingTime = processingTimeSum / processingTimeCount;
    }

    aggregated.errorRate = totalAttempts > 0 ? errors / totalAttempts : 0;

    return aggregated;
  }

  private mapSource(data: any): DiscoverySource {
    return {
      id: data.id,
      sourceType: data.source_type,
      name: data.name,
      url: data.url,
      status: data.status,
      lastFetchedAt: data.last_fetched_at,
      fetchIntervalMinutes: data.fetch_interval_minutes,
      errorCount: data.error_count,
      lastError: data.last_error,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export async function createSourceManagementService(): Promise<SourceManagementService> {
  return new SourceManagementService();
}
