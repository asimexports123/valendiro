/**
 * Originality gate — block publish when output overlaps source text too much.
 */

const SHINGLE_SIZE = 5;
const MAX_SOURCE_OVERLAP = 0.14;

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
  overlappingSentences?: string[];
}

function normalizeSentence(s: string): string {
  return normalize(s);
}

/** Find article sentences that share long phrase runs with any source sentence. */
export function findSentenceOverlaps(article: string, sourceTexts: string[]): string[] {
  const articleSentences = article
    .replace(/^#+\s+/gm, "")
    .split(/[.!?]+\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);

  const sourceSentences: string[] = [];
  for (const src of sourceTexts) {
    if (!src?.trim()) continue;
    for (const s of src.split(/[.!?]+\s+/)) {
      const t = s.trim();
      if (t.length > 25) sourceSentences.push(t);
    }
  }

  const overlaps: string[] = [];
  for (const art of articleSentences) {
    const artNorm = normalizeSentence(art);
    const artWords = artNorm.split(" ").filter(Boolean);
    if (artWords.length < 6) continue;

    for (const src of sourceSentences) {
      const srcNorm = normalizeSentence(src);
      const srcWords = srcNorm.split(" ").filter(Boolean);
      if (srcWords.length < 6) continue;

      let maxRun = 0;
      for (let i = 0; i <= artWords.length - 6; i++) {
        for (let j = 0; j <= srcWords.length - 6; j++) {
          let run = 0;
          while (
            i + run < artWords.length &&
            j + run < srcWords.length &&
            artWords[i + run] === srcWords[j + run]
          ) {
            run++;
          }
          maxRun = Math.max(maxRun, run);
        }
      }

      if (maxRun >= 6) {
        overlaps.push(art.length > 120 ? `${art.slice(0, 117)}…` : art);
        break;
      }
    }
    if (overlaps.length >= 3) break;
  }

  return overlaps;
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

  const overlappingSentences =
    maxOverlap > MAX_SOURCE_OVERLAP ? findSentenceOverlaps(article, sourceTexts) : undefined;

  if (maxOverlap > MAX_SOURCE_OVERLAP) {
    const sentenceHint =
      overlappingSentences && overlappingSentences.length > 0
        ? `; overlapping sentences: ${overlappingSentences.map((s) => `"${s}"`).join("; ")}`
        : "";
    return {
      pass: false,
      maxOverlap,
      reason: `too similar to source material (${Math.round(maxOverlap * 100)}% phrase overlap)${sentenceHint}`,
      overlappingSentences,
    };
  }

  return {
    pass: true,
    maxOverlap,
    reason: "original enough to publish",
  };
}

export { MAX_SOURCE_OVERLAP };
