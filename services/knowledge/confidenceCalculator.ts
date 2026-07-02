/**
 * Knowledge Assembler — Step 5: CALCULATE CONFIDENCE
 *
 * Responsibilities:
 * - verified:  official source confirms
 * - high:      2+ independent sources agree
 * - medium:    1 authoritative source
 * - low:       1 community source only
 * - disputed:  sources contradict (set in Step 4)
 *
 * Deterministic: same evidence + citations = same confidence.
 * Facts already marked "disputed" by Step 4 are not overridden.
 */

import type { FactConfidence, SourceAuthority } from "@/lib/types";
import type { DeduplicatedFact, CitationRecord } from "./types";

// ─── Authority Hierarchy ─────────────────────────────────────────────────────

const AUTHORITY_RANK: Record<SourceAuthority, number> = {
  official: 5,
  academic: 4,
  encyclopedic: 3,
  community: 2,
  unknown: 1,
};

// ─── Main Confidence Calculation ─────────────────────────────────────────────

export function calculateConfidence(
  facts: DeduplicatedFact[],
  citations: CitationRecord[]
): DeduplicatedFact[] {
  return facts.map(fact => {
    // Don't override "disputed" — already set by conflict resolver
    if (fact.confidence === "disputed") return fact;

    const sourceCount = fact.evidences.length;
    const highestAuthority = getHighestAuthority(fact, citations);
    const authorityRank = AUTHORITY_RANK[highestAuthority];

    let confidence: FactConfidence;

    if (authorityRank >= 5 && sourceCount >= 1) {
      // Official source confirms
      confidence = "verified";
    } else if (sourceCount >= 2 && authorityRank >= 3) {
      // 2+ independent sources agree, at least encyclopedic
      confidence = "high";
    } else if (sourceCount >= 2) {
      // 2+ sources but lower authority
      confidence = "high";
    } else if (authorityRank >= 3) {
      // 1 authoritative source (encyclopedic or better)
      confidence = "medium";
    } else {
      // 1 community or unknown source
      confidence = "low";
    }

    return { ...fact, confidence };
  });
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function getHighestAuthority(
  fact: DeduplicatedFact,
  citations: CitationRecord[]
): SourceAuthority {
  let highest: SourceAuthority = "unknown";
  let highestRank = 0;

  for (const prov of fact.provenances) {
    const cit = citations.find(c => c.candidateId === prov.candidateId);
    if (cit) {
      const rank = AUTHORITY_RANK[cit.sourceAuthority];
      if (rank > highestRank) {
        highestRank = rank;
        highest = cit.sourceAuthority;
      }
    }
  }

  return highest;
}
