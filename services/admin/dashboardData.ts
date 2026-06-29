import { createClient } from "@/lib/supabase/server";
import { ContentHealthScore, ExecutionLog, SeoKeywordGap, InternalLinkSuggestion, DemandSignal, DemandTopicQueueItem, DemandTopicCluster, SystemEvent, ArticleLifecycleStatus } from "@/lib/types";
import { getAutomationConfig, AutomationConfig } from "@/services/system/settings";

export interface DashboardMetrics {
  totalArticles: number;
  totalTopics: number;
  totalQuestions: number;
  activeQueueItems: number;
  avgHealthScore: number;
  estimatedRevenue: number;
  lowHealthCount: number;
  pendingSeoSuggestions: number;
}

export interface SystemStatus {
  automationEnabled: boolean;
  publishLimitPerRun: number;
  demandDiscoveryEnabled: boolean;
  qualityGateEnabled: boolean;
  queueSize: number;
  failedJobs: number;
  lastCronRun: string | null;
  lastSuccessfulPublish: string | null;
}

export interface PublishingMetrics {
  drafts: number;
  published: number;
  archived: number;
  updateQueue: number;
  lifecycle: Record<ArticleLifecycleStatus, number>;
}

export async function getDashboardMetrics(): Promise<{ metrics: DashboardMetrics; error: string | null }> {
  const supabase = await createClient();

  const [
    { count: totalArticles, error: articlesError },
    { count: totalTopics, error: topicsError },
    { count: totalQuestions, error: questionsError },
    { count: activeQueueItems, error: queueError },
    { data: healthScores, error: healthError },
    { data: revenue, error: revenueError },
    { count: lowHealthCount, error: lowHealthError },
    { count: pendingSeoSuggestions, error: seoError },
  ] = await Promise.all([
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("topics").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("content_generation_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("content_health_scores").select("overall_health_score").limit(1000),
    supabase.from("affiliate_conversions").select("estimated_revenue").gte("recorded_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("content_health_scores").select("*", { count: "exact", head: true }).lt("overall_health_score", 50),
    supabase.from("internal_link_suggestions").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const errors = [articlesError, topicsError, questionsError, queueError, healthError, revenueError, lowHealthError, seoError]
    .map((e) => e?.message)
    .filter(Boolean) as string[];

  const totalRevenue = (revenue || []).reduce((sum, row) => sum + (row.estimated_revenue ?? 0), 0);
  const avgHealth = healthScores && healthScores.length > 0
    ? healthScores.reduce((sum, row) => sum + (row.overall_health_score ?? 0), 0) / healthScores.length
    : 0;

  return {
    metrics: {
      totalArticles: totalArticles ?? 0,
      totalTopics: totalTopics ?? 0,
      totalQuestions: totalQuestions ?? 0,
      activeQueueItems: activeQueueItems ?? 0,
      avgHealthScore: Math.round(avgHealth),
      estimatedRevenue: totalRevenue,
      lowHealthCount: lowHealthCount ?? 0,
      pendingSeoSuggestions: pendingSeoSuggestions ?? 0,
    },
    error: errors.length > 0 ? errors.join("; ") : null,
  };
}

export async function getContentPerformance(limit = 20): Promise<{ data: ContentHealthScore[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_health_scores")
    .select("*")
    .order("overall_health_score", { ascending: false })
    .limit(limit);

  return { data: (data || []) as ContentHealthScore[], error: error?.message ?? null };
}

export async function getLowPerformingContent(limit = 20): Promise<{ data: ContentHealthScore[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_health_scores")
    .select("*")
    .lt("overall_health_score", 50)
    .order("overall_health_score", { ascending: true })
    .limit(limit);

  return { data: (data || []) as ContentHealthScore[], error: error?.message ?? null };
}

export async function getSeoInsights(limit = 20): Promise<{ keywordGaps: SeoKeywordGap[]; linkSuggestions: InternalLinkSuggestion[]; error: string | null }> {
  const supabase = await createClient();
  const [{ data: gaps, error: gapsError }, { data: links, error: linksError }] = await Promise.all([
    supabase.from("seo_keyword_gaps").select("*").eq("status", "pending").order("opportunity_score", { ascending: false }).limit(limit),
    supabase.from("internal_link_suggestions").select("*").eq("status", "pending").order("relevance_score", { ascending: false }).limit(limit),
  ]);

  return {
    keywordGaps: (gaps || []) as SeoKeywordGap[],
    linkSuggestions: (links || []) as InternalLinkSuggestion[],
    error: [gapsError, linksError].map((e) => e?.message).filter(Boolean).join("; ") || null,
  };
}

export async function getQueueItems(status = "pending", limit = 50): Promise<{ generation: any[]; update: any[]; priority: any[]; error: string | null }> {
  const supabase = await createClient();
  const [gen, upd, pri] = await Promise.all([
    supabase.from("content_generation_queue").select("*").eq("status", status).order("priority_score", { ascending: false }).limit(limit),
    supabase.from("content_update_queue").select("*").eq("status", status).order("priority_score", { ascending: false }).limit(limit),
    supabase.from("content_priority_queue").select("*").eq("status", status === "pending" ? "pending" : status).order("priority_score", { ascending: false }).limit(limit),
  ]);

  return {
    generation: gen.data || [],
    update: upd.data || [],
    priority: pri.data || [],
    error: [gen.error, upd.error, pri.error].map((e) => e?.message).filter(Boolean).join("; ") || null,
  };
}

export async function getSystemLogs(limit = 100): Promise<{ data: ExecutionLog[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("execution_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data: (data || []) as ExecutionLog[], error: error?.message ?? null };
}

export async function getAffiliateRevenue(days = 30): Promise<{ total: number; byProduct: Record<string, number>; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("affiliate_conversions")
    .select("affiliate_product_id, estimated_revenue")
    .gte("recorded_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

  let total = 0;
  const byProduct: Record<string, number> = {};
  for (const row of data || []) {
    total += row.estimated_revenue ?? 0;
    byProduct[row.affiliate_product_id] = (byProduct[row.affiliate_product_id] || 0) + (row.estimated_revenue ?? 0);
  }

  return { total, byProduct, error: error?.message ?? null };
}

export interface DemandIntelligenceMetrics {
  discoveredKeywords: number;
  queuedTopics: number;
  rejectedTopics: number;
  duplicateTopics: number;
  cannibalizedTopics: number;
  categoriesCreated: number;
  pendingClusters: number;
}

export async function getDemandIntelligenceMetrics(): Promise<{ metrics: DemandIntelligenceMetrics; error: string | null }> {
  const supabase = await createClient();
  const [
    { count: discoveredKeywords, error: discoveredError },
    { count: queuedTopics, error: queuedError },
    { count: rejectedTopics, error: rejectedError },
    { count: duplicateTopics, error: duplicateError },
    { count: cannibalizedTopics, error: cannibalizedError },
    { count: categoriesCreated, error: categoriesError },
    { count: pendingClusters, error: clustersError },
  ] = await Promise.all([
    supabase.from("demand_signals").select("*", { count: "exact", head: true }).gte("recorded_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("demand_topic_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("demand_topic_queue").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("demand_topic_queue").select("*", { count: "exact", head: true }).eq("status", "duplicate"),
    supabase.from("demand_topic_queue").select("*", { count: "exact", head: true }).eq("status", "cannibalized"),
    supabase.from("demand_auto_categories").select("*", { count: "exact", head: true }),
    supabase.from("demand_topic_clusters").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const errors = [discoveredError, queuedError, rejectedError, duplicateError, cannibalizedError, categoriesError, clustersError]
    .map((e) => e?.message)
    .filter(Boolean) as string[];

  return {
    metrics: {
      discoveredKeywords: discoveredKeywords ?? 0,
      queuedTopics: queuedTopics ?? 0,
      rejectedTopics: rejectedTopics ?? 0,
      duplicateTopics: duplicateTopics ?? 0,
      cannibalizedTopics: cannibalizedTopics ?? 0,
      categoriesCreated: categoriesCreated ?? 0,
      pendingClusters: pendingClusters ?? 0,
    },
    error: errors.length > 0 ? errors.join("; ") : null,
  };
}

export async function getDemandSignals(limit = 50): Promise<{ data: DemandSignal[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demand_signals")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(limit);
  return { data: (data || []) as DemandSignal[], error: error?.message ?? null };
}

export async function getDemandTopicQueue(limit = 50): Promise<{ data: DemandTopicQueueItem[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demand_topic_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data: (data || []) as DemandTopicQueueItem[], error: error?.message ?? null };
}

export async function getDemandClusters(limit = 50): Promise<{ data: DemandTopicCluster[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demand_topic_clusters")
    .select("*")
    .order("opportunity_score", { ascending: false })
    .limit(limit);
  return { data: (data || []) as DemandTopicCluster[], error: error?.message ?? null };
}

export async function getSystemStatus(): Promise<{ status: SystemStatus; error: string | null }> {
  const supabase = await createClient();
  const config = await getAutomationConfig();

  const [
    { count: queueSize, error: queueError },
    { count: failedJobs, error: failedError },
    { data: lastCron, error: cronError },
    { data: lastPublish, error: publishError },
  ] = await Promise.all([
    supabase.from("content_generation_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("execution_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("system_events").select("created_at").eq("event_type", "cron").order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("system_events").select("created_at").eq("event_name", "jobs_execute").eq("status", "success").order("created_at", { ascending: false }).limit(1).single(),
  ]);

  const errors = [queueError, failedError, cronError, publishError].map((e) => e?.message).filter(Boolean) as string[];

  return {
    status: {
      automationEnabled: config.automationEnabled,
      publishLimitPerRun: config.publishLimitPerRun,
      demandDiscoveryEnabled: config.demandDiscoveryEnabled,
      qualityGateEnabled: config.qualityGateEnabled,
      queueSize: queueSize ?? 0,
      failedJobs: failedJobs ?? 0,
      lastCronRun: (lastCron as SystemEvent | null)?.created_at ?? null,
      lastSuccessfulPublish: (lastPublish as SystemEvent | null)?.created_at ?? null,
    },
    error: errors.length > 0 ? errors.join("; ") : null,
  };
}

export async function getPublishingMetrics(): Promise<{ metrics: PublishingMetrics; error: string | null }> {
  const supabase = await createClient();

  const [
    { count: drafts, error: draftsError },
    { count: published, error: publishedError },
    { count: archived, error: archivedError },
    { count: updateQueue, error: updateError },
    { data: lifecycleData, error: lifecycleError },
  ] = await Promise.all([
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "archived"),
    supabase.from("content_update_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("articles").select("lifecycle_status"),
  ]);

  const lifecycle: Record<ArticleLifecycleStatus, number> = {
    draft: 0,
    published: 0,
    indexed: 0,
    growing: 0,
    stable: 0,
    declining: 0,
    update_required: 0,
    archived: 0,
  };
  for (const row of lifecycleData || []) {
    const status = row.lifecycle_status as ArticleLifecycleStatus;
    if (status in lifecycle) lifecycle[status]++;
  }

  const errors = [draftsError, publishedError, archivedError, updateError, lifecycleError].map((e) => e?.message).filter(Boolean) as string[];

  return {
    metrics: {
      drafts: drafts ?? 0,
      published: published ?? 0,
      archived: archived ?? 0,
      updateQueue: updateQueue ?? 0,
      lifecycle,
    },
    error: errors.length > 0 ? errors.join("; ") : null,
  };
}
