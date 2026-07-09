/**
 * Catalog hierarchy intelligence — category → subcategory → topic prioritization.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { analyzePackageGaps } from "@/services/learning/packageGapAnalyzer";

export interface CatalogTopicTarget {
  topicId: string;
  slug: string;
  title: string;
  wordCount: number;
  factCount: number;
  categorySlug: string | null;
  categoryTitle: string | null;
  subcategorySlug: string | null;
  subcategoryTitle: string | null;
  priorityScore: number;
  reason: string;
}

async function loadHierarchyTopics(): Promise<
  Omit<CatalogTopicTarget, "priorityScore" | "reason">[]
> {
  const sb = createAdminClient();

  const { data: rows } = await sb
    .from("topics")
    .select(`
      id, slug,
      topic_translations(title, content),
      categories(slug, category_translations(name)),
      subcategories(slug, subcategory_translations(name))
    `)
    .eq("status", "published")
    .eq("topic_translations.language_code", "en")
    .eq("categories.category_translations.language_code", "en")
    .eq("subcategories.subcategory_translations.language_code", "en");

  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("topic_id, fact_count")
    .eq("status", "ready");

  const factByTopic = new Map<string, number>();
  for (const pkg of packages ?? []) {
    if (pkg.topic_id) {
      factByTopic.set(pkg.topic_id, Math.max(factByTopic.get(pkg.topic_id) ?? 0, pkg.fact_count ?? 0));
    }
  }

  return (rows ?? []).map((row) => {
    const trans = row.topic_translations?.[0];
    const content = trans?.content ?? "";
    const cat = row.categories as {
      slug?: string;
      category_translations?: { name?: string }[];
    } | null;
    const sub = row.subcategories as {
      slug?: string;
      subcategory_translations?: { name?: string }[];
    } | null;

    return {
      topicId: row.id,
      slug: row.slug,
      title: trans?.title ?? row.slug,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      factCount: factByTopic.get(row.id) ?? 0,
      categorySlug: cat?.slug ?? null,
      categoryTitle: cat?.category_translations?.[0]?.name ?? cat?.slug ?? null,
      subcategorySlug: sub?.slug ?? null,
      subcategoryTitle: sub?.subcategory_translations?.[0]?.name ?? sub?.slug ?? null,
    };
  });
}

function computePriority(
  topic: Omit<CatalogTopicTarget, "priorityScore" | "reason">,
  weaknessScore: number,
  gapCount: number,
  isExcellent: boolean
): { score: number; reason: string } {
  if (isExcellent) return { score: 0, reason: "already excellent" };

  let score = weaknessScore + gapCount * 6;
  if (topic.wordCount < 500) score += 30;
  else if (topic.wordCount < 1000) score += 18;
  if (topic.factCount < 10) score += 15;

  const parts = [`${topic.categoryTitle ?? "Category"} › ${topic.subcategoryTitle ?? "General"} › ${topic.title}`];
  if (topic.wordCount < 1000) parts.push("needs content");
  if (gapCount > 0) parts.push(`${gapCount} gaps`);

  return { score: Math.min(Math.round(score), 100), reason: parts.join(" — ") };
}

/**
 * Pick topics intelligently across category → subcategory → topic tree.
 */
export async function selectCatalogPublishTargets(limit = 10): Promise<CatalogTopicTarget[]> {
  const topics = await loadHierarchyTopics();
  const scored: CatalogTopicTarget[] = [];

  for (const topic of topics) {
    const report = await analyzePackageGaps(topic.topicId);
    const { score, reason } = computePriority(
      topic,
      report.weaknessScore,
      report.gaps.length,
      report.isExcellent
    );
    if (score < 40) continue;

    scored.push({ ...topic, priorityScore: score, reason });
  }

  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  const byCategory = new Map<string, CatalogTopicTarget[]>();
  for (const item of scored) {
    const key = `${item.categorySlug ?? "x"}::${item.subcategorySlug ?? "y"}`;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(item);
  }

  const selected: CatalogTopicTarget[] = [];
  const buckets = [...byCategory.values()];
  let round = 0;

  while (selected.length < limit && buckets.some((b) => b.length > round)) {
    for (const bucket of buckets) {
      if (bucket[round] && selected.length < limit) {
        selected.push(bucket[round]);
      }
    }
    round++;
  }

  return selected;
}
