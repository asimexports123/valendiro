import { createClient } from "@/lib/supabase/server";
import { ContentHealthScore, KnowledgeObjectType, SupportedLanguage } from "@/lib/types";
import { enqueueContentUpdate } from "@/services/intelligence/contentDecisionEngine";

export interface AutoOptimizationResult {
  requeued: number;
  lowHealth: number;
  seoDecay: number;
  highPotential: number;
  errors: string[];
}

export async function runAutoOptimization(limitPerReason = 25): Promise<AutoOptimizationResult> {
  const supabase = await createClient();
  const result: AutoOptimizationResult = { requeued: 0, lowHealth: 0, seoDecay: 0, highPotential: 0, errors: [] };

  // 1. Requeue low health content
  const { data: lowHealth } = await supabase
    .from("content_health_scores")
    .select("*")
    .lt("overall_health_score", 50)
    .order("overall_health_score", { ascending: true })
    .limit(limitPerReason);

  for (const item of (lowHealth || []) as ContentHealthScore[]) {
    const reason = buildLowHealthReason(item);
    const enqueue = await enqueueContentUpdate(
      item.object_id,
      item.object_type,
      reason,
      calculateRequeuePriority(item),
      { optimization_source: "low_health", health_score: item.overall_health_score }
    );
    if (enqueue.error) result.errors.push(enqueue.error);
    else { result.requeued++; result.lowHealth++; }
  }

  // 2. Detect SEO decay (low SEO score, old content)
  const { data: seoDecay } = await supabase
    .from("content_health_scores")
    .select("*")
    .lt("seo_score", 40)
    .lt("freshness_score", 60)
    .order("seo_score", { ascending: true })
    .limit(limitPerReason);

  for (const item of (seoDecay || []) as ContentHealthScore[]) {
    const enqueue = await enqueueContentUpdate(
      item.object_id,
      item.object_type,
      "SEO decay detected: missing metadata, weak structure, or stale content.",
      calculateRequeuePriority(item) + 5,
      { optimization_source: "seo_decay", seo_score: item.seo_score, freshness_score: item.freshness_score }
    );
    if (enqueue.error) result.errors.push(enqueue.error);
    else { result.requeued++; result.seoDecay++; }
  }

  // 3. Requeue high affiliate potential with low revenue score
  const { data: highPotential } = await supabase
    .from("content_health_scores")
    .select("*, content_scores!inner(affiliate_potential_score)")
    .gt("content_scores.affiliate_potential_score", 70)
    .lt("revenue_score", 40)
    .order("revenue_score", { ascending: true })
    .limit(limitPerReason);

  for (const row of highPotential || []) {
    const item = row as ContentHealthScore & { content_scores: { affiliate_potential_score: number } };
    const enqueue = await enqueueContentUpdate(
      item.object_id,
      item.object_type,
      "High affiliate potential but under-monetized: optimize product placement and CTAs.",
      80,
      { optimization_source: "affiliate_potential", affiliate_potential_score: item.content_scores.affiliate_potential_score, revenue_score: item.revenue_score }
    );
    if (enqueue.error) result.errors.push(enqueue.error);
    else { result.requeued++; result.highPotential++; }
  }

  return result;
}

function buildLowHealthReason(item: ContentHealthScore): string {
  const parts: string[] = [];
  if (item.seo_score < 40) parts.push("weak SEO");
  if (item.engagement_score < 40) parts.push("low engagement");
  if (item.revenue_score < 40) parts.push("under-monetized");
  if (item.freshness_score < 40) parts.push("stale content");
  if (parts.length === 0) parts.push("overall health below threshold");
  return `Low health content: ${parts.join(", ")}. Re-optimize for SEO, engagement, and conversion.`;
}

function calculateRequeuePriority(item: ContentHealthScore): number {
  return Math.min(95, Math.round(100 - item.overall_health_score + 10));
}
