/**
 * Knowledge Assembler — Step 3: DEDUPLICATE
 *
 * Responsibilities:
 * - Slug-match: identical slugified statements
 * - Semantic-match: Jaccard similarity > threshold
 * - On duplicate: merge evidence arrays (one fact, multiple evidence sources)
 * - Higher source count = higher confidence
 *
 * Rule: Never silently discard knowledge. Duplicates are MERGED, not removed.
 */

import type { ExtractedFact, DeduplicatedFact } from "./types";
import type { FactConfidence } from "@/lib/types";

// ─── Slugification ───────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

// ─── Jaccard Similarity ──────────────────────────────────────────────────────

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Similarity Threshold ────────────────────────────────────────────────────

const SIMILARITY_THRESHOLD = 0.75;

// ─── Confidence from Source Count ────────────────────────────────────────────

export function calculateConfidenceFromSources(sourceCount: number): FactConfidence {
  if (sourceCount >= 3) return "verified";
  if (sourceCount >= 2) return "high";
  return "medium";
}

// ─── Main Deduplicate Function ───────────────────────────────────────────────

export interface DeduplicationResult {
  facts: DeduplicatedFact[];
  duplicatesMerged: number;
}

export function deduplicateFacts(extractedFacts: ExtractedFact[]): DeduplicationResult {
  const deduped: DeduplicatedFact[] = [];
  let duplicatesMerged = 0;

  for (const fact of extractedFacts) {
    const factSlug = slugify(fact.statement);

    // Check if this fact already exists in deduped list
    let merged = false;

    for (const existing of deduped) {
      const existingSlug = slugify(existing.statement);

      // Exact slug match
      if (factSlug === existingSlug) {
        mergeInto(existing, fact);
        duplicatesMerged++;
        merged = true;
        break;
      }

      // Semantic similarity match
      const similarity = jaccardSimilarity(fact.statement, existing.statement);
      if (similarity >= SIMILARITY_THRESHOLD) {
        mergeInto(existing, fact);
        duplicatesMerged++;
        merged = true;
        break;
      }
    }

    if (!merged) {
      // New unique fact
      deduped.push({
        statement: fact.statement,
        normalizedStatement: factSlug,
        factType: fact.factType,
        confidence: "medium", // will be recalculated in Step 5
        domain: fact.domain,
        scope: fact.scope,
        tags: [...fact.tags],
        evidences: [fact.evidence],
        provenances: [fact.provenance],
      });
    }
  }

  return { facts: deduped, duplicatesMerged };
}

// ─── Merge Helper ────────────────────────────────────────────────────────────

function mergeInto(existing: DeduplicatedFact, incoming: ExtractedFact): void {
  // Add evidence if from a different source
  const alreadyHasEvidence = existing.evidences.some(
    e => e.citationRef === incoming.evidence.citationRef
  );
  if (!alreadyHasEvidence) {
    existing.evidences.push(incoming.evidence);
  }

  // Add provenance if from a different candidate
  const alreadyHasProvenance = existing.provenances.some(
    p => p.candidateId === incoming.provenance.candidateId
  );
  if (!alreadyHasProvenance) {
    existing.provenances.push(incoming.provenance);
  }

  // Merge tags (union)
  for (const tag of incoming.tags) {
    if (!existing.tags.includes(tag)) {
      existing.tags.push(tag);
    }
  }
}
