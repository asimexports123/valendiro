/**
 * Phase 5 — Knowledge Package Quality Metrics
 *
 * Measures density, coverage, and richness of assembled knowledge.
 */

import type { FactConfidence } from "@/lib/types";
import type {
  AssembledRelationship,
  CitationRecord,
  ConflictRecord,
  DeduplicatedFact,
} from "./types";
import { extractEntitiesFromStatement } from "./entityExtractor";

export interface KnowledgePackageQualityMetrics {
  factCount: number;
  entityCount: number;
  relationshipCount: number;
  citationCount: number;
  sourceCount: number;

  /** Facts per 100 words of source text */
  factDensity: number;
  /** Unique entities per fact */
  entityDensity: number;
  /** Relationships per fact */
  relationshipDensity: number;
  /** Share of facts with at least one evidence citation (0–100) */
  citationCoverage: number;
  /** Share of facts corroborated by 2+ sources (0–100) */
  multiSourceCoverage: number;
  /** Conflicts detected vs fact pairs (0–100) */
  contradictionCoverage: number;

  completenessScore: number;
  confidenceScore: number;
  knowledgeRichness: number;

  factTypeDistribution: Record<string, number>;
  relationshipTypeDistribution: Record<string, number>;
  entityTypeDistribution: Record<string, number>;
}

const CONFIDENCE_WEIGHT: Record<FactConfidence, number> = {
  verified: 100,
  high: 85,
  medium: 65,
  low: 40,
  disputed: 30,
};

const COMPLETENESS_FACT_TYPES = [
  "definition",
  "property",
  "procedural",
  "warning",
  "rule",
  "historical",
  "causal",
  "comparison",
  "measurement",
];

export function computeKnowledgePackageMetrics(input: {
  facts: DeduplicatedFact[];
  relationships: AssembledRelationship[];
  citations: CitationRecord[];
  conflicts: ConflictRecord[];
  sourceWordCount?: number;
}): KnowledgePackageQualityMetrics {
  const { facts, relationships, citations, conflicts } = input;
  const sourceWordCount = input.sourceWordCount ?? estimateSourceWords(facts);

  const entityMap = new Map<string, string>();
  const entityTypeDistribution: Record<string, number> = {};
  const factTypeDistribution: Record<string, number> = {};

  let factsWithCitation = 0;
  let multiSourceFacts = 0;
  let confidenceSum = 0;

  for (const fact of facts) {
    factTypeDistribution[fact.factType] = (factTypeDistribution[fact.factType] ?? 0) + 1;

    if (fact.evidences.length > 0) factsWithCitation++;
    if (fact.provenances.length >= 2) multiSourceFacts++;
    confidenceSum += CONFIDENCE_WEIGHT[fact.confidence] ?? 50;

    for (const entity of extractEntitiesFromStatement(fact.statement)) {
      if (!entityMap.has(entity.slug)) {
        entityMap.set(entity.slug, entity.type);
        entityTypeDistribution[entity.type] = (entityTypeDistribution[entity.type] ?? 0) + 1;
      }
    }
  }

  const relationshipTypeDistribution: Record<string, number> = {};
  for (const rel of relationships) {
    relationshipTypeDistribution[rel.type] = (relationshipTypeDistribution[rel.type] ?? 0) + 1;
  }

  const factCount = facts.length;
  const entityCount = entityMap.size;
  const relationshipCount = relationships.length;
  const citationCount = citations.length;
  const sourceCount = citations.length;

  const factDensity =
    sourceWordCount > 0 ? Math.round((factCount / sourceWordCount) * 100 * 10) / 10 : 0;
  const entityDensity =
    factCount > 0 ? Math.round((entityCount / factCount) * 100) / 100 : 0;
  const relationshipDensity =
    factCount > 0 ? Math.round((relationshipCount / factCount) * 100) / 100 : 0;
  const citationCoverage =
    factCount > 0 ? Math.round((factsWithCitation / factCount) * 100) : 0;
  const multiSourceCoverage =
    factCount > 0 ? Math.round((multiSourceFacts / factCount) * 100) : 0;

  const maxPairs = factCount > 1 ? (factCount * (factCount - 1)) / 2 : 1;
  const contradictionCoverage =
    Math.round((conflicts.length / maxPairs) * 1000) / 10;

  const presentTypes = COMPLETENESS_FACT_TYPES.filter((t) => (factTypeDistribution[t] ?? 0) > 0);
  const completenessScore = Math.round((presentTypes.length / COMPLETENESS_FACT_TYPES.length) * 100);

  const confidenceScore =
    factCount > 0 ? Math.round(confidenceSum / factCount) : 0;

  const knowledgeRichness = Math.round(
    factDensity * 0.15 +
      entityDensity * 20 +
      relationshipDensity * 25 +
      citationCoverage * 0.2 +
      multiSourceCoverage * 0.15 +
      completenessScore * 0.15 +
      confidenceScore * 0.1
  );

  return {
    factCount,
    entityCount,
    relationshipCount,
    citationCount,
    sourceCount,
    factDensity,
    entityDensity,
    relationshipDensity,
    citationCoverage,
    multiSourceCoverage,
    contradictionCoverage,
    completenessScore,
    confidenceScore,
    knowledgeRichness,
    factTypeDistribution,
    relationshipTypeDistribution,
    entityTypeDistribution,
  };
}

function estimateSourceWords(facts: DeduplicatedFact[]): number {
  const excerpts = new Set<string>();
  for (const fact of facts) {
    for (const ev of fact.evidences) {
      excerpts.add(ev.excerpt);
    }
  }
  const text = Array.from(excerpts).join(" ");
  return text.split(/\s+/).filter(Boolean).length || facts.length * 20;
}
