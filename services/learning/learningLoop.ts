import { createClient } from "@/lib/supabase/server";
import { runContentHealthScoring } from "@/services/performance/contentHealthScoring";
import { runAutoOptimization } from "@/services/optimization/autoOptimizationEngine";
import { runAffiliateRevenueOptimization } from "@/services/affiliate/affiliateRevenueOptimizer";
import { runSeoIntelligenceEngine } from "@/services/seo/seoIntelligenceEngine";
import { runDuplicateContentScan } from "@/services/seo/duplicateContentDetector";
import { runSchedulerCycle } from "@/services/execution/jobScheduler";

export interface LearningLoopResult {
  health: { calculated: number; error: string | null };
  optimization: { requeued: number; lowHealth: number; seoDecay: number; highPotential: number; errors: string[] };
  affiliate: { optimized: number; newLinks: number; errors: string[] };
  seo: { keywordGaps: number; linkSuggestions: number; weakClusters: number; errors: string[] };
  duplicates: { scanned: number; duplicates: number; error: string | null };
  execution: Awaited<ReturnType<typeof runSchedulerCycle>> & { errors: string[] };
  lifecycle: { updated: number; error: string | null };
}

async function updateContentLifecycle(): Promise<{ updated: number; error: string | null }> {
  const supabase = await createClient();
  try {
    const { data } = await supabase
      .from("content_health_scores")
      .select("object_id, overall_health_score, seo_score, engagement_score, freshness_score")
      .eq("object_type", "article")
      .limit(1000);

    if (!data) return { updated: 0, error: null };

    let updated = 0;
    for (const row of data) {
      const health = row.overall_health_score ?? 0;
      const engagement = row.engagement_score ?? 0;
      const freshness = row.freshness_score ?? 0;
      let lifecycle: string | null = null;

      if (health < 40) lifecycle = "update_required";
      else if (freshness < 30) lifecycle = "declining";
      else if (engagement > 70) lifecycle = "growing";
      else if (health >= 70) lifecycle = "stable";
      else lifecycle = "published";

      const { error } = await supabase
        .from("articles")
        .update({ lifecycle_status: lifecycle })
        .eq("id", row.object_id)
        .neq("lifecycle_status", lifecycle);

      if (!error) updated++;
    }

    return { updated, error: null };
  } catch (err) {
    return { updated: 0, error: err instanceof Error ? err.message : "Lifecycle update failed" };
  }
}

export async function runLearningLoop(): Promise<LearningLoopResult> {
  const health = await runContentHealthScoring(100);
  const optimization = await runAutoOptimization(25);
  const affiliate = await runAffiliateRevenueOptimization(50);
  const seo = await runSeoIntelligenceEngine(50);
  const duplicates = await runDuplicateContentScan(50);
  const lifecycle = await updateContentLifecycle();
  const execution = await runSchedulerCycle({ generationLimit: 10, updateLimit: 10, priorityTopN: 10 });

  return {
    health,
    optimization,
    affiliate,
    seo,
    duplicates,
    lifecycle,
    execution: { ...execution, errors: execution.errors },
  };
}
