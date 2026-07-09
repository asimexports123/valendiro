/**
 * Topic Priority Service — weakest topics first, skip excellent ones.
 */

import { analyzePackageGaps, type PackageGapReport } from "./packageGapAnalyzer";
import { isTopicInActiveTaxonomy } from "@/config/activeTaxonomy";

export interface PrioritizedTopic {
  topicId: string;
  slug: string;
  title: string;
  categorySlug: string | null;
  subcategorySlug: string | null;
  weaknessScore: number;
  gapReport: PackageGapReport;
}

export async function prioritizeWeakestTopics(limit = 20): Promise<PrioritizedTopic[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const sb = createAdminClient();

  const { data: topics } = await sb
    .from("topics")
    .select("id, slug")
    .eq("status", "published");

  if (!topics?.length) return [];

  const reports: PrioritizedTopic[] = [];

  for (const topic of topics) {
    try {
      const gapReport = await analyzePackageGaps(topic.id);
      if (gapReport.isExcellent) continue;
      if (!isTopicInActiveTaxonomy(gapReport.categorySlug, gapReport.subcategorySlug)) continue;

      reports.push({
        topicId: topic.id,
        slug: topic.slug,
        title: gapReport.title,
        categorySlug: gapReport.categorySlug,
        subcategorySlug: gapReport.subcategorySlug,
        weaknessScore: gapReport.weaknessScore,
        gapReport,
      });
    } catch {
      // skip
    }
  }

  return reports.sort((a, b) => b.weaknessScore - a.weaknessScore).slice(0, limit);
}
