/**
 * Topic Resolver — maps discovered internet content to the existing topic catalog.
 *
 * Without this, RSS articles spawn orphan draft topics and the 362-topic catalog
 * never receives new fuel. This is the bridge between discovery and enrichment.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { generateCanonicalSlug } from "./canonicalTopicService";

export interface CatalogTopic {
  id: string;
  slug: string;
  title: string;
  wordCount: number;
  factCount: number;
}

export interface TopicMatch {
  topic: CatalogTopic;
  confidence: number;
  method: "slug_exact" | "title_fuzzy" | "keyword_score" | "category_signal";
}

let topicIndexCache: { topics: CatalogTopic[]; loadedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function loadTopicIndex(): Promise<CatalogTopic[]> {
  if (topicIndexCache && Date.now() - topicIndexCache.loadedAt < CACHE_TTL_MS) {
    return topicIndexCache.topics;
  }

  const sb = createAdminClient();
  const { data: rows } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title, content)")
    .eq("status", "published")
    .eq("topic_translations.language_code", "en");

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

  const topics: CatalogTopic[] = (rows ?? []).map((r) => {
    const trans = r.topic_translations?.[0];
    const content = trans?.content ?? "";
    return {
      id: r.id,
      slug: r.slug,
      title: trans?.title ?? r.slug,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      factCount: factByTopic.get(r.id) ?? 0,
    };
  });

  topicIndexCache = { topics, loadedAt: Date.now() };
  return topics;
}

const TOPIC_ALIASES: Record<string, string[]> = {
  "nodejs-cluster": ["node.js", "nodejs", "node js", "cluster module", "cluster worker"],
  "javascript-fundamentals": ["javascript", "js fundamentals", "ecmascript"],
  "html-fundamentals": ["html", "hypertext markup"],
  "css-fundamentals": ["css", "cascading style"],
  "restful-apis": ["rest api", "restful", "http api"],
  "git-version-control": ["git", "version control", "github"],
  "index-funds": ["index fund", "passive investing", "etf"],
  "health-insurance": ["health insurance", "medical insurance", "healthcare coverage"],
  budgeting: ["budget", "budgeting", "personal budget"],
  "travel-planning": ["travel plan", "trip planning", "itinerary"],
};

function aliasBoost(articleText: string, slug: string): number {
  const aliases = TOPIC_ALIASES[slug];
  if (!aliases) return 0;
  const text = articleText.toLowerCase();
  for (const alias of aliases) {
    if (text.includes(alias)) return 0.45;
  }
  return 0;
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter((w) => wordsB.has(w));
  return intersection.length / new Set([...wordsA, ...wordsB]).size;
}

function keywordScore(articleText: string, topic: CatalogTopic): number {
  const text = articleText.toLowerCase();
  let score = 0;

  const slugPhrase = topic.slug.replace(/-/g, " ");
  if (text.includes(slugPhrase)) score += 0.55;
  if (text.includes(topic.slug)) score += 0.25;

  const slugWords = topic.slug.split("-").filter((w) => w.length > 2);
  const textWords = new Set(text.split(/\W+/));
  for (const w of slugWords) {
    if (textWords.has(w)) score += 0.12;
  }

  score += wordOverlap(articleText, topic.title) * 0.4;
  score += aliasBoost(articleText, topic.slug);

  // Boost thin topics that need fuel
  if (topic.wordCount < 600) score += 0.05;

  return Math.min(score, 1);
}

/** Resolve a discovered article to one or more catalog topics. */
export async function resolveArticleToCatalogTopics(input: {
  title: string;
  content?: string | null;
  summary?: string | null;
  url?: string;
  admissionNewsScore?: number;
  enrichmentHints?: string[];
}): Promise<TopicMatch[]> {
  const articleText = [input.title, input.summary, input.content].filter(Boolean).join(" ");
  const canonicalSlug = generateCanonicalSlug(input.title);
  const topics = await loadTopicIndex();
  const matches: TopicMatch[] = [];
  const newsPenalty = (input.admissionNewsScore ?? 0) * 0.35;

  // Boost admission hints (e.g. GitHub update → git-version-control)
  if (input.enrichmentHints?.length) {
    for (const hintSlug of input.enrichmentHints) {
      const hinted = topics.find((t) => t.slug === hintSlug);
      if (hinted) {
        matches.push({ topic: hinted, confidence: 0.72, method: "category_signal" });
      }
    }
  }

  // Exact slug match — penalize if headline looks like news
  const exact = topics.find((t) => t.slug === canonicalSlug);
  if (exact) {
    const conf = Math.max(0.1, 0.98 - newsPenalty);
    matches.push({ topic: exact, confidence: conf, method: "slug_exact" });
  }

  // Fuzzy title match
  for (const topic of topics) {
    if (matches.some((m) => m.topic.id === topic.id)) continue;
    const sim = wordOverlap(input.title, topic.title);
    if (sim >= 0.75) {
      matches.push({ topic, confidence: sim, method: "title_fuzzy" });
    }
  }

  // Keyword scoring across catalog
  const scored = topics
    .filter((t) => !matches.some((m) => m.topic.id === t.id))
    .map((t) => ({ topic: t, score: keywordScore(articleText, t) }))
    .filter((s) => s.score >= 0.42)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  for (const s of scored) {
    matches.push({ topic: s.topic, confidence: Math.max(0.1, s.score - newsPenalty), method: "keyword_score" });
  }

  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

/** Pick the primary topic for assembly — prefer thin catalog topics over creating orphans. */
export async function resolvePrimaryTopic(input: {
  title: string;
  content?: string | null;
  summary?: string | null;
  admissionNewsScore?: number;
}): Promise<TopicMatch | null> {
  const matches = await resolveArticleToCatalogTopics(input);
  if (matches.length === 0) return null;

  // Prefer existing thin topics when confidence is reasonable
  const thin = matches.find((m) => m.topic.wordCount < 800 && m.confidence >= 0.4);
  if (thin) return thin;

  return matches[0];
}

export function clearTopicIndexCache(): void {
  topicIndexCache = null;
}

/** Topics that need enrichment (thin content, have or could have sources). */
export async function findThinTopics(limit = 30): Promise<CatalogTopic[]> {
  const topics = await loadTopicIndex();
  return topics
    .filter((t) => t.wordCount < 800 || t.factCount < 15)
    .sort((a, b) => a.wordCount - b.wordCount)
    .slice(0, limit);
}
