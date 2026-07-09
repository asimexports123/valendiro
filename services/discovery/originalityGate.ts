/**
 * Originality gate — block publish when output overlaps source text too much.
 */

const SHINGLE_SIZE = 5;
const MAX_SOURCE_OVERLAP = 0.12;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shingles(text: string): Set<string> {
  const words = normalize(text).split(" ").filter(Boolean);
  const set = new Set<string>();
  if (words.length < SHINGLE_SIZE) {
    if (words.length > 0) set.add(words.join(" "));
    return set;
  }
  for (let i = 0; i <= words.length - SHINGLE_SIZE; i++) {
    set.add(words.slice(i, i + SHINGLE_SIZE).join(" "));
  }
  return set;
}

function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (a.size === 0) return 0;
  let shared = 0;
  for (const s of a) {
    if (b.has(s)) shared++;
  }
  return shared / a.size;
}

export interface OriginalityResult {
  pass: boolean;
  maxOverlap: number;
  reason: string;
}

/** Reject if rewritten article shares too many phrases with any source document. */
export function evaluateOriginality(article: string, sourceTexts: string[]): OriginalityResult {
  const articleShingles = shingles(article);
  if (articleShingles.size === 0) {
    return { pass: false, maxOverlap: 1, reason: "empty article" };
  }

  let maxOverlap = 0;
  for (const source of sourceTexts) {
    if (!source?.trim()) continue;
    const ratio = overlapRatio(articleShingles, shingles(source));
    maxOverlap = Math.max(maxOverlap, ratio);
  }

  if (maxOverlap > MAX_SOURCE_OVERLAP) {
    return {
      pass: false,
      maxOverlap,
      reason: `too similar to source material (${Math.round(maxOverlap * 100)}% phrase overlap)`,
    };
  }

  return {
    pass: true,
    maxOverlap,
    reason: "original enough to publish",
  };
}

export { MAX_SOURCE_OVERLAP };
