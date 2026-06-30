/**
 * Knowledge Expansion Engine
 *
 * Given one Topic, this engine thinks like a teacher and expands it into
 * everything a learner may want to know — NOT like an SEO keyword scraper.
 *
 * Input:  Topic (slug, title, category, collection)
 * Output: List of ArticleIdeas — each with title, intent, angle, priority
 *
 * Groq Call: 1 per topic expansion
 * Deterministic: deduplication, priority scoring, queue insertion
 */

import { getActiveLLMProvider } from "@/services/llm/llmProvider";
import "@/services/llm";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArticleIdea {
  title: string;
  angle: string;           // What unique perspective this article covers
  intent: "informational" | "how_to" | "comparison" | "educational";
  priority: number;        // 1–100
  estimatedWordCount: number;
}

export interface TopicExpansionResult {
  topicSlug: string;
  topicTitle: string;
  ideas: ArticleIdea[];
  totalIdeas: number;
  durationMs: number;
  queued: number;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const EXPANSION_SYSTEM_PROMPT = `You are a senior editorial director at an educational knowledge platform.
Your job is to think like a teacher, not an SEO scraper.
Given a topic, identify every meaningful article a learner would want to read to fully understand it.
Think in terms of: definitions, history, how-it-works, examples, applications, advantages, limitations, comparisons, career paths, tools, common mistakes, FAQs, related concepts, and learning roadmaps.
Output ONLY valid JSON. No markdown. No explanation.`;

function buildExpansionPrompt(topicTitle: string, categoryLabel: string, existingArticleTitles: string[]): string {
  const existing = existingArticleTitles.length > 0
    ? `\nAlready written articles for this topic (DO NOT repeat these):\n${existingArticleTitles.map(t => `- ${t}`).join("\n")}`
    : "";

  return `Topic: "${topicTitle}"
Category: "${categoryLabel}"
${existing}

Generate a comprehensive list of 10-15 article ideas that would form a complete knowledge base for this topic.
Think like a teacher building a curriculum, not an SEO tool.

Return ONLY this JSON structure:
{
  "ideas": [
    {
      "title": "What Is [Topic]? A Complete Introduction",
      "angle": "Foundation article explaining the concept from scratch",
      "intent": "informational",
      "priority": 95,
      "estimatedWordCount": 1500
    }
  ]
}

Rules:
- Each title must be a real article a learner would search for
- Cover: definition, how-it-works, history, examples, advantages, limitations, comparisons, tools, career, mistakes, FAQs
- intent must be one of: informational, how_to, comparison, educational
- priority: 90-100 = foundation articles, 70-89 = important, 50-69 = supplementary
- estimatedWordCount: 1200-2500 depending on complexity
- No duplicate angles
- No generic filler titles like "Everything About X"`;
}

// ─── JSON Parser ──────────────────────────────────────────────────────────────

function parseIdeasFromLLM(raw: string): ArticleIdea[] {
  try {
    const clean = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(clean) as { ideas: ArticleIdea[] };
    if (!Array.isArray(parsed.ideas)) return [];
    return parsed.ideas.filter(
      (idea) => idea.title && idea.intent && typeof idea.priority === "number"
    );
  } catch {
    // Try extracting JSON block
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as { ideas: ArticleIdea[] };
        return Array.isArray(parsed.ideas) ? parsed.ideas : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export async function expandTopic(
  topicId: string,
  topicSlug: string,
  topicTitle: string,
  categoryLabel: string,
  options: { maxIdeas?: number; minPriority?: number } = {}
): Promise<TopicExpansionResult> {
  const start = Date.now();
  const { maxIdeas = 15, minPriority = 50 } = options;
  const supabase = createAdminClient();

  // Get existing article titles for this topic to avoid duplicates
  const { data: existingArticles } = await supabase
    .from("articles")
    .select("article_translations(title)")
    .eq("topic_id", topicId)
    .eq("status", "published");

  const existingTitles: string[] = [];
  for (const a of existingArticles ?? []) {
    const trans = (a.article_translations as any[]) ?? [];
    for (const t of trans) {
      if (t.title) existingTitles.push(t.title);
    }
  }

  // Also check queue to avoid queuing what's already queued
  const { data: queuedItems } = await supabase
    .from("content_generation_queue")
    .select("title")
    .eq("topic_id", topicId)
    .in("status", ["pending", "pending_llm", "completed"]);

  const queuedTitles = (queuedItems ?? []).map((q) => q.title);
  const allExisting = [...existingTitles, ...queuedTitles];

  // LLM expansion call
  const provider = getActiveLLMProvider();
  const response = await provider.complete({
    systemPrompt: EXPANSION_SYSTEM_PROMPT,
    userPrompt: buildExpansionPrompt(topicTitle, categoryLabel, allExisting),
    temperature: 0.4,
    maxTokens: 3000,
  });

  const ideas = parseIdeasFromLLM(response.content)
    .filter((idea) => idea.priority >= minPriority)
    .slice(0, maxIdeas);

  // Insert into content_generation_queue
  let queued = 0;
  for (const idea of ideas) {
    const { error } = await supabase
      .from("content_generation_queue")
      .insert({
        object_type: "article",
        title: idea.title,
        topic_id: topicId,
        status: "pending",
        priority_score: idea.priority,
        metadata: {
          angle: idea.angle,
          intent: idea.intent,
          estimatedWordCount: idea.estimatedWordCount,
          expandedFromTopic: topicSlug,
          categoryLabel,
        },
      });
    if (!error) queued++;
  }

  return {
    topicSlug,
    topicTitle,
    ideas,
    totalIdeas: ideas.length,
    durationMs: Date.now() - start,
    queued,
  };
}

// ─── Batch expand all published topics that have no pending queue items ───────

export async function expandAllUnderservedTopics(
  limit = 5
): Promise<{ expanded: number; totalQueued: number; results: TopicExpansionResult[] }> {
  const supabase = createAdminClient();

  // Get published topics
  const { data: topics } = await supabase
    .from("topics")
    .select(`
      id, slug,
      topic_translations(title, language_code),
      categories(slug, category_translations(name, language_code))
    `)
    .eq("status", "published")
    .limit(limit);

  if (!topics?.length) return { expanded: 0, totalQueued: 0, results: [] };

  const results: TopicExpansionResult[] = [];
  let totalQueued = 0;

  for (const topic of topics) {
    const title = (topic.topic_translations as any[])?.find((t: any) => t.language_code === "en")?.title ?? topic.slug;
    const catName = (topic.categories as any)?.category_translations
      ?.find((t: any) => t.language_code === "en")?.name ?? "General";

    // Check if topic already has pending queue items
    const { count } = await supabase
      .from("content_generation_queue")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", topic.id)
      .in("status", ["pending", "pending_llm"]);

    if ((count ?? 0) >= 5) {
      console.log(`[KnowledgeExpansion] Skipping "${title}" — already has ${count} pending items`);
      continue;
    }

    try {
      const result = await expandTopic(topic.id, topic.slug, title, catName);
      results.push(result);
      totalQueued += result.queued;
      console.log(`[KnowledgeExpansion] "${title}" → ${result.queued} ideas queued`);
    } catch (err) {
      console.error(`[KnowledgeExpansion] Failed for "${title}":`, err);
    }
  }

  return { expanded: results.length, totalQueued, results };
}
