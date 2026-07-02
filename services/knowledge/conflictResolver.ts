/**
 * Knowledge Assembler — Step 4: RESOLVE CONFLICTS
 *
 * Responsibilities:
 * - Detect contradicting facts (same subject, opposing predicates)
 * - Higher authority source wins (official > encyclopedic > community)
 * - If equal authority: keep both, mark "disputed", flag for review
 *
 * Rule: NEVER silently discard knowledge.
 * If two authoritative sources disagree, preserve both facts with their
 * confidence, evidence, and provenance.
 */

import type { SourceAuthority } from "@/lib/types";
import type { DeduplicatedFact, ConflictRecord, CitationRecord } from "./types";

// ─── Authority Hierarchy ─────────────────────────────────────────────────────

const AUTHORITY_RANK: Record<SourceAuthority, number> = {
  official: 5,
  academic: 4,
  encyclopedic: 3,
  community: 2,
  unknown: 1,
};

// ─── Contradiction Detection ─────────────────────────────────────────────────

const NEGATION_PATTERNS = [
  { positive: /\bis\b/i, negative: /\bis not\b|\bisn't\b/i },
  { positive: /\bcan\b/i, negative: /\bcannot\b|\bcan't\b/i },
  { positive: /\bsupports?\b/i, negative: /\bdoes not support\b|\bdoesn't support\b/i },
  { positive: /\brequires?\b/i, negative: /\bdoes not require\b|\bdoesn't require\b/i },
  { positive: /\ballows?\b/i, negative: /\bdoes not allow\b|\bdoesn't allow\b/i },
];

export function detectContradiction(factA: string, factB: string): boolean {
  const lowerA = factA.toLowerCase();
  const lowerB = factB.toLowerCase();

  // Extract subjects (first few significant words)
  const subjectA = extractSubject(lowerA);
  const subjectB = extractSubject(lowerB);

  // Subjects must be similar for contradiction
  if (subjectSimilarity(subjectA, subjectB) < 0.6) return false;

  // Check for negation patterns
  for (const { positive, negative } of NEGATION_PATTERNS) {
    if (positive.test(lowerA) && negative.test(lowerB)) return true;
    if (negative.test(lowerA) && positive.test(lowerB)) return true;
  }

  return false;
}

function extractSubject(statement: string): string {
  // Take words before the first verb-like pattern
  const match = statement.match(/^(.+?)\s+(is|are|was|were|has|have|can|does|supports?|requires?|allows?)\b/i);
  return match ? match[1] : statement.split(/\s+/).slice(0, 3).join(" ");
}

function subjectSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  const union = wordsA.size + wordsB.size - overlap;
  return union === 0 ? 0 : overlap / union;
}

// ─── Main Conflict Resolution ────────────────────────────────────────────────

export interface ConflictResolutionResult {
  facts: DeduplicatedFact[];
  conflicts: ConflictRecord[];
}

export function resolveConflicts(
  facts: DeduplicatedFact[],
  citations: CitationRecord[]
): ConflictResolutionResult {
  const conflicts: ConflictRecord[] = [];
  const result = [...facts];

  // Compare each pair of facts for contradictions
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const factA = result[i];
      const factB = result[j];

      if (detectContradiction(factA.statement, factB.statement)) {
        // Determine authority of each fact
        const authorityA = getHighestAuthority(factA, citations);
        const authorityB = getHighestAuthority(factB, citations);

        const rankA = AUTHORITY_RANK[authorityA];
        const rankB = AUTHORITY_RANK[authorityB];

        if (rankA > rankB) {
          // A wins — B gets lower confidence
          factB.confidence = "low";
          conflicts.push({
            factA: factA.statement,
            factB: factB.statement,
            resolution: "authority_wins",
            reason: `"${authorityA}" outranks "${authorityB}"`,
          });
        } else if (rankB > rankA) {
          // B wins — A gets lower confidence
          factA.confidence = "low";
          conflicts.push({
            factA: factA.statement,
            factB: factB.statement,
            resolution: "authority_wins",
            reason: `"${authorityB}" outranks "${authorityA}"`,
          });
        } else {
          // Equal authority — keep both, mark disputed
          factA.confidence = "disputed";
          factB.confidence = "disputed";
          conflicts.push({
            factA: factA.statement,
            factB: factB.statement,
            resolution: "kept_both",
            reason: `Equal authority ("${authorityA}") — both preserved as disputed`,
          });
        }
      }
    }
  }

  return { facts: result, conflicts };
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
