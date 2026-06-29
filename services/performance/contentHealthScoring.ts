import { createClient } from "@/lib/supabase/server";
import { ContentHealthScore, KnowledgeObjectType, SupportedLanguage } from "@/lib/types";

export interface HealthScoringResult {
  calculated: number;
  error: string | null;
}

interface ObjectMetrics {
  views: number;
  uniqueViews: number;
  clickThroughs: number;
  affiliateClicks: number;
  bounceRate: number;
  avgTime: number;
  ageDays: number;
  wordCount: number;
  internalLinks: number;
  affiliateLinks: number;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function calculateSeoScore(metrics: ObjectMetrics): number {
  let score = 40;
  if (metrics.hasMetaTitle) score += 15;
  if (metrics.hasMetaDescription) score += 15;
  if (metrics.wordCount >= 300) score += 10;
  if (metrics.wordCount >= 800) score += 10;
  if (metrics.internalLinks >= 3) score += 10;
  return clamp(score);
}

function calculateEngagementScore(metrics: ObjectMetrics): number {
  let score = 30;
  if (metrics.views > 0) score += 10;
  if (metrics.uniqueViews > 0) score += 10;
  if (metrics.bounceRate > 0 && metrics.bounceRate < 0.5) score += 15;
  else if (metrics.bounceRate > 0 && metrics.bounceRate < 0.7) score += 5;
  if (metrics.avgTime > 60) score += 15;
  else if (metrics.avgTime > 30) score += 5;
  if (metrics.clickThroughs > 0) score += 15;
  return clamp(score);
}

function calculateRevenueScore(metrics: ObjectMetrics): number {
  let score = 20;
  if (metrics.affiliateLinks > 0) score += 30;
  if (metrics.affiliateClicks > 0) score += 20;
  if (metrics.clickThroughs > 0 && metrics.affiliateClicks > 0) {
    const conversion = metrics.clickThroughs > 0 ? metrics.affiliateClicks / metrics.clickThroughs : 0;
    score += clamp(conversion * 100, 0, 30);
  }
  return clamp(score);
}

function calculateFreshnessScore(metrics: ObjectMetrics): number {
  if (metrics.ageDays <= 30) return 100;
  if (metrics.ageDays <= 90) return 80;
  if (metrics.ageDays <= 180) return 60;
  if (metrics.ageDays <= 365) return 40;
  return 20;
}

function calculateOverallHealth(seo: number, engagement: number, revenue: number, freshness: number): number {
  const weighted = seo * 0.3 + engagement * 0.3 + revenue * 0.2 + freshness * 0.2;
  return clamp(weighted);
}

export async function runContentHealthScoring(batchLimit = 100): Promise<HealthScoringResult> {
  const supabase = await createClient();
  const { data: objects, error } = await supabase.rpc("get_objects_for_health_scoring", { limit_count: batchLimit });

  if (error) return { calculated: 0, error: error.message };
  if (!objects || objects.length === 0) return { calculated: 0, error: null };

  let calculated = 0;
  for (const obj of objects) {
    const objectId = obj.id as string;
    const objectType = obj.object_type as KnowledgeObjectType;
    const languageCode = obj.language_code as SupportedLanguage;

    const { data: metrics } = await supabase.rpc("get_object_metrics", {
      p_object_id: objectId,
      p_object_type: objectType,
      p_language_code: languageCode,
    }).maybeSingle();

    const raw = metrics as ObjectMetrics | null;
    const m: ObjectMetrics = {
      views: raw?.views ?? 0,
      uniqueViews: raw?.uniqueViews ?? 0,
      clickThroughs: raw?.clickThroughs ?? 0,
      affiliateClicks: raw?.affiliateClicks ?? 0,
      bounceRate: raw?.bounceRate ?? 1,
      avgTime: raw?.avgTime ?? 0,
      ageDays: raw?.ageDays ?? 0,
      wordCount: raw?.wordCount ?? 0,
      internalLinks: raw?.internalLinks ?? 0,
      affiliateLinks: raw?.affiliateLinks ?? 0,
      hasMetaTitle: raw?.hasMetaTitle ?? false,
      hasMetaDescription: raw?.hasMetaDescription ?? false,
    };

    const seo = calculateSeoScore(m);
    const engagement = calculateEngagementScore(m);
    const revenue = calculateRevenueScore(m);
    const freshness = calculateFreshnessScore(m);
    const overall = calculateOverallHealth(seo, engagement, revenue, freshness);

    const upsertData = {
      object_id: objectId,
      object_type: objectType,
      language_code: languageCode,
      seo_score: seo,
      engagement_score: engagement,
      revenue_score: revenue,
      freshness_score: freshness,
      overall_health_score: overall,
      score_breakdown: {
        views: m.views,
        uniqueViews: m.uniqueViews,
        bounceRate: m.bounceRate,
        avgTime: m.avgTime,
        ageDays: m.ageDays,
        wordCount: m.wordCount,
        internalLinks: m.internalLinks,
        affiliateLinks: m.affiliateLinks,
        hasMetaTitle: m.hasMetaTitle,
        hasMetaDescription: m.hasMetaDescription,
      },
      calculated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("content_health_scores")
      .upsert(upsertData, { onConflict: "object_id,object_type,language_code" });

    if (!upsertError) calculated++;
  }

  return { calculated, error: null };
}

export async function getLowHealthObjects(
  threshold = 50,
  limit = 25
): Promise<{ data: ContentHealthScore[] | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_health_scores")
    .select("*")
    .lt("overall_health_score", threshold)
    .order("overall_health_score", { ascending: true })
    .limit(limit);

  return { data: data as ContentHealthScore[] | null, error: error?.message ?? null };
}
