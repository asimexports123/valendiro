import { createAdminClient } from "@/lib/supabase/admin";
import { DemandTopicQueueItem } from "@/lib/types";

export interface QueueFilterResult {
  queued: number;
  rejected: number;
  duplicates: number;
  cannibalized: number;
  errors: string[];
}

function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .sort()
    .join(" ");
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(normalizeKeyword(a).split(" "));
  const wordsB = new Set(normalizeKeyword(b).split(" "));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  return Math.max(intersection.size / Math.min(wordsA.size, wordsB.size), 0);
}

function isDuplicate(keyword: string, existing: string[]): boolean {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return false;
  return existing.some((e) => normalizeKeyword(e) === normalized);
}

function isCannibalized(keyword: string, existing: string[]): boolean {
  return existing.some((e) => wordOverlap(keyword, e) >= 0.7);
}

export async function buildDemandTopicQueue(
  minOpportunityScore = 45,
  maxQueueSize = 100
): Promise<QueueFilterResult> {
  const supabase = createAdminClient();
  const result: QueueFilterResult = { queued: 0, rejected: 0, duplicates: 0, cannibalized: 0, errors: [] };

  const { data: clusters, error } = await supabase
    .from("demand_topic_clusters")
    .select("*")
    .eq("status", "pending")
    .gte("opportunity_score", minOpportunityScore)
    .order("opportunity_score", { ascending: false })
    .limit(maxQueueSize);

  if (error || !clusters) {
    result.errors.push(error?.message || "No clusters found");
    return result;
  }

  const clusterIds = clusters.map((c) => c.id as string);
  const { data: clusterSignals } = await supabase
    .from("demand_signals")
    .select("id, cluster_id")
    .in("cluster_id", clusterIds);
  const signalIdByCluster = new Map((clusterSignals || []).map((s) => [s.cluster_id as string, s.id as string]));

  const { data: existingTopics } = await supabase
    .from("topic_translations")
    .select("title")
    .eq("language_code", "en");
  const existingTitles = (existingTopics || []).map((t) => t.title as string);

  const { data: existingQueued } = await supabase
    .from("demand_topic_queue")
    .select("keyword")
    .in("status", ["pending", "approved"]);
  const existingKeywords = (existingQueued || []).map((q) => q.keyword as string);

  const allExistingKeywords = [...existingTitles, ...existingKeywords];

  for (const cluster of clusters) {
    const demandSignalId = signalIdByCluster.get(cluster.id as string);
    if (!demandSignalId) {
      result.rejected++;
      continue;
    }

    const keywords = (cluster.keywords || []) as string[];
    const bestKeyword = (cluster.seed_keyword as string) || keywords[0] || "untitled";
    const title = bestKeyword.charAt(0).toUpperCase() + bestKeyword.slice(1);
    const description = `Cluster covering ${keywords.slice(0, 5).join(", ")}`;

    if (isDuplicate(bestKeyword, allExistingKeywords)) {
      result.duplicates++;
      await supabase
        .from("demand_topic_queue")
        .insert({
          demand_signal_id: demandSignalId,
          cluster_id: cluster.id,
          collection_id: cluster.collection_id,
          keyword: bestKeyword,
          title,
          description,
          search_intent: "informational",
          category: cluster.category || "General",
          language_code: "en",
          demand_score: cluster.demand_score,
          competition_score: cluster.competition_score,
          opportunity_score: cluster.opportunity_score,
          status: "duplicate",
          rejection_reason: "Exact duplicate of existing topic or queued keyword",
        });
      continue;
    }

    if (isCannibalized(bestKeyword, allExistingKeywords)) {
      result.cannibalized++;
      await supabase
        .from("demand_topic_queue")
        .insert({
          demand_signal_id: demandSignalId,
          cluster_id: cluster.id,
          collection_id: cluster.collection_id,
          keyword: bestKeyword,
          title,
          description,
          search_intent: "informational",
          category: cluster.category || "General",
          language_code: "en",
          demand_score: cluster.demand_score,
          competition_score: cluster.competition_score,
          opportunity_score: cluster.opportunity_score,
          status: "cannibalized",
          rejection_reason: "High overlap with existing topic would cannibalize traffic",
        });
      continue;
    }

    try {
      const { error: insertError } = await supabase.from("demand_topic_queue").insert({
        demand_signal_id: demandSignalId,
        cluster_id: cluster.id,
        collection_id: cluster.collection_id,
        keyword: bestKeyword,
        title,
        description,
        search_intent: "informational",
        category: cluster.category || "General",
        language_code: "en",
        demand_score: cluster.demand_score,
        competition_score: cluster.competition_score,
        opportunity_score: cluster.opportunity_score,
        status: "pending",
      });

      if (insertError) {
        result.errors.push(insertError.message);
        result.rejected++;
      } else {
        result.queued++;
        allExistingKeywords.push(bestKeyword);

        await supabase
          .from("demand_topic_clusters")
          .update({ status: "approved" })
          .eq("id", cluster.id);
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : "Queue insert error");
      result.rejected++;
    }
  }

  return result;
}

export async function approveDemandTopicQueueItems(limit = 20): Promise<DemandTopicQueueItem[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("demand_topic_queue")
    .select("*")
    .eq("status", "pending")
    .order("opportunity_score", { ascending: false })
    .limit(limit);
  return (data || []) as DemandTopicQueueItem[];
}
