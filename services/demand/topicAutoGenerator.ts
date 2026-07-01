/**
 * Topic Auto-Generator Engine
 *
 * Fully automated, scalable topic generation for the hierarchy:
 *   Category → Subcategory → Topic → Article
 *
 * Strategies:
 *   1. LLM Decomposition — Ask AI to decompose a subcategory into learnable topics
 *   2. Long-Tail Expansion — Generate "what is X", "how to X", "X vs Y" patterns
 *   3. Depth Expansion — For existing topics, generate subtopics and advanced variants
 *   4. Related Searches — Expand via "people also ask" style patterns
 *
 * Quality Guardrails:
 *   - Deduplication via slug + fuzzy title matching
 *   - Minimum distinctiveness check (titles must differ by >30%)
 *   - Hierarchy enforcement (every topic → exactly 1 subcategory)
 *   - Batch rate limiting to avoid LLM quota exhaustion
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveLLMProvider } from "@/services/llm/llmProvider";

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string }> {
  const provider = getActiveLLMProvider();
  const response = await provider.complete({
    systemPrompt,
    userPrompt,
    temperature,
    maxTokens,
  });
  return { content: response.content };
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TopicSuggestion {
  title: string;
  slug: string;
  searchIntent: "informational" | "navigational" | "transactional" | "comparison";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedArticles: number;
  reasoning: string;
}

export interface AutoGenResult {
  subcategoryId: string;
  subcategorySlug: string;
  strategy: string;
  topicsGenerated: number;
  topicsSkipped: number;
  topicsQueued: number;
  errors: string[];
  durationMs: number;
}

export interface BatchGenResult {
  totalSubcategories: number;
  totalTopicsQueued: number;
  totalTopicsSkipped: number;
  results: AutoGenResult[];
  errors: string[];
  durationMs: number;
}

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG = {
  maxTopicsPerBatch: 50,
  maxTopicsPerSubcategory: 200,
  minTitleLength: 8,
  maxTitleLength: 80,
  similarityThreshold: 0.7,
  batchDelayMs: 2000,
  llmTemperature: 0.7,
  llmMaxTokens: 4000,
};

// ─── Utility Functions ───────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/**
 * Simple Jaccard similarity for title deduplication.
 * Splits titles into word sets and compares overlap.
 */
function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * Check if a topic title is too similar to any existing title.
 */
function isDuplicate(title: string, existingTitles: string[]): boolean {
  const slug = slugify(title);
  for (const existing of existingTitles) {
    if (slugify(existing) === slug) return true;
    if (titleSimilarity(title, existing) > CONFIG.similarityThreshold) return true;
  }
  return false;
}

function parseJSON<T>(raw: string, fallback: T): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/(\[[\s\S]*\])/);
    if (match) {
      try { return JSON.parse(match[1]) as T; } catch { /* fallthrough */ }
    }
    return fallback;
  }
}

// ─── Strategy 1: LLM Decomposition ──────────────────────────────────────────

const DECOMPOSITION_SYSTEM = `You are a knowledge architect. Your job is to decompose a subcategory into comprehensive, distinct, SEO-friendly topic titles.

Rules:
- Each topic should be a single learnable concept (not too broad, not too narrow)
- Topics should cover beginner to advanced levels
- Include: definitions, how-to guides, comparisons, best practices, common mistakes
- Titles must be natural language (how people actually search)
- NO duplicate or overlapping topics
- Return ONLY valid JSON array`;

async function llmDecomposition(
  subcategoryName: string,
  subcategoryDescription: string,
  categoryName: string,
  existingTopics: string[],
  count: number
): Promise<TopicSuggestion[]> {
  const existingList = existingTopics.length > 0
    ? `\n\nExisting topics (DO NOT duplicate these):\n${existingTopics.map(t => `- ${t}`).join("\n")}`
    : "";

  const prompt = `Subcategory: "${subcategoryName}"
Category: "${categoryName}"
Description: ${subcategoryDescription || "N/A"}
${existingList}

Generate exactly ${count} NEW unique topic titles for this subcategory.
Cover all difficulty levels (beginner, intermediate, advanced).
Include variety: definitions, how-tos, comparisons, best practices, mistakes.

Return as JSON array:
[
  {
    "title": "Human-readable topic title",
    "searchIntent": "informational|navigational|transactional|comparison",
    "difficulty": "beginner|intermediate|advanced",
    "estimatedArticles": 3,
    "reasoning": "Brief explanation of why this topic matters"
  }
]`;

  const { content } = await callLLM(
    DECOMPOSITION_SYSTEM,
    prompt,
    CONFIG.llmTemperature,
    CONFIG.llmMaxTokens
  );

  const suggestions = parseJSON<any[]>(content, []);

  return suggestions
    .filter((s: any) => s?.title && typeof s.title === "string")
    .map((s: any) => ({
      title: s.title.trim(),
      slug: slugify(s.title),
      searchIntent: s.searchIntent || "informational",
      difficulty: s.difficulty || "intermediate",
      estimatedArticles: s.estimatedArticles || 3,
      reasoning: s.reasoning || "",
    }))
    .filter(s => s.title.length >= CONFIG.minTitleLength && s.title.length <= CONFIG.maxTitleLength);
}

// ─── Strategy 2: Long-Tail Pattern Expansion ────────────────────────────────

const LONG_TAIL_PATTERNS = [
  "What is {topic}",
  "How {topic} Works",
  "How to Use {topic}",
  "{topic} for Beginners",
  "{topic} Best Practices",
  "{topic} Common Mistakes",
  "{topic} vs {related}",
  "Types of {topic}",
  "Benefits of {topic}",
  "{topic} Examples",
  "Advanced {topic} Techniques",
  "{topic} Tools and Resources",
  "How to Choose {topic}",
  "{topic} Step by Step Guide",
  "{topic} Pros and Cons",
];

function generateLongTailTopics(
  baseTopics: string[],
  existingTitles: string[],
  maxCount: number
): TopicSuggestion[] {
  const results: TopicSuggestion[] = [];

  for (const base of baseTopics) {
    if (results.length >= maxCount) break;

    for (const pattern of LONG_TAIL_PATTERNS) {
      if (results.length >= maxCount) break;

      // Simple pattern fill — skip "vs" patterns without a related topic
      if (pattern.includes("{related}")) continue;

      const title = pattern.replace("{topic}", base);
      if (isDuplicate(title, [...existingTitles, ...results.map(r => r.title)])) continue;

      results.push({
        title,
        slug: slugify(title),
        searchIntent: pattern.startsWith("How") ? "informational" : "informational",
        difficulty: pattern.includes("Advanced") ? "advanced" : pattern.includes("Beginner") ? "beginner" : "intermediate",
        estimatedArticles: 2,
        reasoning: `Long-tail expansion: ${pattern}`,
      });
    }
  }

  return results;
}

// ─── Strategy 3: Depth Expansion (subtopics from existing) ──────────────────

const DEPTH_EXPANSION_SYSTEM = `You are a knowledge architect. Given an existing topic, generate subtopics that go deeper.

Rules:
- Subtopics must be narrower/more specific than the parent
- Cover: implementation details, edge cases, advanced usage, troubleshooting
- Titles must be natural search queries
- Return ONLY valid JSON array of strings (topic titles)`;

async function depthExpansion(
  parentTopic: string,
  subcategoryName: string,
  existingTitles: string[],
  count: number
): Promise<TopicSuggestion[]> {
  const prompt = `Parent topic: "${parentTopic}"
Subcategory: "${subcategoryName}"

Generate ${count} deeper subtopics. These should be more specific aspects of "${parentTopic}".
Examples of depth: implementation details, edge cases, performance optimization, security considerations, real-world scenarios.

Existing topics to avoid duplicating:
${existingTitles.slice(0, 20).map(t => `- ${t}`).join("\n")}

Return as JSON array of strings (just the titles):
["Title 1", "Title 2", ...]`;

  const { content } = await callLLM(
    DEPTH_EXPANSION_SYSTEM,
    prompt,
    CONFIG.llmTemperature,
    2000
  );

  const titles = parseJSON<string[]>(content, []);

  return titles
    .filter(t => typeof t === "string" && t.length >= CONFIG.minTitleLength)
    .filter(t => !isDuplicate(t, existingTitles))
    .map(t => ({
      title: t.trim(),
      slug: slugify(t),
      searchIntent: "informational" as const,
      difficulty: "advanced" as const,
      estimatedArticles: 2,
      reasoning: `Depth expansion from: ${parentTopic}`,
    }));
}

// ─── Main Auto-Generation Function ──────────────────────────────────────────

/**
 * Auto-generate topics for a single subcategory using multiple strategies.
 */
export async function autoGenerateTopics(
  subcategoryId: string,
  options: {
    maxTopics?: number;
    strategies?: ("decomposition" | "long-tail" | "depth")[];
    dryRun?: boolean;
  } = {}
): Promise<AutoGenResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  const maxTopics = options.maxTopics ?? CONFIG.maxTopicsPerBatch;
  const strategies = options.strategies ?? ["decomposition", "long-tail"];
  const dryRun = options.dryRun ?? false;

  const result: AutoGenResult = {
    subcategoryId,
    subcategorySlug: "",
    strategy: strategies.join("+"),
    topicsGenerated: 0,
    topicsSkipped: 0,
    topicsQueued: 0,
    errors: [],
    durationMs: 0,
  };

  // Fetch subcategory details
  const { data: subcategory } = await supabase
    .from("subcategories")
    .select("id, slug, category_id, subcategory_translations(name, description), categories(id, category_translations(name))")
    .eq("id", subcategoryId)
    .eq("subcategory_translations.language_code", "en")
    .eq("categories.category_translations.language_code", "en")
    .maybeSingle();

  if (!subcategory) {
    result.errors.push(`Subcategory not found: ${subcategoryId}`);
    result.durationMs = Date.now() - startTime;
    return result;
  }

  const subcategoryName = (subcategory.subcategory_translations as any)?.[0]?.name || subcategory.slug;
  const subcategoryDesc = (subcategory.subcategory_translations as any)?.[0]?.description || "";
  const categoryName = (subcategory.categories as any)?.category_translations?.[0]?.name || "General";
  result.subcategorySlug = subcategory.slug;

  // Fetch existing topics for this subcategory
  const { data: existingTopicsData } = await supabase
    .from("topics")
    .select("slug, topic_translations(title)")
    .eq("subcategory_id", subcategoryId)
    .eq("topic_translations.language_code", "en");

  const existingTitles = (existingTopicsData ?? [])
    .map((t: any) => t.topic_translations?.[0]?.title || t.slug)
    .filter(Boolean);

  // Also check generation queue
  const { data: queueData } = await supabase
    .from("content_generation_queue")
    .select("title")
    .eq("object_type", "topic")
    .contains("metadata", { subcategory_id: subcategoryId });

  const queuedTitles = (queueData ?? []).map((q: any) => q.title);
  const allExisting = [...existingTitles, ...queuedTitles];

  // Check limits
  if (allExisting.length >= CONFIG.maxTopicsPerSubcategory) {
    result.errors.push(`Subcategory "${subcategory.slug}" already has ${allExisting.length} topics (max: ${CONFIG.maxTopicsPerSubcategory})`);
    result.durationMs = Date.now() - startTime;
    return result;
  }

  const remainingSlots = Math.min(maxTopics, CONFIG.maxTopicsPerSubcategory - allExisting.length);
  let suggestions: TopicSuggestion[] = [];

  // ── Execute Strategies ──

  if (strategies.includes("decomposition") && suggestions.length < remainingSlots) {
    try {
      const count = Math.min(remainingSlots - suggestions.length, 30);
      const decomposed = await llmDecomposition(
        subcategoryName, subcategoryDesc, categoryName, allExisting, count
      );
      suggestions.push(...decomposed.filter(s => !isDuplicate(s.title, [...allExisting, ...suggestions.map(x => x.title)])));
    } catch (err: any) {
      result.errors.push(`LLM decomposition failed: ${err.message}`);
    }
  }

  if (strategies.includes("long-tail") && suggestions.length < remainingSlots) {
    // Use existing topics as base for long-tail expansion
    const baseTopics = existingTitles.slice(0, 10);
    if (baseTopics.length > 0) {
      const longTail = generateLongTailTopics(
        baseTopics,
        [...allExisting, ...suggestions.map(x => x.title)],
        remainingSlots - suggestions.length
      );
      suggestions.push(...longTail);
    }
  }

  if (strategies.includes("depth") && suggestions.length < remainingSlots && existingTitles.length > 0) {
    try {
      // Pick top 3 existing topics for depth expansion
      const parents = existingTitles.slice(0, 3);
      for (const parent of parents) {
        if (suggestions.length >= remainingSlots) break;
        const deeper = await depthExpansion(
          parent, subcategoryName,
          [...allExisting, ...suggestions.map(x => x.title)],
          Math.min(5, remainingSlots - suggestions.length)
        );
        suggestions.push(...deeper);

        // Rate limit between LLM calls
        await new Promise(r => setTimeout(r, CONFIG.batchDelayMs));
      }
    } catch (err: any) {
      result.errors.push(`Depth expansion failed: ${err.message}`);
    }
  }

  result.topicsGenerated = suggestions.length;

  // ── Queue Topics ──

  if (dryRun) {
    result.topicsQueued = suggestions.length;
    result.durationMs = Date.now() - startTime;
    return result;
  }

  for (const suggestion of suggestions) {
    const { error } = await supabase.from("content_generation_queue").insert({
      object_type: "topic",
      title: suggestion.title,
      description: suggestion.reasoning,
      reason: `Auto-generated via ${result.strategy} for subcategory: ${subcategory.slug}`,
      priority_score: suggestion.difficulty === "beginner" ? 90 : suggestion.difficulty === "intermediate" ? 70 : 50,
      status: "pending",
      metadata: {
        subcategory_id: subcategoryId,
        category_id: subcategory.category_id,
        source: "auto_generator",
        strategy: result.strategy,
        subcategory_slug: subcategory.slug,
        search_intent: suggestion.searchIntent,
        difficulty: suggestion.difficulty,
        estimated_articles: suggestion.estimatedArticles,
        slug: suggestion.slug,
      },
    });

    if (error) {
      result.errors.push(`Queue insert failed for "${suggestion.title}": ${error.message}`);
      result.topicsSkipped++;
    } else {
      result.topicsQueued++;
    }
  }

  result.durationMs = Date.now() - startTime;
  return result;
}

// ─── Batch Processing ────────────────────────────────────────────────────────

/**
 * Auto-generate topics for ALL subcategories that have < threshold topics.
 * This is the main entry point for the autonomous pipeline.
 */
export async function batchAutoGenerate(options: {
  maxTopicsPerSubcategory?: number;
  minExistingTopics?: number;
  strategies?: ("decomposition" | "long-tail" | "depth")[];
  dryRun?: boolean;
  limitSubcategories?: number;
} = {}): Promise<BatchGenResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  const maxPerSub = options.maxTopicsPerSubcategory ?? 30;
  const minExisting = options.minExistingTopics ?? 0;
  const strategies = options.strategies ?? ["decomposition", "long-tail"];
  const dryRun = options.dryRun ?? false;
  const limitSubs = options.limitSubcategories ?? 100;

  const batchResult: BatchGenResult = {
    totalSubcategories: 0,
    totalTopicsQueued: 0,
    totalTopicsSkipped: 0,
    results: [],
    errors: [],
    durationMs: 0,
  };

  // Get all subcategories with topic counts
  const { data: subcategories, error } = await supabase
    .from("subcategories")
    .select("id, slug, category_id")
    .order("sort_order", { ascending: true })
    .limit(limitSubs);

  if (error || !subcategories) {
    batchResult.errors.push(`Failed to fetch subcategories: ${error?.message}`);
    batchResult.durationMs = Date.now() - startTime;
    return batchResult;
  }

  // Filter subcategories that need more topics
  const eligible: typeof subcategories = [];
  for (const sub of subcategories) {
    const { count } = await supabase
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("subcategory_id", sub.id);

    if ((count ?? 0) <= minExisting || (count ?? 0) < CONFIG.maxTopicsPerSubcategory) {
      eligible.push(sub);
    }
  }

  batchResult.totalSubcategories = eligible.length;

  for (const sub of eligible) {
    try {
      const genResult = await autoGenerateTopics(sub.id, {
        maxTopics: maxPerSub,
        strategies,
        dryRun,
      });

      batchResult.results.push(genResult);
      batchResult.totalTopicsQueued += genResult.topicsQueued;
      batchResult.totalTopicsSkipped += genResult.topicsSkipped;
      batchResult.errors.push(...genResult.errors);

      console.log(
        `[TopicAutoGen] ${genResult.subcategorySlug}: generated=${genResult.topicsGenerated} queued=${genResult.topicsQueued} skipped=${genResult.topicsSkipped} (${genResult.durationMs}ms)`
      );

      // Rate limit between subcategories
      await new Promise(r => setTimeout(r, CONFIG.batchDelayMs));
    } catch (err: any) {
      batchResult.errors.push(`Failed for subcategory ${sub.slug}: ${err.message}`);
    }
  }

  batchResult.durationMs = Date.now() - startTime;
  return batchResult;
}

// ─── API Helper for cron/admin triggers ──────────────────────────────────────

/**
 * Single subcategory expansion — called from admin UI or API.
 */
export async function expandSubcategory(subcategorySlug: string): Promise<AutoGenResult> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subcategories")
    .select("id")
    .eq("slug", subcategorySlug)
    .maybeSingle();

  if (!data) {
    return {
      subcategoryId: "",
      subcategorySlug,
      strategy: "decomposition+long-tail",
      topicsGenerated: 0,
      topicsSkipped: 0,
      topicsQueued: 0,
      errors: [`Subcategory not found: ${subcategorySlug}`],
      durationMs: 0,
    };
  }

  return autoGenerateTopics(data.id, {
    maxTopics: 50,
    strategies: ["decomposition", "long-tail", "depth"],
  });
}
