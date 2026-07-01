/**
 * Additional Demand Sources — Stage 1 of the V1 Publishing Pipeline
 *
 * Provides keyword signals from:
 * - Stack Overflow (technology questions)
 * - GitHub Trending repositories
 * - Internal content gap detection (topics/subcategories with no articles yet)
 *
 * Every keyword passes through the existing quality and category filters before
 * being inserted as a demand signal. Out-of-scope keywords are discarded here.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { scoreDemandKeyword, isPublishable } from "./topicQualityEngine";
import { getActiveCategories, detectCategoryFromKeyword } from "./categoryConfig";
import { DemandSourceResult } from "./demandSources";

// ── Stack Overflow ─────────────────────────────────────────────────────────────

/**
 * Fetches frequently asked Stack Overflow questions via the public API.
 * Restricted to tags that map to V1 categories (technology-heavy).
 */
export async function fetchStackOverflowQuestions(languageCode = "en"): Promise<DemandSourceResult> {
  const supabase = createAdminClient();
  let inserted = 0;
  const errors: string[] = [];
  const cats = await getActiveCategories();

  // Tags that align with V1 categories
  const tags = [
    "javascript", "python", "typescript", "react", "node.js",
    "sql", "linux", "docker", "kubernetes", "machine-learning",
    "personal-finance", "investing", "budgeting",
  ];

  for (const tag of tags) {
    try {
      const url = `https://api.stackexchange.com/2.3/questions?order=desc&sort=votes&tagged=${encodeURIComponent(tag)}&site=stackoverflow&pagesize=10&filter=default`;
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) continue;

      const data = await res.json();
      const items: { title: string; score: number; answer_count: number }[] = data.items || [];

      for (const item of items) {
        if (!item.title || item.title.length > 120) continue;
        const quality = scoreDemandKeyword(item.title);
        if (!isPublishable(quality)) continue;

        const keyword = quality.knowledgeTopic || quality.normalizedKeyword;
        const categoryMatch = detectCategoryFromKeyword(keyword, cats);
        if (!categoryMatch.inScope) continue;

        const { error } = await supabase.from("demand_signals").insert({
          signal_type: "trend",
          source: "stackoverflow_questions",
          keyword,
          language_code: languageCode,
          volume_score: Math.min(95, 50 + Math.floor(Math.log10(Math.max(1, item.score)) * 10)),
          trend_score: 60,
          seasonal_score: 40,
          affiliate_potential_score: 20,
          competition_score: 70,
          search_intent: quality.intent,
          category: categoryMatch.label,
          freshness_score: 50,
          metadata: {
            discovered_by: "stackoverflow_questions",
            tag,
            answer_count: item.answer_count,
            quality,
            in_scope: true,
            category_slug: categoryMatch.slug,
          },
        });

        if (!error) inserted++;
        else errors.push(error.message);
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `Stack Overflow fetch failed for tag ${tag}`);
    }
  }

  return { inserted, error: errors.length > 0 ? errors.slice(0, 3).join("; ") : null };
}

// ── GitHub Trending ────────────────────────────────────────────────────────────

/**
 * Extracts knowledge keywords from GitHub trending repository descriptions.
 * Only technology-category keywords are accepted.
 */
export async function fetchGitHubTrending(languageCode = "en"): Promise<DemandSourceResult> {
  const supabase = createAdminClient();
  let inserted = 0;
  const errors: string[] = [];
  const cats = await getActiveCategories();

  const languages = ["", "python", "javascript", "typescript", "go", "rust"];

  for (const lang of languages) {
    try {
      const url = `https://api.github.com/search/repositories?q=stars:>500${lang ? `+language:${lang}` : ""}&sort=stars&order=desc&per_page=10`;
      const res = await fetch(url, {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 86400 },
      });
      if (!res.ok) continue;

      const data = await res.json();
      const items: { name: string; description: string | null; topics: string[] }[] = data.items || [];

      for (const item of items) {
        // Use description as keyword source — richer than repo name alone
        const sources = [
          item.description,
          ...item.topics.map((t) => t.replace(/-/g, " ")),
        ].filter((s): s is string => !!s && s.length > 5 && s.length < 120);

        for (const raw of sources) {
          const quality = scoreDemandKeyword(raw);
          if (!isPublishable(quality)) continue;

          const keyword = quality.knowledgeTopic || quality.normalizedKeyword;
          const categoryMatch = detectCategoryFromKeyword(keyword, cats);
          if (!categoryMatch.inScope) continue;

          const { error } = await supabase.from("demand_signals").insert({
            signal_type: "trend",
            source: "github_trending",
            keyword,
            language_code: languageCode,
            volume_score: 55,
            trend_score: 75,
            seasonal_score: 40,
            affiliate_potential_score: 25,
            competition_score: 65,
            search_intent: quality.intent,
            category: categoryMatch.label,
            freshness_score: 70,
            metadata: {
              discovered_by: "github_trending",
              repo_name: item.name,
              quality,
              in_scope: true,
              category_slug: categoryMatch.slug,
            },
          });

          if (!error) inserted++;
          else errors.push(error.message);
        }
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `GitHub trending fetch failed`);
    }
  }

  return { inserted, error: errors.length > 0 ? errors.slice(0, 3).join("; ") : null };
}

// ── Internal Content Gap Detection ────────────────────────────────────────────

/**
 * Scans the database for subcategories and topics that have no published articles.
 * These represent genuine content gaps — high-priority targets for new articles.
 * Emits demand signals for the gap so the pipeline can fill them.
 */
export async function detectInternalContentGaps(languageCode = "en"): Promise<DemandSourceResult> {
  const supabase = createAdminClient();
  let inserted = 0;
  const errors: string[] = [];
  const cats = await getActiveCategories();

  // Subcategories with zero published articles
  try {
    const { data: subcategories } = await supabase
      .from("subcategories")
      .select("id, slug, subcategory_translations(name)")
      .eq("subcategory_translations.language_code", languageCode)
      .limit(50);

    for (const col of subcategories || []) {
      const name = (col.subcategory_translations as { name: string }[] | null)?.[0]?.name;
      if (!name) continue;

      // Check if this Subcategory has any published articles via topics
      const { data: topics } = await supabase
        .from("topics")
        .select("id")
        .eq("subcategory_id", col.id)
        .eq("status", "published");

      if (!topics || topics.length === 0) continue;

      const topicIds = topics.map((t) => t.id);
      const { count } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .in("topic_id", topicIds);

      if ((count ?? 0) > 0) continue; // Already has articles

      // This Subcategory is a genuine content gap
      const keyword = `${name} guide`;
      const quality = scoreDemandKeyword(keyword);
      if (!isPublishable(quality)) continue;

      const categoryMatch = detectCategoryFromKeyword(name, cats);
      if (!categoryMatch.inScope) continue;

      const { error } = await supabase.from("demand_signals").insert({
        signal_type: "internal_gap",
        source: "internal_gap_detection",
        keyword,
        language_code: languageCode,
        volume_score: 65,
        trend_score: 50,
        seasonal_score: 40,
        affiliate_potential_score: 30,
        competition_score: 40,
        search_intent: "educational",
        category: categoryMatch.label,
        freshness_score: 60,
        metadata: {
          discovered_by: "internal_gap_detection",
          gap_type: "subcategory_no_articles",
          subcategory_id: col.id,
          quality,
          in_scope: true,
          category_slug: categoryMatch.slug,
        },
      });

      if (!error) inserted++;
      else errors.push(error.message);
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "Subcategory gap scan failed");
  }

  // Topics with zero published articles
  try {
    const { data: topics } = await supabase
      .from("topics")
      .select("id, slug, topic_translations(title)")
      .eq("status", "published")
      .eq("topic_translations.language_code", languageCode)
      .limit(100);

    for (const topic of topics || []) {
      const title = (topic.topic_translations as { title: string }[] | null)?.[0]?.title;
      if (!title) continue;

      const { count } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("topic_id", topic.id)
        .eq("status", "published");

      if ((count ?? 0) > 0) continue; // Topic already has articles

      const keyword = `${title} explained`;
      const quality = scoreDemandKeyword(keyword);
      if (!isPublishable(quality)) continue;

      const categoryMatch = detectCategoryFromKeyword(title, cats);
      if (!categoryMatch.inScope) continue;

      const { error } = await supabase.from("demand_signals").insert({
        signal_type: "internal_gap",
        source: "internal_gap_detection",
        keyword,
        language_code: languageCode,
        volume_score: 70,
        trend_score: 50,
        seasonal_score: 40,
        affiliate_potential_score: 25,
        competition_score: 35,
        search_intent: "educational",
        category: categoryMatch.label,
        freshness_score: 60,
        metadata: {
          discovered_by: "internal_gap_detection",
          gap_type: "topic_no_articles",
          topic_id: topic.id,
          quality,
          in_scope: true,
          category_slug: categoryMatch.slug,
        },
      });

      if (!error) inserted++;
      else errors.push(error.message);
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "Topic gap scan failed");
  }

  return { inserted, error: errors.length > 0 ? errors.slice(0, 3).join("; ") : null };
}
