/**
 * Shared filters for reader-facing topic navigation.
 * Goal: only surface real topic pages, not extracted tokens or filler words.
 */

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "before",
  "by",
  "can",
  "common",
  "connect",
  "connected",
  "each",
  "etc",
  "every",
  "extra",
  "for",
  "formal",
  "from",
  "have",
  "here",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "like",
  "more",
  "not",
  "of",
  "on",
  "or",
  "other",
  "our",
  "out",
  "over",
  "real",
  "related",
  "same",
  "show",
  "showing",
  "some",
  "than",
  "that",
  "the",
  "their",
  "then",
  "there",
  "these",
  "this",
  "those",
  "to",
  "too",
  "under",
  "use",
  "used",
  "using",
  "via",
  "we",
  "what",
  "when",
  "where",
  "which",
  "why",
  "with",
  "within",
]);

const VERBISH = new Set([
  "according",
  "additional",
  "begin",
  "build",
  "built",
  "check",
  "choose",
  "compare",
  "continue",
  "contribute",
  "cover",
  "create",
  "describes",
  "design",
  "develop",
  "drive",
  "explain",
  "focus",
  "help",
  "improve",
  "include",
  "inform",
  "learn",
  "look",
  "make",
  "measure",
  "need",
  "provide",
  "reduce",
  "show",
  "start",
  "study",
  "support",
  "understand",
  "update",
  "write",
]);

const GENERIC_TOKENS = new Set([
  "additional",
  "according",
  "common",
  "concept",
  "connect",
  "each",
  "extra",
  "formal",
  "general",
  "interesting",
  "key",
  "main",
  "next",
  "other",
  "practical",
  "relevant",
  "similar",
]);

export function normalizeTopicLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

export function titleWords(label: string): string[] {
  return normalizeTopicLabel(label).split(" ").filter(Boolean);
}

function isAcronymish(label: string): boolean {
  const cleaned = label.replace(/[^a-z0-9]/gi, "");
  return /^[A-Z0-9]{2,8}$/.test(label) || /^[a-z0-9]{2,8}$/.test(cleaned) && cleaned.length <= 5;
}

export function isUsefulTopicLabel(label: string, slug?: string): boolean {
  const words = titleWords(label);
  if (words.length === 0) return false;
  if (slug && slug.trim().length === 0) return false;

  if (isAcronymish(label)) return true;
  if (words.length === 1) {
    const w = words[0]!;
    if (STOP_WORDS.has(w) || VERBISH.has(w) || GENERIC_TOKENS.has(w)) return false;
    return w.length >= 3;
  }

  const meaningful = words.filter((w) => !STOP_WORDS.has(w) && !VERBISH.has(w) && !GENERIC_TOKENS.has(w));
  if (meaningful.length === 0) return false;
  if (meaningful.length === 1 && meaningful[0]!.length < 4) return false;
  if (words.length > 6) return false;
  return true;
}

export function topicRelevanceScore(query: string, candidateTitle: string, candidateSlug: string, extra = 0): number {
  const queryWords = titleWords(query).filter((w) => !STOP_WORDS.has(w) && !VERBISH.has(w));
  const candidate = normalizeTopicLabel(`${candidateTitle} ${candidateSlug}`);
  let score = extra;
  for (const word of queryWords) {
    if (candidate.includes(word)) score += word.length >= 5 ? 12 : 8;
  }

  const titleWordsList = titleWords(candidateTitle);
  if (titleWordsList.length <= 3) score += 4;
  if (isAcronymish(candidateTitle)) score += 8;
  if (/^(how to|what is|why|common|best|guide|intro|overview)/i.test(candidateTitle)) score -= 10;
  if (candidateTitle.length > 40) score -= 10;
  return score;
}

export function dedupeBySlug<T extends { slug: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}
