/**
 * Catalog hierarchy intelligence — category → subcategory → topic prioritization.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { analyzePackageGaps } from "@/services/learning/packageGapAnalyzer";
import { isTopicInActiveTaxonomy } from "@/config/activeTaxonomy";
import {
  getPhase1SeedPublishPriority,
  PHASE_1_SEED_SLUG_SET,
  getTopPhase1SeedSlugs,
} from "@/config/phase1SeedTopics";
import { isStubTopicContent } from "@/services/public/contentFilters";

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

async function loadHierarchyTopics(options?: { includeUnpublished?: boolean }): Promise<
  (Omit<CatalogTopicTarget, "priorityScore" | "reason"> & { topicContent: string })[]
> {
  const sb = createAdminClient();

  let query = sb
    .from("topics")
    .select("id, slug, category_id, subcategory_id, topic_translations(title, content)")
    .eq("topic_translations.language_code", "en");

  if (!options?.includeUnpublished) {
    query = query.eq("status", "published");
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("[catalogHierarchy] loadHierarchyTopics:", error.message);
    return [];
  }

  const categoryIds = [...new Set((rows ?? []).map((r) => r.category_id).filter(Boolean))] as string[];
  const subcategoryIds = [...new Set((rows ?? []).map((r) => r.subcategory_id).filter(Boolean))] as string[];

  const catById = new Map<string, { slug: string; name: string }>();
  if (categoryIds.length > 0) {
    const { data: cats } = await sb
      .from("categories")
      .select("id, slug, category_translations(name)")
      .in("id", categoryIds)
      .eq("category_translations.language_code", "en");
    for (const c of cats ?? []) {
      catById.set(c.id, {
        slug: c.slug,
        name: c.category_translations?.[0]?.name ?? c.slug,
      });
    }
  }

  const subById = new Map<string, { slug: string; name: string }>();
  if (subcategoryIds.length > 0) {
    const { data: subs } = await sb
      .from("subcategories")
      .select("id, slug, subcategory_translations(name)")
      .in("id", subcategoryIds)
      .eq("subcategory_translations.language_code", "en");
    for (const s of subs ?? []) {
      subById.set(s.id, {
        slug: s.slug,
        name: s.subcategory_translations?.[0]?.name ?? s.slug,
      });
    }
  }

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
    const cat = row.category_id ? catById.get(row.category_id) : undefined;
    const sub = row.subcategory_id ? subById.get(row.subcategory_id) : undefined;

    return {
      topicId: row.id,
      slug: row.slug,
      title: trans?.title ?? row.slug,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      factCount: factByTopic.get(row.id) ?? 0,
      categorySlug: cat?.slug ?? null,
      categoryTitle: cat?.name ?? cat?.slug ?? null,
      subcategorySlug: sub?.slug ?? null,
      subcategoryTitle: sub?.name ?? sub?.slug ?? null,
      topicContent: content,
    };
  });
}

function computePriority(
  topic: Omit<CatalogTopicTarget, "priorityScore" | "reason">,
  weaknessScore: number,
  gapCount: number,
  isExcellent: boolean,
  content?: string
): { score: number; reason: string } {
  if (isExcellent) return { score: 0, reason: "already excellent" };

  let score = weaknessScore + gapCount * 6;
  if (topic.wordCount < 500) score += 30;
  else if (topic.wordCount < 1000) score += 18;
  if (topic.factCount < 10) score += 15;

  // Phase-1 seed topics get priority boost from curated publishPriority
  const seedBoost = getPhase1SeedPublishPriority(topic.slug);
  if (seedBoost > 0) score += Math.round(seedBoost * 0.4);

  // Stub/placeholder content gets extra urgency
  if (content && isStubTopicContent(content)) score += 35;

  const parts = [`${topic.categoryTitle ?? "Category"} › ${topic.subcategoryTitle ?? "General"} › ${topic.title}`];
  if (topic.wordCount < 1000) parts.push("needs content");
  if (gapCount > 0) parts.push(`${gapCount} gaps`);
  if (seedBoost > 0) parts.push(`seed priority ${seedBoost}`);

  return { score: Math.min(Math.round(score), 100), reason: parts.join(" — ") };
}

/**
 * Phase-1 seeds by curated publishPriority — skips weakness score (stubs + flagships both eligible).
 */
async function selectSeedPublishTargets(limit: number): Promise<CatalogTopicTarget[]> {
  const slugs = getTopPhase1SeedSlugs(limit);
  const topics = await loadHierarchyTopics({ includeUnpublished: true });
  const bySlug = new Map(
    topics
      .filter(({ categorySlug, subcategorySlug }) =>
        isTopicInActiveTaxonomy(categorySlug, subcategorySlug)
      )
      .map(({ topicContent, ...topic }) => [topic.slug, { topic, topicContent }] as const)
  );

  const selected: CatalogTopicTarget[] = [];
  for (const slug of slugs) {
    const row = bySlug.get(slug);
    if (!row) continue;
    selected.push({
      ...row.topic,
      priorityScore: getPhase1SeedPublishPriority(slug),
      reason: `seed priority ${getPhase1SeedPublishPriority(slug)}`,
    });
  }
  return selected.slice(0, limit);
}

/**
 * Pick topics intelligently across category → subcategory → topic tree.
 * When seedOnly=true, uses curated seed priority order (not weakness score).
 */
export async function selectCatalogPublishTargets(
  limit = 10,
  options?: { seedOnly?: boolean }
): Promise<CatalogTopicTarget[]> {
  if (options?.seedOnly) {
    return selectSeedPublishTargets(limit);
  }

  const topics = await loadHierarchyTopics();
  const scored: CatalogTopicTarget[] = [];

  for (const { topicContent, ...topic } of topics) {
    if (!isTopicInActiveTaxonomy(topic.categorySlug, topic.subcategorySlug)) continue;

    const report = await analyzePackageGaps(topic.topicId);
    const { score, reason } = computePriority(
      topic,
      report.weaknessScore,
      report.gaps.length,
      report.isExcellent,
      topicContent
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
