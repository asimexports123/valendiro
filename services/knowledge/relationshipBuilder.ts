/**
 * Knowledge Assembler — Step 6: BUILD RELATIONSHIPS (Phase 5 enhanced)
 *
 * Derives fact-to-fact relationships from structured patterns and shared entities.
 * Relationships are NEVER invented without pattern evidence.
 */

import type { KnowledgeRelationshipType, RelationshipStrength } from "@/lib/types";
import type { DeduplicatedFact, AssembledRelationship } from "./types";

interface RelationshipPattern {
  test: (factA: DeduplicatedFact, factB: DeduplicatedFact) => boolean;
  type: KnowledgeRelationshipType;
  strength: RelationshipStrength;
  explanation: (factA: DeduplicatedFact, factB: DeduplicatedFact) => string;
  bidirectional: boolean;
}

const PATTERNS: RelationshipPattern[] = [
  {
    test: (a, b) => a.factType === "definition" && b.factType === "property" && shareSubject(a, b),
    type: "generalizes",
    strength: "strong",
    explanation: (a) => `Definition "${truncate(a.statement)}" generalizes to related properties`,
    bidirectional: false,
  },
  {
    test: (a, b) => a.factType === "procedural" && b.factType === "procedural" && shareSubject(a, b),
    type: "precedes",
    strength: "moderate",
    explanation: () => "Sequential procedural steps",
    bidirectional: false,
  },
  {
    test: (a, b) => a.factType === "warning" && b.factType === "rule" && shareSubject(a, b),
    type: "related_to",
    strength: "moderate",
    explanation: (a, b) => `Warning relates to rule: ${truncate(b.statement)}`,
    bidirectional: true,
  },
  {
    test: (a, b) => a.factType === "causal" && shareSubject(a, b) && a !== b,
    type: "causes",
    strength: "strong",
    explanation: (a) => `Causal link from "${truncate(a.statement)}"`,
    bidirectional: false,
  },
  {
    test: (a, b) => a.factType === "property" && b.factType === "property" && shareSubject(a, b),
    type: "related_to",
    strength: "weak",
    explanation: () => "Properties of the same subject",
    bidirectional: true,
  },
  {
    test: (a, b) => /\brequires?\b|\bneeds?\b|\bprerequisite\b/i.test(a.statement) && mentionsSubject(a, b),
    type: "requires",
    strength: "strong",
    explanation: (a, b) => `"${truncate(a.statement)}" requires "${truncate(b.statement)}"`,
    bidirectional: false,
  },
  {
    test: (a, b) => /\bdepends on\b|\brelies on\b/i.test(a.statement) && mentionsSubject(a, b),
    type: "depends_on",
    strength: "strong",
    explanation: (a, b) => `"${truncate(a.statement)}" depends on "${truncate(b.statement)}"`,
    bidirectional: false,
  },
  {
    test: (a, b) => /\buses?\b|\bimplements?\b|\bbuilt with\b/i.test(a.statement) && mentionsSubject(a, b),
    type: "depends_on",
    strength: "moderate",
    explanation: (a, b) => `"${truncate(a.statement)}" uses "${truncate(b.statement)}"`,
    bidirectional: false,
  },
  {
    test: (a, b) => /\breplaces?\b|\bsupersedes?\b|\bdeprecated by\b/i.test(a.statement) && mentionsSubject(a, b),
    type: "replaces",
    strength: "strong",
    explanation: (a, b) => `"${truncate(a.statement)}" replaces "${truncate(b.statement)}"`,
    bidirectional: false,
  },
  {
    test: (a, b) => /\bpart of\b|\bcomponent of\b|\bsubset of\b/i.test(a.statement) && mentionsSubject(a, b),
    type: "part_of",
    strength: "strong",
    explanation: (a, b) => `"${truncate(a.statement)}" is part of "${truncate(b.statement)}"`,
    bidirectional: false,
  },
  {
    test: (a, b) => /\bcreated by\b|\bfounded by\b|\binvented by\b|\bdeveloped by\b/i.test(a.statement) && mentionsSubject(a, b),
    type: "related_to",
    strength: "moderate",
    explanation: (a, b) => `Creation attribution links "${truncate(a.statement)}" to "${truncate(b.statement)}"`,
    bidirectional: false,
  },
  {
    test: (a, b) => /\bcompetes with\b|\balternative to\b|\bvs\.?\b/i.test(a.statement) && mentionsSubject(a, b),
    type: "related_to",
    strength: "moderate",
    explanation: (a, b) => `Competitive/alternative relationship between related facts`,
    bidirectional: true,
  },
  {
    test: (a, b) => /\bintroduced in\b|\breleased in\b|\bestablished in\b/i.test(a.statement) && shareSubject(a, b),
    type: "precedes",
    strength: "moderate",
    explanation: () => "Temporal introduction ordering",
    bidirectional: false,
  },
  {
    test: (a, b) => a.factType === "definition" && b.factType === "definition" && shareEntityTag(a, b),
    type: "specializes",
    strength: "moderate",
    explanation: () => "Related definitions sharing an entity",
    bidirectional: false,
  },
  {
    test: (a, b) => a.factType === "historical" && b.factType === "definition" && shareEntityTag(a, b),
    type: "precedes",
    strength: "weak",
    explanation: () => "Historical context precedes current definition",
    bidirectional: false,
  },
  {
    test: (a, b) => shareEntityTag(a, b) && a.factType !== b.factType && !shareSubject(a, b),
    type: "related_to",
    strength: "weak",
    explanation: () => "Facts reference the same entity",
    bidirectional: true,
  },
];

function shareSubject(a: DeduplicatedFact, b: DeduplicatedFact): boolean {
  const wordsA = new Set(a.statement.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 6));
  const wordsB = new Set(b.statement.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 6));
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap >= 2;
}

function shareEntityTag(a: DeduplicatedFact, b: DeduplicatedFact): boolean {
  const tagsA = new Set(a.tags.filter((t) => t.length > 2));
  for (const tag of b.tags) {
    if (tagsA.has(tag)) return true;
  }
  return false;
}

function mentionsSubject(fact: DeduplicatedFact, other: DeduplicatedFact): boolean {
  const otherWords = other.statement.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
  const factLower = fact.statement.toLowerCase();
  return otherWords.some((w) => factLower.includes(w)) || shareEntityTag(fact, other);
}

function truncate(s: string, len = 40): string {
  return s.length > len ? `${s.slice(0, len)}...` : s;
}

export function buildRelationships(facts: DeduplicatedFact[]): AssembledRelationship[] {
  const relationships: AssembledRelationship[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < facts.length; i++) {
    for (let j = i + 1; j < facts.length; j++) {
      for (const pattern of PATTERNS) {
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
          break;
        }

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
