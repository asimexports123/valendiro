/**
 * Knowledge Assembler — Step 6: BUILD RELATIONSHIPS
 *
 * Responsibilities:
 * - Intra-package: fact-to-fact relationships (shared entities, ordering, prerequisites)
 * - Detect relationship types from structured patterns
 *
 * Rule: Relationships are NEVER invented.
 * They must be derived from structured knowledge or explicit rules.
 * Deterministic and glossary-aware.
 */

import type { KnowledgeRelationshipType, RelationshipStrength } from "@/lib/types";
import type { DeduplicatedFact, AssembledRelationship } from "./types";

// ─── Relationship Detection Patterns ─────────────────────────────────────────

interface RelationshipPattern {
  test: (factA: DeduplicatedFact, factB: DeduplicatedFact) => boolean;
  type: KnowledgeRelationshipType;
  strength: RelationshipStrength;
  explanation: (factA: DeduplicatedFact, factB: DeduplicatedFact) => string;
  bidirectional: boolean;
}

const PATTERNS: RelationshipPattern[] = [
  // Definition → Property: if A defines X and B describes a property of X
  {
    test: (a, b) => a.factType === "definition" && b.factType === "property" && shareSubject(a, b),
    type: "generalizes",
    strength: "strong",
    explanation: (a, _b) => `Definition "${truncate(a.statement)}" generalizes to properties`,
    bidirectional: false,
  },

  // Procedural ordering: if both are procedural and share subject
  {
    test: (a, b) => a.factType === "procedural" && b.factType === "procedural" && shareSubject(a, b),
    type: "precedes",
    strength: "moderate",
    explanation: (_a, _b) => "Sequential procedural steps",
    bidirectional: false,
  },

  // Warning → Rule: a warning relates to a rule
  {
    test: (a, b) => a.factType === "warning" && b.factType === "rule" && shareSubject(a, b),
    type: "related_to",
    strength: "moderate",
    explanation: (a, b) => `Warning "${truncate(a.statement)}" relates to rule "${truncate(b.statement)}"`,
    bidirectional: true,
  },

  // Causal: if A causes something mentioned in B
  {
    test: (a, b) => a.factType === "causal" && shareSubject(a, b) && a !== b,
    type: "causes",
    strength: "strong",
    explanation: (a, _b) => `Causal relationship from "${truncate(a.statement)}"`,
    bidirectional: false,
  },

  // Property → Property: properties of same subject are related
  {
    test: (a, b) => a.factType === "property" && b.factType === "property" && shareSubject(a, b),
    type: "related_to",
    strength: "weak",
    explanation: (_a, _b) => "Properties of the same subject",
    bidirectional: true,
  },

  // Prerequisite detection: if statement mentions "requires" or "needs"
  {
    test: (a, b) => /\brequires?\b|\bneeds?\b|\bprerequisite\b/i.test(a.statement) && mentionsSubject(a, b),
    type: "requires",
    strength: "strong",
    explanation: (a, b) => `"${truncate(a.statement)}" requires "${truncate(b.statement)}"`,
    bidirectional: false,
  },
];

// ─── Helper Functions ────────────────────────────────────────────────────────

function shareSubject(a: DeduplicatedFact, b: DeduplicatedFact): boolean {
  const wordsA = new Set(
    a.statement.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5)
  );
  const wordsB = new Set(
    b.statement.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5)
  );

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }

  // At least 2 significant words in common
  return overlap >= 2;
}

function mentionsSubject(fact: DeduplicatedFact, other: DeduplicatedFact): boolean {
  const otherWords = other.statement.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const factLower = fact.statement.toLowerCase();

  // At least one significant word from other appears in fact
  return otherWords.some(w => factLower.includes(w));
}

function truncate(s: string, len = 40): string {
  return s.length > len ? s.slice(0, len) + "..." : s;
}

// ─── Main Relationship Builder ───────────────────────────────────────────────

export function buildRelationships(facts: DeduplicatedFact[]): AssembledRelationship[] {
  const relationships: AssembledRelationship[] = [];
  const seen = new Set<string>(); // prevent duplicate relationships

  for (let i = 0; i < facts.length; i++) {
    for (let j = i + 1; j < facts.length; j++) {
      for (const pattern of PATTERNS) {
        // Test A → B
        if (pattern.test(facts[i], facts[j])) {
          const key = `${i}-${j}-${pattern.type}`;
          if (!seen.has(key)) {
            seen.add(key);
            relationships.push({
              sourceIndex: i,
              targetIndex: j,
              type: pattern.type,
              sourceLevel: "fact",
              targetLevel: "fact",
              strength: pattern.strength,
              explanation: pattern.explanation(facts[i], facts[j]),
              bidirectional: pattern.bidirectional,
            });
          }
          break; // only one relationship type per pair per direction
        }

        // Test B → A (if not bidirectional — bidirectional already covers both)
        if (!pattern.bidirectional && pattern.test(facts[j], facts[i])) {
          const key = `${j}-${i}-${pattern.type}`;
          if (!seen.has(key)) {
            seen.add(key);
            relationships.push({
              sourceIndex: j,
              targetIndex: i,
              type: pattern.type,
              sourceLevel: "fact",
              targetLevel: "fact",
              strength: pattern.strength,
              explanation: pattern.explanation(facts[j], facts[i]),
              bidirectional: pattern.bidirectional,
            });
          }
          break;
        }
      }
    }
  }

  return relationships;
}
