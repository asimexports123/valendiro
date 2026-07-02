/**
 * Knowledge Assembler — Step 7: VERSION
 *
 * Responsibilities:
 * - Compute knowledgeHash from facts + relationships
 * - If existing package and hash changed → increment version, mark downstream stale
 * - If existing package and hash unchanged → update lastVerifiedAt only
 * - If new package → version = 1
 *
 * Rule: Only semantic knowledge changes affect the hash.
 * Pure metadata updates (timestamps, verification runs) do NOT change the hash.
 */

import { createHash } from "crypto";
import type { DeduplicatedFact, AssembledRelationship } from "./types";

// ─── Hash Computation ────────────────────────────────────────────────────────

export function computeKnowledgeHash(
  facts: DeduplicatedFact[],
  relationships: AssembledRelationship[]
): string {
  // Sort facts by normalized statement for deterministic ordering
  const factsPayload = facts
    .map(f => f.normalizedStatement)
    .sort()
    .join("|");

  // Sort relationships by source-type-target for deterministic ordering
  const relsPayload = relationships
    .map(r => `${r.sourceIndex}:${r.type}:${r.targetIndex}`)
    .sort()
    .join("|");

  const combined = factsPayload + "||" + relsPayload;
  return createHash("sha256").update(combined).digest("hex");
}

// ─── Version Decision ────────────────────────────────────────────────────────

export interface VersionDecision {
  action: "create" | "update" | "unchanged";
  version: number;
  knowledgeHash: string;
  previousHash: string | null;
}

export function decideVersion(
  newHash: string,
  existingPackage: { version: number; knowledge_hash: string } | null
): VersionDecision {
  if (!existingPackage) {
    // New package
    return {
      action: "create",
      version: 1,
      knowledgeHash: newHash,
      previousHash: null,
    };
  }

  if (existingPackage.knowledge_hash === newHash) {
    // No semantic change — only update verification timestamp
    return {
      action: "unchanged",
      version: existingPackage.version,
      knowledgeHash: newHash,
      previousHash: existingPackage.knowledge_hash,
    };
  }

  // Knowledge changed — increment version
  return {
    action: "update",
    version: existingPackage.version + 1,
    knowledgeHash: newHash,
    previousHash: existingPackage.knowledge_hash,
  };
}
