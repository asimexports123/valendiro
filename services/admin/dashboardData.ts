import { createAdminClient } from "@/lib/supabase/admin";
import { ContentHealthScore, ExecutionLog, SeoKeywordGap, InternalLinkSuggestion, DemandSignal, DemandTopicQueueItem, DemandTopicCluster, SystemEvent, ArticleLifecycleStatus } from "@/lib/types";
import { getAutomationConfig, AutomationConfig } from "@/services/system/settings";

async function safeCount<T>(fn: () => Promise<{ count: number | null; error: any }>): Promise<number> {
  try {
    const { count, error } = await fn();
    if (error) throw error;
    return count ?? 0;
  } catch (e) {
    console.error("Dashboard count error:", e);
    return 0;
  }
}

async function safeData<T>(fn: () => Promise<{ data: T | null; error: any }>, defaultValue: T): Promise<T> {
  try {
    const { data, error } = await fn();
    if (error) throw error;
    return (data as T) ?? defaultValue;
  } catch (e) {
    console.error("Dashboard data error:", e);
    return defaultValue;
  }
}

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

export async function getDashboardMetrics(): Promise<{ metrics: DashboardMetrics }> {
  const supabase = createAdminClient();

  const [totalArticles, totalTopics, totalQuestions, activeQueueItems, healthScores, revenue, lowHealthCount, pendingSeoSuggestions] = await Promise.all([
    safeCount(async () => supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published")),
    safeCount(async () => supabase.from("topics").select("*", { count: "exact", head: true }).eq("status", "published")),
    safeCount(async () => supabase.from("questions").select("*", { count: "exact", head: true }).eq("status", "published")),
    safeCount(async () => supabase.from("content_generation_queue").select("*", { count: "exact", head: true }).eq("status", "pending")),
    safeData(async () => supabase.from("content_health_scores").select("overall_health_score").limit(1000), [] as { overall_health_score: number }[]),
    safeData(async () => supabase.from("affiliate_conversions").select("estimated_revenue").gte("recorded_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()), [] as { estimated_revenue: number }[]),
    safeCount(async () => supabase.from("content_health_scores").select("*", { count: "exact", head: true }).lt("overall_health_score", 50)),
    safeCount(async () => supabase.from("internal_link_suggestions").select("*", { count: "exact", head: true }).eq("status", "pending")),
  ]);

  const totalRevenue = revenue.reduce((sum, row) => sum + (row.estimated_revenue ?? 0), 0);
  const avgHealth = healthScores.length > 0
    ? healthScores.reduce((sum, row) => sum + (row.overall_health_score ?? 0), 0) / healthScores.length
    : 0;

  return {
    metrics: {
      totalArticles,
      totalTopics,
      totalQuestions,
      activeQueueItems,
      avgHealthScore: Math.round(avgHealth),
      estimatedRevenue: totalRevenue,
      lowHealthCount,
      pendingSeoSuggestions,
    },
  };
}

export async function getContentPerformance(limit = 20): Promise<{ data: ContentHealthScore[]; error: string | null }> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("content_health_scores")
    .select("*")
    .order("overall_health_score", { ascending: false })
    .limit(limit);

  return { data: (data || []) as ContentHealthScore[], error: error?.message ?? null };
}

export async function getLowPerformingContent(limit = 20): Promise<{ data: ContentHealthScore[]; error: string | null }> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("content_health_scores")
    .select("*")
    .lt("overall_health_score", 50)
    .order("overall_health_score", { ascending: true })
    .limit(limit);

  return { data: (data || []) as ContentHealthScore[], error: error?.message ?? null };
}

export async function getSeoInsights(limit = 20): Promise<{ keywordGaps: SeoKeywordGap[]; linkSuggestions: InternalLinkSuggestion[]; error: string | null }> {
  const supabase = await createAdminClient();
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
  const supabase = await createAdminClient();
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
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("execution_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data: (data || []) as ExecutionLog[], error: error?.message ?? null };
}

export async function getAffiliateRevenue(days = 30): Promise<{ total: number; byProduct: Record<string, number>; error: string | null }> {
  const supabase = await createAdminClient();
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
  const supabase = await createAdminClient();
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
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("demand_signals")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(limit);
  return { data: (data || []) as DemandSignal[], error: error?.message ?? null };
}

export async function getDemandTopicQueue(limit = 50): Promise<{ data: DemandTopicQueueItem[]; error: string | null }> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("demand_topic_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data: (data || []) as DemandTopicQueueItem[], error: error?.message ?? null };
}

export interface KeywordDecisionRow {
  id: string;
  keyword: string;
  status: string;
  rejection_reason: string | null;
  opportunity_score: number;
  created_at: string;
  research: {
    searchIntent: string;
    detectedEntity: string | null;
    searchDemandScore: number;
    competitionScore: number;
    competitionLevel: string;
    rankingOpportunityScore: number;
    evergreenScore: number;
    businessValueScore: number;
    knowledgeGapScore: number;
    entityConfidenceScore: number;
    entityConfidence: string;
    categoryFitScore: number;
    categorySlug: string;
    categoryLabel: string;
    categoryInScope: boolean;
    finalDecisionScore: number;
    decision: string;
    decisionReason: string;
    newsPenalty: number;
    celebrityPenalty: number;
    localPenalty: number;
  } | null;
}

export async function getKeywordDecisionReport(limit = 500, statusFilter?: string): Promise<{ data: KeywordDecisionRow[]; error: string | null }> {
  const supabase = createAdminClient();
  let query = supabase
    .from("demand_topic_queue")
    .select("id, keyword, status, rejection_reason, opportunity_score, created_at, metadata")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  const { data, error } = await query;

  if (error || !data) return { data: [], error: error?.message ?? null };

  const rows: KeywordDecisionRow[] = data.map((item) => {
    const meta = (item.metadata as Record<string, unknown>) || {};
    const research = (meta.keyword_research as KeywordDecisionRow["research"]) ?? null;
    return {
      id: item.id as string,
      keyword: item.keyword as string,
      status: item.status as string,
      rejection_reason: item.rejection_reason as string | null,
      opportunity_score: item.opportunity_score as number,
      created_at: item.created_at as string,
      research,
    };
  });

  return { data: rows, error: null };
}

export async function getDemandClusters(limit = 50): Promise<{ data: DemandTopicCluster[]; error: string | null }> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("demand_topic_clusters")
    .select("*")
    .order("opportunity_score", { ascending: false })
    .limit(limit);
  return { data: (data || []) as DemandTopicCluster[], error: error?.message ?? null };
}

export async function getSystemStatus(): Promise<{ status: SystemStatus }> {
  const supabase = createAdminClient();
  const config = await getAutomationConfig();

  const [queueSize, failedJobs, lastCron, lastPublish] = await Promise.all([
    safeCount(async () => supabase.from("content_generation_queue").select("*", { count: "exact", head: true }).eq("status", "pending")),
    safeCount(async () => supabase.from("execution_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())),
    safeData(async () => supabase.from("system_events").select("created_at").eq("event_type", "cron").order("created_at", { ascending: false }).limit(1).maybeSingle(), null as SystemEvent | null),
    safeData(async () => supabase.from("system_events").select("created_at").eq("event_name", "jobs_execute").eq("status", "success").order("created_at", { ascending: false }).limit(1).maybeSingle(), null as SystemEvent | null),
  ]);

  return {
    status: {
      automationEnabled: config.automationEnabled,
      publishLimitPerRun: config.publishLimitPerRun,
      demandDiscoveryEnabled: config.demandDiscoveryEnabled,
      qualityGateEnabled: config.qualityGateEnabled,
      queueSize,
      failedJobs,
      lastCronRun: lastCron?.created_at ?? null,
      lastSuccessfulPublish: lastPublish?.created_at ?? null,
    },
  };
}

export interface OwnerDashboardData {
  stats: {
    totalArticles: number;
    totalTopics: number;
    totalCollections: number;
    totalCategories: number;
    publishedToday: number;
    pendingReview: number;
  };
  system: {
    healthy: boolean;
    automationEnabled: boolean;
    publishLimitPerRun: number;
    failedJobs: number;
    lastPublish: string | null;
    errorMessage: string | null;
  };
  notifications: Array<{ type: "success" | "warning" | "error"; message: string }>;
}

export async function getOwnerDashboardData(): Promise<OwnerDashboardData> {
  const supabase = createAdminClient();
  const config = await getAutomationConfig();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalArticles, totalTopics, totalCollections, totalCategories,
    publishedToday, pendingReview, failedJobs, lastPublish,
  ] = await Promise.all([
    safeCount(async () => supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published")),
    safeCount(async () => supabase.from("topics").select("*", { count: "exact", head: true }).eq("status", "published")),
    safeCount(async () => supabase.from("collections").select("*", { count: "exact", head: true })),
    safeCount(async () => supabase.from("categories").select("*", { count: "exact", head: true })),
    safeCount(async () => supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published").gte("created_at", todayStart.toISOString())),
    safeCount(async () => supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "review")),
    safeCount(async () => supabase.from("execution_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())),
    safeData(async () => supabase.from("system_events").select("created_at").eq("event_name", "jobs_execute").eq("status", "success").order("created_at", { ascending: false }).limit(1).maybeSingle(), null as { created_at: string } | null),
  ]);

  const healthy = failedJobs === 0 && config.automationEnabled;
  const notifications: OwnerDashboardData["notifications"] = [];

  if (publishedToday > 0) notifications.push({ type: "success", message: `${publishedToday} article${publishedToday !== 1 ? "s" : ""} published today.` });
  if (pendingReview > 0) notifications.push({ type: "warning", message: `${pendingReview} article${pendingReview !== 1 ? "s" : ""} require manual review.` });
  if (failedJobs > 0) notifications.push({ type: "error", message: `Publishing paused — ${failedJobs} error${failedJobs !== 1 ? "s" : ""} in the last 24 hours.` });
  if (!config.automationEnabled) notifications.push({ type: "warning", message: "Automation is currently paused." });

  return {
    stats: { totalArticles, totalTopics, totalCollections, totalCategories, publishedToday, pendingReview },
    system: {
      healthy,
      automationEnabled: config.automationEnabled,
      publishLimitPerRun: config.publishLimitPerRun,
      failedJobs,
      lastPublish: lastPublish?.created_at ?? null,
      errorMessage: failedJobs > 0 ? `${failedJobs} failed job${failedJobs !== 1 ? "s" : ""} in the last 24 h` : null,
    },
    notifications,
  };
}

export async function getPublishingMetrics(): Promise<{ metrics: PublishingMetrics }> {
  const supabase = createAdminClient();

  const [drafts, published, archived, updateQueue, lifecycleData] = await Promise.all([
    safeCount(async () => supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft")),
    safeCount(async () => supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published")),
    safeCount(async () => supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "archived")),
    safeCount(async () => supabase.from("content_update_queue").select("*", { count: "exact", head: true }).eq("status", "pending")),
    safeData(async () => supabase.from("articles").select("lifecycle_status"), [] as { lifecycle_status: string }[]),
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
  for (const row of lifecycleData) {
    const status = row.lifecycle_status as ArticleLifecycleStatus;
    if (status in lifecycle) lifecycle[status]++;
  }

  return {
    metrics: {
      drafts,
      published,
      archived,
      updateQueue,
      lifecycle,
    },
  };
}
