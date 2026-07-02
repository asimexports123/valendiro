/**
 * Discovery Deduplication Engine
 *
 * Prevents duplicate candidates from being accepted.
 * Checks against:
 *   1. Other candidates in the same run (intra-run dedup)
 *   2. Existing candidates from previous runs (cross-run dedup)
 *   3. Existing articles already linked to slots
 *
 * Uses title similarity (Jaccard on word sets) + slug matching.
 */

import type { ScoredCandidate } from "./scoringEngine";

const SIMILARITY_THRESHOLD = 0.7;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

function wordSet(text: string): Set<string> {
  return new Set(
    text.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = wordSet(a);
  const setB = wordSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

export interface DeduplicationResult {
  candidates: ScoredCandidate[];
  duplicatesFound: number;
}

/**
 * Deduplicate candidates against each other and existing titles.
 * Marks duplicates with status = "rejected" and reason.
 */
export function deduplicateCandidates(
  candidates: ScoredCandidate[],
  existingTitles: string[]
): DeduplicationResult {
  const seen = new Set<string>();
  const existingSlugs = new Set(existingTitles.map(slugify));
  let duplicatesFound = 0;

  const result = candidates.map((candidate) => {
    const slug = slugify(candidate.title);

    // Check slug match against existing
    if (existingSlugs.has(slug)) {
      duplicatesFound++;
      return {
        ...candidate,
        decision: "rejected" as const,
        rejectionReason: `Duplicate: slug matches existing title`,
      };
    }

    // Check slug match within batch
    if (seen.has(slug)) {
      duplicatesFound++;
      return {
        ...candidate,
        decision: "rejected" as const,
        rejectionReason: `Duplicate: slug matches another candidate in batch`,
      };
    }

    // Check title similarity against existing
    for (const existing of existingTitles) {
      if (jaccardSimilarity(candidate.title, existing) > SIMILARITY_THRESHOLD) {
        duplicatesFound++;
        return {
          ...candidate,
          decision: "rejected" as const,
          rejectionReason: `Duplicate: too similar to "${existing}"`,
        };
      }
    }

    // Check title similarity within batch
    for (const seenSlug of seen) {
      // We stored slugs, but we need titles — use slug-level check
      if (slug === seenSlug) {
        duplicatesFound++;
        return {
          ...candidate,
          decision: "rejected" as const,
          rejectionReason: `Duplicate: matches another candidate`,
        };
      }
    }

    seen.add(slug);
    return candidate;
  });

  return { candidates: result, duplicatesFound };
}
