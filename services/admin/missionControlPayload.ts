/**
 * Mission Control payload — all metrics from production Supabase.
 * External integrations (GSC, AdSense) report missing wiring explicitly.
 */

import { createAdminClient } from "@/lib/env";
import { getAutomationConfig } from "@/services/system/settings";

type SB = ReturnType<typeof createAdminClient>;

async function countEq(
  sb: SB,
  table: string,
  filters?: Record<string, string | string[]>
): Promise<number> {
  try {
    let q = sb.from(table).select("*", { count: "exact", head: true });
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (Array.isArray(v)) q = q.in(k, v);
        else q = q.eq(k, v);
      }
    }
    const { count, error } = await q;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countGte(
  sb: SB,
  table: string,
  column: string,
  iso: string,
  extra?: Record<string, string>
): Promise<number> {
  try {
    let q = sb.from(table).select("*", { count: "exact", head: true }).gte(column, iso);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) q = q.eq(k, v);
    }
    const { count, error } = await q;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function daysAgo(d: number) {
  return new Date(Date.now() - d * 86400_000).toISOString();
}

function slugTitle(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function sumAffiliateRevenue(sb: SB, sinceIso: string) {
  const { data, error } = await sb
    .from("affiliate_conversions")
    .select("estimated_revenue, affiliate_product_id")
    .gte("recorded_at", sinceIso);
  if (error) return { total: 0, conversions: 0, byProduct: {} as Record<string, number> };
  let total = 0;
  const byProduct: Record<string, number> = {};
  for (const row of data ?? []) {
    const rev = Number(row.estimated_revenue ?? 0);
    total += rev;
    const pid = String(row.affiliate_product_id ?? "unknown");
    byProduct[pid] = (byProduct[pid] ?? 0) + rev;
  }
  return { total, conversions: data?.length ?? 0, byProduct };
}

async function sumAffiliateClicks(sb: SB, sinceIso: string) {
  const { data, error } = await sb
    .from("performance_metrics")
    .select("value")
    .eq("metric_type", "affiliate_click")
    .gte("recorded_at", sinceIso);
  if (error) return 0;
  return (data ?? []).reduce((s, r) => s + Number(r.value ?? 0), 0);
}

export async function buildMissionControlPayload() {
  const sb = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();
  const weekIso = daysAgo(7);
  const monthIso = daysAgo(30);

  const dbPingStart = Date.now();
  const { error: dbPingError } = await sb.from("topics").select("id").limit(1);
  const dbLatencyMs = Date.now() - dbPingStart;

  const [
    topicsPublished,
    topicsDraft,
    topicsToday,
    packagesReady,
    packagesArchived,
    packagesToday,
    packagesUpgradedToday,
    assetsPending,
    assetsAccepted,
    assetsError,
    assetsToday,
    assetsRejectedToday,
    factsTotal,
    factsToday,
    citationsTotal,
    relationshipsTotal,
    relationshipsToday,
    entitiesTotal,
    entitiesToday,
    renderedPublished,
    renderedDraft,
    renderedPending,
    renderedToday,
    sourcesActive,
    sourcesPaused,
    queuePending,
    queueFailed,
    queueInProgress,
    recentTopics,
    recentPackages,
    recentAssets,
    categoryRows,
    sourceRows,
    failedAssets,
    thinTopicsSample,
    strongTopicsSample,
    closestWorldClassSample,
    topGraphNodes,
    growingGraphNodes,
    graphTypeSample,
    failedQueueJobs,
    pubLogs,
    pkgStatsRes,
    topicCatsRes,
    inProgressJobs,
    lastLearnerEvent,
    lastCronEvent,
    lastJobsEvent,
    revenueToday,
    revenueWeek,
    revenueMonth,
    clicksToday,
    clicksWeek,
    gscSignals,
    automationConfig,
  ] = await Promise.all([
    countEq(sb, "topics", { status: "published" }),
    countEq(sb, "topics", { status: "draft" }),
    countGte(sb, "topics", "updated_at", todayIso, { status: "published" }),
    countEq(sb, "knowledge_packages", { status: "ready" }),
    countEq(sb, "knowledge_packages", { status: "archived" }),
    countGte(sb, "knowledge_packages", "created_at", todayIso),
    countGte(sb, "knowledge_packages", "updated_at", todayIso),
    countEq(sb, "knowledge_assets", { status: "pending" }),
    countEq(sb, "knowledge_assets", { status: "accepted" }),
    countEq(sb, "knowledge_assets", { status: "error" }),
    countGte(sb, "knowledge_assets", "created_at", todayIso),
    (async () => {
      const { count } = await sb
        .from("knowledge_assets")
        .select("*", { count: "exact", head: true })
        .eq("status", "error")
        .gte("created_at", todayIso);
      return count ?? 0;
    })(),
    countEq(sb, "knowledge_facts"),
    countGte(sb, "knowledge_facts", "created_at", todayIso),
    countEq(sb, "knowledge_citations"),
    countEq(sb, "knowledge_relationships"),
    countGte(sb, "knowledge_relationships", "created_at", todayIso),
    countEq(sb, "knowledge_graph_nodes"),
    countGte(sb, "knowledge_graph_nodes", "created_at", todayIso),
    countEq(sb, "rendered_outputs", { status: "published" }),
    countEq(sb, "rendered_outputs", { status: "draft" }),
    countEq(sb, "rendered_outputs", { status: "pending" }),
    countGte(sb, "rendered_outputs", "created_at", todayIso, { status: "published" }),
    countEq(sb, "discovery_system_sources", { status: "active" }),
    countEq(sb, "discovery_system_sources", { status: "paused" }),
    countEq(sb, "update_queue", { status: "pending" }),
    countEq(sb, "update_queue", { status: "failed" }),
    countEq(sb, "update_queue", { status: "in_progress" }),
    sb
      .from("topics")
      .select("id, slug, updated_at, topic_translations(title)")
      .eq("status", "published")
      .eq("topic_translations.language_code", "en")
      .order("updated_at", { ascending: false })
      .limit(8),
    sb
      .from("knowledge_packages")
      .select("id, slug, fact_count, status, created_at, last_verified_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(8),
    sb
      .from("knowledge_assets")
      .select("id, title, status, url, created_at, rejection_reason, source_id")
      .order("created_at", { ascending: false })
      .limit(10),
    sb.from("categories").select("id, slug, category_translations(name)").eq("category_translations.language_code", "en"),
    sb
      .from("discovery_system_sources")
      .select("id, name, url, status, source_type, last_fetched_at")
      .order("last_fetched_at", { ascending: false, nullsFirst: false })
      .limit(12),
    sb
      .from("knowledge_assets")
      .select("id, title, rejection_reason, created_at")
      .eq("status", "error")
      .order("created_at", { ascending: false })
      .limit(5),
    sb
      .from("knowledge_packages")
      .select("slug, fact_count, status")
      .eq("status", "ready")
      .order("fact_count", { ascending: true, nullsFirst: true })
      .limit(80),
    sb
      .from("knowledge_packages")
      .select("slug, fact_count, status")
      .eq("status", "ready")
      .order("fact_count", { ascending: false, nullsFirst: false })
      .limit(40),
    sb
      .from("knowledge_packages")
      .select("slug, fact_count, status")
      .eq("status", "ready")
      .gte("fact_count", 20)
      .lt("fact_count", 30)
      .order("fact_count", { ascending: false })
      .limit(20),
    sb
      .from("knowledge_graph_nodes")
      .select("slug, name, node_type, article_count, created_at")
      .order("article_count", { ascending: false, nullsFirst: false })
      .limit(12),
    sb
      .from("knowledge_graph_nodes")
      .select("slug, name, node_type, article_count, created_at")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false })
      .limit(8),
    sb
      .from("knowledge_graph_nodes")
      .select("node_type")
      .limit(2000),
    sb
      .from("update_queue")
      .select("id, object_id, object_type, job_type, error_message, created_at")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(5),
    sb
      .from("publication_logs")
      .select("id, topic_slug, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    sb.from("knowledge_packages").select("fact_count, status").eq("status", "ready").limit(500),
    sb
      .from("topics")
      .select("category_id")
      .eq("status", "published")
      .not("category_id", "is", null)
      .limit(2000),
    sb
      .from("update_queue")
      .select("id, object_id, object_type, job_type, status, started_at, error_message")
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(3),
    sb
      .from("system_events")
      .select("event_name, status, message, metadata, created_at")
      .or("event_name.eq.learning_run,event_name.eq.autonomous_learner,event_name.ilike.%learner%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("system_events")
      .select("created_at, status, event_name")
      .eq("event_type", "cron")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("system_events")
      .select("created_at, status")
      .eq("event_name", "jobs_execute")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sumAffiliateRevenue(sb, todayIso),
    sumAffiliateRevenue(sb, weekIso),
    sumAffiliateRevenue(sb, monthIso),
    sumAffiliateClicks(sb, todayIso),
    sumAffiliateClicks(sb, weekIso),
    sb
      .from("demand_signals")
      .select("id, keyword, opportunity_score, metadata, recorded_at")
      .eq("source_type", "search_console")
      .order("recorded_at", { ascending: false })
      .limit(20),
    getAutomationConfig(),
  ]);

  const pkgStats = pkgStatsRes.data ?? [];
  const topicCatRows = topicCatsRes.data ?? [];

  const catCountMap = new Map<string, number>();
  for (const row of topicCatRows) {
    if (!row.category_id) continue;
    catCountMap.set(row.category_id, (catCountMap.get(row.category_id) ?? 0) + 1);
  }
  const categories = (categoryRows.data ?? [])
    .map((cat) => {
      const name =
        (cat as { category_translations?: { name: string }[] }).category_translations?.[0]?.name ?? cat.slug;
      return { slug: cat.slug, name, topicCount: catCountMap.get(cat.id) ?? 0 };
    })
    .sort((a, b) => b.topicCount - a.topicCount);
  const categoryTotal = categories.reduce((s, c) => s + c.topicCount, 0);

  const thinTopics = (thinTopicsSample.data ?? [])
    .map((p) => ({
      slug: p.slug,
      title: slugTitle(p.slug),
      words: (p.fact_count ?? 0) * 40,
      factCount: p.fact_count ?? 0,
    }))
    .filter((t) => t.factCount < 15)
    .sort((a, b) => a.factCount - b.factCount)
    .slice(0, 20);

  const strongTopics = (strongTopicsSample.data ?? [])
    .map((p) => ({
      slug: p.slug,
      title: slugTitle(p.slug),
      factCount: p.fact_count ?? 0,
      href: `/en/topics/${p.slug}`,
    }))
    .slice(0, 20);

  const closestToWorldClass = (closestWorldClassSample.data ?? []).map((p) => ({
    slug: p.slug,
    title: slugTitle(p.slug),
    factCount: p.fact_count ?? 0,
    factsNeeded: Math.max(0, 30 - (p.fact_count ?? 0)),
    href: `/en/topics/${p.slug}`,
  }));

  const needingEnrichment = (thinTopicsSample.data ?? [])
    .filter((p) => (p.fact_count ?? 0) < 5)
    .slice(0, 20)
    .map((p) => ({
      slug: p.slug,
      title: slugTitle(p.slug),
      factCount: p.fact_count ?? 0,
      href: `/en/topics/${p.slug}`,
    }));

  let worldClass = 0,
    good = 0,
    average = 0,
    weak = 0,
    broken = 0;
  for (const p of pkgStats) {
    const f = p.fact_count ?? 0;
    if (f >= 30) worldClass++;
    else if (f >= 15) good++;
    else if (f >= 5) average++;
    else if (f >= 1) weak++;
    else broken++;
  }
  const qualityPool = worldClass + good + average + weak + broken || 1;
  const qualityScore = Math.round(
    (worldClass * 100 + good * 75 + average * 50 + weak * 25 + broken * 10) / qualityPool
  );

  const pipeline = [
    {
      id: "discovery",
      label: "Discovery",
      count: assetsPending,
      status: assetsPending > 0 ? "running" : "idle",
      href: "/admin/dashboard/discovery",
    },
    {
      id: "assets",
      label: "Knowledge Assets",
      count: assetsAccepted,
      status: assetsError > 0 ? "warn" : "healthy",
      href: "/admin/dashboard/discovery",
    },
    {
      id: "packages",
      label: "Knowledge Packages",
      count: packagesReady,
      status: "healthy",
      href: "/admin/dashboard/knowledge",
    },
    {
      id: "projection",
      label: "Projection / Render",
      count: renderedDraft + renderedPending,
      status: renderedDraft > 0 || renderedPending > 0 ? "running" : "idle",
      href: "/admin/dashboard/rendering",
    },
    {
      id: "publish",
      label: "Publication",
      count: renderedToday,
      status: renderedToday > 0 ? "running" : "idle",
      href: "/admin/dashboard/publishing",
    },
  ];

  const bottlenecks: {
    severity: "critical" | "high" | "medium";
    title: string;
    why: string;
    action: string;
    href: string;
    rootCause: string;
    businessImpact: string;
    publishingImpact: string;
    estimatedImprovement: string;
    recommendedAction: string;
    operation?: string;
  }[] = [];

  if (assetsError > 5) {
    bottlenecks.push({
      severity: "critical",
      title: "Asset processing failures",
      why: `${assetsError} knowledge assets in error status.`,
      action: "Retry failed assets",
      href: "/admin/dashboard/discovery",
      rootCause: "Ingest pipeline rejected or failed to normalize source content",
      businessImpact: `~${Math.min(assetsError, 30)} knowledge packages blocked from enrichment`,
      publishingImpact: `${assetsError} assets cannot become published topic updates`,
      estimatedImprovement: `Recover ${Math.min(assetsError, 30)} assets → unlock package upgrades`,
      recommendedAction: "Retry failed assets, then inspect rejection reasons",
      operation: "retry_failed_assets",
    });
  }
  if (assetsPending > 20) {
    bottlenecks.push({
      severity: "high",
      title: "Discovery backlog",
      why: `${assetsPending} pending assets waiting for pipeline.`,
      action: "Run discovery pipeline",
      href: "/admin/dashboard/automation",
      rootCause: "Asset queue depth exceeds processing throughput",
      businessImpact: `${assetsPending} potential topic improvements delayed`,
      publishingImpact: "New publications waiting on asset acceptance",
      estimatedImprovement: `Clear backlog → ${Math.min(assetsPending, 15)}+ packages could upgrade this week`,
      recommendedAction: "Run discovery and drain job queue",
      operation: "run_discovery",
    });
  }
  if (queueFailed > 0) {
    bottlenecks.push({
      severity: "high",
      title: "Job queue failures",
      why: `${queueFailed} jobs in update_queue failed.`,
      action: "Retry failed jobs",
      href: "/admin/dashboard/system-health",
      rootCause: "Background jobs timed out or hit validation errors",
      businessImpact: `~${queueFailed} package/topic updates stalled`,
      publishingImpact: `${queueFailed} publications or renders may be delayed`,
      estimatedImprovement: "Retry jobs → restore automated publishing flow",
      recommendedAction: "Retry failed jobs, then drain queue",
      operation: "retry_failed_jobs",
    });
  }
  if (weak + broken > 10) {
    bottlenecks.push({
      severity: "medium",
      title: "Weak knowledge coverage",
      why: `${weak + broken} packages below quality threshold.`,
      action: "Run autonomous learner",
      href: "/admin/dashboard/automation",
      rootCause: "Insufficient facts/citations on high-value topics",
      businessImpact: `${weak + broken} topics underperform in search and affiliate CTR`,
      publishingImpact: "Thin topics may not meet quality gate for auto-publish",
      estimatedImprovement: "Target weakest 5 topics → +15–30 facts each within 24h",
      recommendedAction: "Run autonomous learner on gap-driven targets",
      operation: "run_learner",
    });
  }
  if (sourcesActive < 3) {
    bottlenecks.push({
      severity: "high",
      title: "Too few active sources",
      why: `Only ${sourcesActive} active discovery sources.`,
      action: "Manage sources",
      href: "/admin/dashboard/sources",
      rootCause: "Discovery feed capacity below minimum operational threshold",
      businessImpact: "Knowledge acquisition rate limited — catalog growth slows",
      publishingImpact: "Fewer fresh assets → fewer publications",
      estimatedImprovement: "Add 2+ trusted feeds → 2× daily asset intake",
      recommendedAction: "Activate paused sources or add RSS feeds",
    });
  }
  if (bottlenecks.length === 0) {
    bottlenecks.push({
      severity: "medium",
      title: "No critical bottleneck",
      why: "Queues and sources operational.",
      action: "Review quality distribution",
      href: "/admin/dashboard/quality",
      rootCause: "All primary pipelines within normal operating range",
      businessImpact: "No immediate revenue or traffic risk detected",
      publishingImpact: "Publishing pipeline clear",
      estimatedImprovement: "Focus on moving Good → World Class topics",
      recommendedAction: "Run quality audit on topics closest to World Class",
    });
  }

  const health = {
    sources: sourcesActive > 0 ? "healthy" : "down",
    sourcesDetail: `${sourcesActive} active / ${sourcesPaused} paused`,
    assets: assetsError > 20 ? "degraded" : "healthy",
    assetsDetail: `${assetsPending} pending, ${assetsError} errors`,
    queue: queueFailed > 5 ? "degraded" : queueInProgress > 0 ? "busy" : "healthy",
    queueDetail: `${queuePending} pending, ${queueInProgress} running, ${queueFailed} failed`,
    packages: packagesReady > 0 ? "healthy" : "degraded",
    packagesDetail: `${packagesReady} ready, ${packagesArchived} archived`,
    graph: entitiesTotal > 0 ? "healthy" : "degraded",
    graphDetail: `${entitiesTotal} entities, ${relationshipsTotal} relationships`,
    publishing: dbPingError ? "down" : "healthy",
    publishingDetail: `${renderedToday} renders published today`,
    database: dbPingError ? "down" : dbLatencyMs > 500 ? "degraded" : "healthy",
    databaseDetail: dbPingError ? "Ping failed" : `${dbLatencyMs}ms latency`,
  };

  const activity: { id: string; type: string; message: string; at: string; href: string }[] = [];
  for (const a of recentAssets.data ?? []) {
    activity.push({
      id: `asset-${a.id}`,
      type: a.status === "error" ? "error" : "discovery",
      message:
        a.status === "error"
          ? `Asset failed: ${a.title?.slice(0, 60) ?? a.id}${a.rejection_reason ? ` — ${String(a.rejection_reason).slice(0, 80)}` : ""}`
          : `Asset ${a.status}: ${a.title?.slice(0, 70) ?? a.id}`,
      at: a.created_at,
      href: "/admin/dashboard/discovery",
    });
  }
  for (const p of recentPackages.data ?? []) {
    activity.push({
      id: `pkg-${p.id}`,
      type: "package",
      message: `Package ${p.status}: ${p.slug} (${p.fact_count ?? 0} facts)`,
      at: p.created_at,
      href: "/admin/dashboard/knowledge",
    });
  }
  for (const t of recentTopics.data ?? []) {
    const title = t.topic_translations?.[0]?.title ?? t.slug;
    activity.push({
      id: `topic-${t.id}`,
      type: "publish",
      message: `Topic updated: ${title}`,
      at: t.updated_at,
      href: `/en/topics/${t.slug}`,
    });
  }
  activity.sort((a, b) => new Date(b.at).getTime() - new Date(b.at).getTime());

  const affiliateConnected = revenueMonth.total > 0 || revenueMonth.conversions > 0 || clicksWeek > 0;
  const affiliateHasTable = revenueMonth.conversions >= 0;
  const ctrWeek = clicksWeek > 0 ? (revenueWeek.conversions / clicksWeek) * 100 : 0;
  const epcWeek = clicksWeek > 0 ? revenueWeek.total / clicksWeek : 0;

  const topProducts = Object.entries(revenueMonth.byProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productId, revenue]) => ({
      productId,
      revenue: Math.round(revenue * 100) / 100,
      href: "/admin/dashboard/analytics",
    }));

  const gscRows = gscSignals.data ?? [];
  const gscConnected = gscRows.length > 0;

  const inProgress = inProgressJobs.data?.[0];
  let currentTopicSlug: string | null = thinTopics[0]?.slug ?? null;
  if (inProgress?.object_type === "topic" && inProgress.object_id) {
    const { data: t } = await sb.from("topics").select("slug").eq("id", inProgress.object_id).maybeSingle();
    if (t?.slug) currentTopicSlug = t.slug;
  }

  const learnerRunning = queueInProgress > 0 || inProgress != null;
  const lastAsset = recentAssets.data?.[0];

  const topicsImprovedToday = (pubLogs.data ?? []).filter((l) => l.status === "published").length;

  const factTrendDays = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - (6 - i));
      dayStart.setHours(0, 0, 0, 0);
      return countGte(sb, "knowledge_facts", "created_at", dayStart.toISOString());
    })
  );

  const avgFactCount =
    pkgStats.length > 0
      ? Math.round((pkgStats.reduce((s, p) => s + (p.fact_count ?? 0), 0) / pkgStats.length) * 10) / 10
      : 0;

  const graphClusterMap = new Map<string, number>();
  for (const row of graphTypeSample.data ?? []) {
    const t = String(row.node_type ?? "entity");
    graphClusterMap.set(t, (graphClusterMap.get(t) ?? 0) + 1);
  }
  const graphClusters = [...graphClusterMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([type, count]) => ({ type, count }));

  const aiRecommendations: {
    text: string;
    severity: "critical" | "high" | "medium" | "info";
    href: string;
  }[] = [];

  const weakestCat = [...categories].sort((a, b) => a.topicCount - b.topicCount)[0];
  if (weakestCat && categoryTotal > 0 && weakestCat.pct < 5) {
    aiRecommendations.push({
      text: `${weakestCat.name} coverage is weak — only ${weakestCat.pct}% of catalog`,
      severity: "high",
      href: "/admin/dashboard/categories",
    });
  }
  const dominantCat = categories[0];
  if (dominantCat && dominantCat.pct > 35) {
    aiRecommendations.push({
      text: `${dominantCat.name} category dominates catalog at ${dominantCat.pct}%`,
      severity: "medium",
      href: "/admin/dashboard/categories",
    });
  }
  if (queuePending > 50) {
    aiRecommendations.push({
      text: `Discovery queue overloaded — ${queuePending} jobs pending`,
      severity: "critical",
      href: "/admin/dashboard/system-health",
    });
  }
  if (citationsTotal > 0 && factsToday > 0) {
    aiRecommendations.push({
      text: `Knowledge acquisition active — ${factsToday} facts and ${relationshipsToday} relationships added today`,
      severity: "info",
      href: "/admin/dashboard/knowledge",
    });
  }
  if (weak + broken > 15) {
    aiRecommendations.push({
      text: `${weak + broken} topics below quality threshold — prioritize autonomous learner`,
      severity: "high",
      href: "/admin/dashboard/automation",
    });
  }
  if (closestToWorldClass.length > 0) {
    aiRecommendations.push({
      text: `${closestToWorldClass.length} topics within reach of World Class — enrich next`,
      severity: "info",
      href: "/admin/dashboard/quality",
    });
  }
  if (!gscConnected) {
    aiRecommendations.push({
      text: "Search Console not connected — traffic blind spots on indexed pages",
      severity: "medium",
      href: "/admin/dashboard/seo",
    });
  }

  const packagesDelayed = queueFailed + Math.min(assetsPending, 50);
  const publicationsDelayed = queueFailed + renderedPending;

  const businessImpact = {
    packagesDelayed,
    publicationsDelayed,
    trafficImpact:
      topicsDraft > 0
        ? `${topicsDraft} draft topics not indexed — potential organic reach gap`
        : "All published topics eligible for indexing",
    revenueImpact: affiliateConnected
      ? `$${revenueMonth.total.toFixed(2)} affiliate MTD · EPC $${epcWeek.toFixed(2)}`
      : "Revenue tracking live — awaiting Amazon conversion sync",
    queueFailures: queueFailed,
    assetFailures: assetsError,
  };

  const projectedMonthly =
    revenueMonth.total > 0
      ? Math.round(revenueMonth.total * 100) / 100
      : revenueWeek.total > 0
        ? Math.round((revenueWeek.total / 7) * 30 * 100) / 100
        : 0;

  const rpmMonth =
    clicksWeek > 0 && revenueMonth.total > 0
      ? Math.round((revenueMonth.total / clicksWeek) * 1000 * 100) / 100
      : 0;

  const amazonConnected = Boolean(process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_KEY);
  const ga4Configured = Boolean(process.env.GA4_PROPERTY_ID || process.env.GOOGLE_ANALYTICS_PROPERTY_ID);
  const gscConfigured = Boolean(process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT || process.env.GSC_SITE_URL);
  const cloudflareConfigured = Boolean(process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN);
  const vercelConnected = Boolean(process.env.VERCEL || process.env.VERCEL_URL);

  const integrationsStatus = [
    {
      name: "Supabase",
      status: dbPingError ? "configuration_required" : "connected",
      detail: dbPingError ? "Database ping failed" : `${dbLatencyMs}ms latency`,
      href: "/admin/dashboard/system-health",
    },
    {
      name: "Google Search Console",
      status: gscConnected ? "connected" : gscConfigured ? "configuration_required" : "missing",
      detail: gscConnected ? "Partial signals via demand_signals" : "GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT + /api/cron/gsc-sync",
      href: "/admin/dashboard/seo",
    },
    {
      name: "Google Analytics 4",
      status: ga4Configured ? "configuration_required" : "missing",
      detail: "GA4_PROPERTY_ID + realtime sync job required",
      href: "/admin/dashboard/analytics",
    },
    {
      name: "Amazon Affiliate",
      status: amazonConnected ? "connected" : affiliateHasTable ? "configuration_required" : "missing",
      detail: amazonConnected ? "API keys configured" : "AMAZON_ACCESS_KEY + conversion sync",
      href: "/admin/dashboard/analytics",
    },
    {
      name: "Ad Network (AdSense)",
      status: process.env.ENABLE_ADSENSE === "true" ? "configuration_required" : "missing",
      detail: "ENABLE_ADSENSE + GOOGLE_ADSENSE_API revenue sync",
      href: "/admin/dashboard/settings",
    },
    {
      name: "Cloudflare",
      status: cloudflareConfigured ? "configuration_required" : "missing",
      detail: "CLOUDFLARE_API_TOKEN for edge analytics",
      href: "/admin/dashboard/settings",
    },
    {
      name: "Bing Webmaster",
      status: "missing",
      detail: "BING_WEBMASTER_API_KEY + sync cron not configured",
      href: "/admin/dashboard/seo",
    },
    {
      name: "Vercel",
      status: vercelConnected ? "connected" : "missing",
      detail: vercelConnected ? "Deployed on Vercel" : "Runtime metrics via Vercel dashboard",
      href: "/admin/dashboard/system-health",
    },
    {
      name: "GitHub",
      status: process.env.GITHUB_TOKEN ? "connected" : "missing",
      detail: process.env.GITHUB_TOKEN ? "CI/deploy token configured" : "GITHUB_TOKEN for deploy hooks",
      href: "/admin/dashboard/settings",
    },
  ] as const;

  const failedQueueItems = await Promise.all(
    (failedQueueJobs.data ?? []).map(async (job) => {
      let href = "/admin/dashboard/system-health";
      let label = job.job_type ?? "job";
      if (job.object_type === "topic" && job.object_id) {
        const { data: t } = await sb.from("topics").select("slug").eq("id", job.object_id).maybeSingle();
        if (t?.slug) {
          href = `/en/topics/${t.slug}`;
          label = t.slug;
        }
      } else if (job.object_type === "knowledge_package" && job.object_id) {
        href = "/admin/dashboard/knowledge";
        label = String(job.object_id).slice(0, 8);
      }
      return {
        id: job.id,
        type: job.object_type ?? "unknown",
        label,
        error: job.error_message,
        at: job.created_at,
        href,
      };
    })
  );

  const ceoSummary = {
    headline:
      topicsToday > 0 || packagesToday > 0
        ? `Knowledge factory active — ${topicsToday} topics touched, ${packagesToday} packages created today`
        : queueFailed > 0
          ? `${queueFailed} failed jobs blocking ${publicationsDelayed} potential publications — action required`
          : "Quiet growth window — trigger autonomous learner on weakest topics",
    businessImpact,
    growthToday: {
      topics: topicsToday,
      packages: packagesToday,
      assets: assetsToday,
      publishedRenders: renderedToday,
    },
    trustSignal:
      citationsTotal > 0
        ? `${citationsTotal} citations across knowledge packages`
        : "Citations sparse — prioritize authoritative sources",
    improvedToday: [
      topicsToday > 0 && `${topicsToday} topics updated`,
      packagesToday > 0 && `${packagesToday} new packages`,
      factsToday > 0 && `${factsToday} facts added`,
      renderedToday > 0 && `${renderedToday} publishes`,
    ].filter(Boolean) as string[],
    failedToday: [
      queueFailed > 0 && `${queueFailed} failed jobs — ~${packagesDelayed} package updates delayed`,
      assetsError > 0 && `${assetsError} asset errors blocking enrichment`,
      assetsRejectedToday > 0 && `${assetsRejectedToday} assets rejected today`,
    ].filter(Boolean) as string[],
    blocked: bottlenecks.filter((b) => b.severity === "critical" || b.severity === "high").map((b) => b.title),
    earning: affiliateConnected
      ? `$${revenueToday.total.toFixed(2)} affiliate revenue today`
      : "Affiliate tracking live — awaiting conversion data",
    needsAttention: bottlenecks.slice(0, 3).map((b) => b.title),
    recommendedActions: bottlenecks.slice(0, 3).map((b) => ({
      label: b.action,
      href: b.href,
      severity: b.severity,
    })),
  };

  return {
    generatedAt: new Date().toISOString(),
    live: !dbPingError,
    metrics: {
      topicsPublished,
      topicsDraft,
      topicsToday,
      packagesReady,
      packagesToday,
      entities: entitiesTotal,
      facts: factsTotal,
      citations: citationsTotal,
      relationships: relationshipsTotal,
      assetsPending,
      assetsAccepted,
      assetsError,
      assetsToday,
      renderedPublished,
      renderedToday,
      sourcesActive,
      sourcesPaused,
      queuePending,
      queueFailed,
      queueInProgress,
      qualityScore,
      qualityDistribution: {
        worldClass,
        good,
        average,
        weak,
        broken,
        excellent: worldClass,
        poor: weak + broken,
        total: qualityPool,
      },
    },
    pipeline,
    categories: categories.map((c) => ({
      ...c,
      pct: categoryTotal ? Math.round((c.topicCount / categoryTotal) * 1000) / 10 : 0,
      href: `/admin/dashboard/categories`,
    })),
    sources: (sourceRows.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      status: s.status,
      type: s.source_type,
      lastFetched: s.last_fetched_at,
      href: "/admin/dashboard/sources",
    })),
    thinTopics: thinTopics.map((t) => ({ ...t, href: `/en/topics/${t.slug}` })),
    strongTopics,
    failedAssets: (failedAssets.data ?? []).map((f) => ({
      id: f.id,
      title: f.title,
      reason: f.rejection_reason,
      at: f.created_at,
      href: "/admin/dashboard/discovery",
    })),
    recentPublished: (recentTopics.data ?? []).map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.topic_translations?.[0]?.title ?? t.slug,
      updatedAt: t.updated_at,
      href: `/en/topics/${t.slug}`,
    })),
    publicationLogs: (pubLogs.error ? [] : pubLogs.data ?? []).map((l) => ({
      id: l.id,
      slug: l.topic_slug,
      status: l.status,
      at: l.created_at,
      href: `/en/topics/${l.topic_slug}`,
    })),
    health,
    bottlenecks,
    activity: activity.slice(0, 20),
    ceoSummary,
    knowledgeGrowth: {
      factsToday,
      entitiesToday,
      relationshipsToday,
      packagesUpgradedToday,
      packagesCreatedToday: packagesToday,
      topicsImprovedToday,
      topicsRejectedToday: assetsRejectedToday,
      knowledgeAccumulated: factsTotal,
      awaitingEnrichment: weak + broken,
      factTrend: factTrendDays,
      richnessTrend: avgFactCount,
      avgFactsPerPackage: avgFactCount,
      href: "/admin/dashboard/knowledge",
    },
    revenue: {
      connected: affiliateHasTable,
      missingIntegrations: [
        "Google AdSense API (ad revenue)",
        ...(gscConnected ? [] : ["Google Search Console API (organic search metrics)"]),
      ],
      affiliate: {
        available: affiliateHasTable,
        totalToday: Math.round(revenueToday.total * 100) / 100,
        totalWeek: Math.round(revenueWeek.total * 100) / 100,
        totalMonth: Math.round(revenueMonth.total * 100) / 100,
        clicksToday,
        clicksWeek,
        conversionsToday: revenueToday.conversions,
        conversionsWeek: revenueWeek.conversions,
        conversionsMonth: revenueMonth.conversions,
        epc: Math.round(epcWeek * 100) / 100,
        ctr: Math.round(ctrWeek * 100) / 100,
        topProducts,
        revenuePerCategory: categories.slice(0, 5).map((c) => ({
          category: c.name,
          slug: c.slug,
          topics: c.topicCount,
          href: "/admin/dashboard/categories",
        })),
        trend: [
          revenueToday.total,
          revenueWeek.total / 7,
          revenueMonth.total / 30,
        ].map((v) => Math.round(v * 100) / 100),
        href: "/admin/dashboard/analytics",
      },
      ads: {
        available: false,
        missingIntegration: "GOOGLE_ADSENSE_API_KEY + revenue sync job",
        totalToday: 0,
        totalMonth: 0,
        href: "/admin/dashboard/settings",
      },
      totalToday: Math.round(revenueToday.total * 100) / 100,
      totalWeek: Math.round(revenueWeek.total * 100) / 100,
      totalMonth: Math.round(revenueMonth.total * 100) / 100,
      projectedMonthly,
      rpm: rpmMonth,
    },
    trafficCommandCenter: {
      searchConsole: {
        connected: gscConnected,
        missingIntegration: gscConnected
          ? null
          : "GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT + GSC sync cron (/api/cron/gsc-sync)",
        indexedPages: gscConnected ? gscRows.length : topicsPublished,
        pagesDiscovered: topicsPublished + topicsDraft,
        pagesCrawled: topicsPublished,
        pagesNotIndexed: topicsDraft,
        impressions: gscConnected ? 0 : null,
        clicks: gscConnected ? 0 : null,
        ctr: gscConnected ? 0 : null,
        averagePosition: gscConnected ? 0 : null,
        topWinners: gscRows.slice(0, 5).map((r) => ({
          keyword: r.keyword,
          score: r.opportunity_score,
          href: "/admin/dashboard/seo",
        })),
        topLosers: [] as { keyword: string; score: number; href: string }[],
        coverageErrors: [] as string[],
        href: "/admin/dashboard/seo",
      },
      googleAnalytics: {
        connected: false,
        status: ga4Configured ? "configuration_required" : "missing",
        missingIntegration: "GA4_PROPERTY_ID + GA4 Data API sync job",
        href: "/admin/dashboard/analytics",
      },
      bingWebmaster: {
        connected: false,
        status: "missing" as const,
        missingIntegration: "BING_WEBMASTER_API_KEY + sync cron",
        href: "/admin/dashboard/seo",
      },
      cloudflare: {
        connected: false,
        status: cloudflareConfigured ? "configuration_required" : "missing",
        missingIntegration: "CLOUDFLARE_API_TOKEN for edge analytics",
        href: "/admin/dashboard/settings",
      },
    },
    searchConsole: {
      connected: gscConnected,
      missingIntegration: gscConnected
        ? null
        : "GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT + GSC sync cron (/api/cron/gsc-sync)",
      indexedPages: gscConnected ? gscRows.length : topicsPublished,
      pagesDiscovered: topicsPublished + topicsDraft,
      pagesCrawled: topicsPublished,
      pagesNotIndexed: topicsDraft,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      averagePosition: 0,
      topWinners: gscRows.slice(0, 5).map((r) => ({
        keyword: r.keyword,
        score: r.opportunity_score,
        href: "/admin/dashboard/seo",
      })),
      topLosers: [],
      coverageErrors: [],
      href: "/admin/dashboard/seo",
    },
    autonomousLearning: {
      status: learnerRunning ? "running" : "idle",
      currentTopic: currentTopicSlug,
      currentSource: lastAsset?.title ?? lastAsset?.url ?? null,
      currentStage: inProgress?.job_type ?? (learnerRunning ? "processing" : "waiting"),
      estimatedCompletion: null,
      queueDepth: queuePending,
      nextTopic: thinTopics[1]?.slug ?? thinTopics[0]?.slug ?? null,
      lastRunAt: lastLearnerEvent.data?.created_at ?? lastCronEvent.data?.created_at ?? null,
      lastRunStatus: lastLearnerEvent.data?.status ?? null,
      href: "/admin/dashboard/automation",
    },
    productionMonitoring: {
      crons: [
        {
          path: "/api/cron/autonomous-learner",
          schedule: "0 */3 * * *",
          purpose: "Gap-driven learning",
          lastRun: lastCronEvent.data?.created_at ?? null,
          status: lastCronEvent.data?.status ?? "unknown",
          href: "/admin/dashboard/automation",
        },
        {
          path: "/api/jobs/execute",
          schedule: "30 */6 * * *",
          purpose: "Drain job queue",
          lastRun: lastJobsEvent.data?.created_at ?? null,
          status: lastJobsEvent.data?.status ?? "unknown",
          href: "/admin/dashboard/logs",
        },
      ],
      database: {
        status: health.database,
        latencyMs: dbLatencyMs,
        href: "/admin/dashboard/system-health",
      },
      supabase: { status: health.database, latencyMs: dbLatencyMs },
      storage: {
        available: false,
        note: "Supabase storage metrics — connect via Supabase Management API",
        href: "/admin/dashboard/system-health",
      },
      workers: {
        pending: queuePending,
        running: queueInProgress,
        failed: queueFailed,
        href: "/admin/dashboard/system-health",
      },
      platform: {
        cpu: null,
        memory: null,
        note: "Vercel serverless — host CPU/RAM via Vercel dashboard",
      },
      responseTimeMs: dbLatencyMs,
      errors: assetsError + queueFailed,
      warnings: bottlenecks.filter((b) => b.severity !== "medium").length,
      href: "/admin/dashboard/system-health",
    },
    workers: {
      updateQueuePending: queuePending,
      updateQueueRunning: queueInProgress,
      updateQueueFailed: queueFailed,
      crons: [
        { path: "/api/cron/autonomous-learner", schedule: "every 3 hours", purpose: "Gap-driven learning" },
        { path: "/api/jobs/execute", schedule: "every 6 hours", purpose: "Drain job queue" },
      ],
    },
    trust: {
      citationCount: citationsTotal,
      lastVerifiedPackages: (recentPackages.data ?? []).filter((p) => p.last_verified_at).length,
    },
    seo: {
      note: gscConnected ? "Partial GSC signals from demand_signals" : "Full GSC requires API integration",
      topicsIndexedEstimate: topicsPublished,
      available: gscConnected,
      href: "/admin/dashboard/seo",
    },
    integrationsMissing: integrationsStatus
      .filter((i) => i.status === "missing" || i.status === "configuration_required")
      .map((i) => i.name),
    integrationsStatus: [...integrationsStatus],
    aiRecommendations,
    operations: {
      automationEnabled: automationConfig.automationEnabled,
      href: "/admin/dashboard/automation",
    },
    failedQueueItems,
    closestToWorldClass,
    needingEnrichment,
    knowledgeGraph: {
      entities: entitiesTotal,
      relationships: relationshipsTotal,
      entitiesToday,
      growthPct: entitiesTotal > 0 ? Math.round((entitiesToday / entitiesTotal) * 10000) / 100 : 0,
      mostConnected: (topGraphNodes.data ?? []).map((n) => ({
        slug: n.slug,
        name: n.name,
        connections: n.article_count ?? 0,
        href: `/en/entities/${n.slug}`,
      })),
      fastestGrowing: (growingGraphNodes.data ?? []).map((n) => ({
        slug: n.slug,
        name: n.name,
        connections: n.article_count ?? 0,
        href: `/en/entities/${n.slug}`,
      })),
      clusters: graphClusters,
      href: "/admin/dashboard/knowledge",
    },
  };
}
