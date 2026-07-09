/**
 * Topic ↔ Article relevance scoring.
 * Articles only attach to catalog topics when content actually matches.
 */

import { scoreNewsSignals } from "@/services/admission/admissionRules";

export const MIN_PRIMARY_RELEVANCE = 0.42;
export const MIN_RELATED_RELEVANCE = 0.28;

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "about", "what", "how", "your", "that", "this",
  "are", "was", "will", "have", "has", "into", "when", "where", "which", "their",
  "fundamentals", "guide", "introduction",
]);

export interface ArticleRelevanceInput {
  title: string;
  content?: string | null;
  summary?: string | null;
}

export interface TopicRelevanceResult {
  score: number;
  pass: boolean;
  reason: string;
}

function topicKeywords(slug: string, title: string): string[] {
  const words = new Set<string>();
  for (const w of slug.split("-")) {
    if (w.length > 2) words.add(w.toLowerCase());
  }
  for (const w of title.toLowerCase().split(/\W+/)) {
    if (w.length > 3 && !STOP_WORDS.has(w)) words.add(w);
  }
  return [...words];
}

function keywordOverlap(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) hits++;
  }
  return hits / keywords.length;
}

function titleSimilarity(articleTitle: string, topicTitle: string): number {
  const a = new Set(articleTitle.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  const b = new Set(topicTitle.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = [...a].filter((w) => b.has(w));
  return intersection.length / new Set([...a, ...b]).size;
}

/** Score how well an article belongs on a catalog topic page. */
export function scoreArticleToTopic(
  article: ArticleRelevanceInput,
  topicSlug: string,
  topicTitle: string
): TopicRelevanceResult {
  const keywords = topicKeywords(topicSlug, topicTitle);
  const combined = [article.title, article.summary, article.content].filter(Boolean).join(" ").slice(0, 6000);
  const overlap = keywordOverlap(combined, keywords);
  const titleSim = titleSimilarity(article.title, topicTitle);
  const newsScore = scoreNewsSignals(article.title);

  let score = overlap * 0.55 + titleSim * 0.35;

  const slugPhrase = topicSlug.replace(/-/g, " ");
  if (combined.toLowerCase().includes(slugPhrase)) score += 0.15;
  if (article.title.toLowerCase().includes(slugPhrase)) score += 0.1;

  score = Math.min(score, 1);

  if (newsScore >= 0.5) {
    return {
      score,
      pass: false,
      reason: "news headline — not evergreen topic content",
    };
  }

  if (score >= MIN_PRIMARY_RELEVANCE) {
    return { score, pass: true, reason: "strong article–topic match" };
  }

  if (score >= MIN_RELATED_RELEVANCE && newsScore < 0.35) {
    return { score, pass: true, reason: "related topic match (secondary)" };
  }

  return {
    score,
    pass: false,
    reason: `weak match (${Math.round(score * 100)}%) — wrong topic for this article`,
  };
}

export function isPrimaryMatch(result: TopicRelevanceResult): boolean {
  return result.pass && result.score >= MIN_PRIMARY_RELEVANCE;
}

export function isRelatedMatch(result: TopicRelevanceResult): boolean {
  return result.pass && result.score >= MIN_RELATED_RELEVANCE;
}
