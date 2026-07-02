/**
 * Knowledge Assembler — Shared Types
 *
 * These types define the internal data structures used during assembly.
 * The assembler is the ONLY component allowed to create or modify Knowledge Packages.
 */

import type {
  FactType,
  FactConfidence,
  FactScope,
  SourceAuthority,
  KnowledgeRelationshipType,
  RelationshipLevel,
  RelationshipStrength,
} from "@/lib/types";

// ─── Assembly Input ──────────────────────────────────────────────────────────

export interface AssemblyInput {
  slotId: string | null;
  topicId: string | null;
  slug: string;
  candidates: CandidateInput[];
}

export interface CandidateInput {
  id: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  discoveryRunId: string;
  adapterName: string;
  sourceSlug: string;
  sourceAuthority: SourceAuthority;
  metadata: Record<string, unknown> | null;
}

// ─── Assembly Intermediates ──────────────────────────────────────────────────

export interface ExtractedFact {
  statement: string;
  factType: FactType;
  domain: string | null;
  scope: FactScope;
  tags: string[];
  evidence: {
    excerpt: string;
    citationRef: string; // references a CitationRecord by candidateId
  };
  provenance: {
    candidateId: string;
    discoveryRunId: string;
    adapterName: string;
    sourceSlug: string;
  };
}

export interface CitationRecord {
  candidateId: string;
  sourceName: string;
  sourceUrl: string | null;
  adapterName: string;
  extractionMethod: string;
  sourceAuthority: SourceAuthority;
}

export interface DeduplicatedFact {
  statement: string;
  normalizedStatement: string;
  factType: FactType;
  confidence: FactConfidence;
  domain: string | null;
  scope: FactScope;
  tags: string[];
  evidences: {
    excerpt: string;
    citationRef: string;
  }[];
  provenances: {
    candidateId: string;
    discoveryRunId: string;
    adapterName: string;
    sourceSlug: string;
  }[];
}

export interface AssembledRelationship {
  sourceIndex: number; // index into facts array
  targetIndex: number;
  type: KnowledgeRelationshipType;
  sourceLevel: RelationshipLevel;
  targetLevel: RelationshipLevel;
  strength: RelationshipStrength;
  explanation: string;
  bidirectional: boolean;
}

// ─── Assembly Report ─────────────────────────────────────────────────────────

export interface AssemblyReport {
  packageId: string;
  slug: string;
  version: number;
  knowledgeHash: string;
  status: "created" | "updated" | "unchanged";

  // Counts
  factsCreated: number;
  duplicatesMerged: number;
  conflictsDetected: number;
  relationshipsGenerated: number;
  glossaryNormalizations: number;
  citationsCreated: number;

  // Details
  conflicts: ConflictRecord[];
  normalizations: NormalizationRecord[];

  // Timing
  durationMs: number;
  assembledAt: string;
}

export interface ConflictRecord {
  factA: string;
  factB: string;
  resolution: "kept_both" | "authority_wins";
  reason: string;
}

export interface NormalizationRecord {
  original: string;
  normalized: string;
  glossaryEntry: string;
}
