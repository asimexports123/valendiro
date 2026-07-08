/**
 * Knowledge Assembler — Main Orchestrator
 *
 * The ONLY component allowed to create or modify Knowledge Packages.
 * Runs the 8-step pipeline:
 *   1. Normalize   (via Domain Glossary)
 *   2. Extract     (→ atomic facts + provenance)
 *   3. Deduplicate (merge evidence, don't discard)
 *   4. Resolve conflicts (authority-based, never discard)
 *   5. Calculate confidence (evidence-based)
 *   6. Build relationships (deterministic, pattern-based)
 *   7. Version + hash (only semantic changes increment)
 *   8. Persist (store package with full provenance)
 *
 * Produces a detailed AssemblyReport for auditability.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { AssemblyInput, AssemblyReport, CitationRecord, DeduplicatedFact } from "./types";
import { extractFacts } from "./factExtractor";
import { deduplicateFacts } from "./factDeduplicator";
import { resolveConflicts } from "./conflictResolver";
import { calculateConfidence } from "./confidenceCalculator";
import { buildRelationships } from "./relationshipBuilder";
import { computeKnowledgeHash, decideVersion } from "./packageVersioner";
import { computeKnowledgePackageMetrics } from "./knowledgePackageMetrics";
import { enqueueJob } from "@/jobs/queues/jobQueue";
import {
  archivePackage,
  findLatestPackageBySlug,
  insertPackage,
  touchPackageVerified,
} from "./packageService";
import { filterRelevantCandidates } from "./relevanceGate";

// ─── Main Assemble Function ──────────────────────────────────────────────────

export async function assemble(input: AssemblyInput): Promise<AssemblyReport> {
  const startTime = Date.now();
  const sb = createAdminClient();

  // Relevance gate — any source OK, wrong-topic fuel rejected
  const { kept: candidates } = filterRelevantCandidates(input.candidates, input.slug);

  if (candidates.length === 0) {
    throw new Error(`No relevant candidates for topic ${input.slug} after relevance gate`);
  }

  // ─── Step 1 + 2: Extract (normalization happens inside extractFacts) ───────

  const {
    facts: extractedFacts,
    citations,
    normalizations,
    sourceWordCount,
  } = await extractFacts(candidates);

  // ─── Step 3: Deduplicate ───────────────────────────────────────────────────

  const { facts: dedupedFacts, duplicatesMerged } = deduplicateFacts(extractedFacts);

  // ─── Step 4: Resolve Conflicts ─────────────────────────────────────────────

  const { facts: resolvedFacts, conflicts } = resolveConflicts(dedupedFacts, citations);

  // ─── Step 5: Calculate Confidence ──────────────────────────────────────────

  const finalFacts = calculateConfidence(resolvedFacts, citations);

  // ─── Step 6: Build Relationships ───────────────────────────────────────────

  const relationships = buildRelationships(finalFacts);

  const qualityMetrics = computeKnowledgePackageMetrics({
    facts: finalFacts,
    relationships,
    citations,
    conflicts,
    sourceWordCount,
  });

  // ─── Step 7: Version ───────────────────────────────────────────────────────

  const newHash = computeKnowledgeHash(finalFacts, relationships);

  // Check for existing package
  const { data: existingPkg } = await findLatestPackageBySlug(input.slug);

  const versionDecision = decideVersion(
    newHash,
    existingPkg ? { version: existingPkg.version, knowledge_hash: existingPkg.knowledge_hash } : null
  );

  // ─── Step 8: Persist ───────────────────────────────────────────────────────

  let packageId: string;

  if (versionDecision.action === "unchanged" && existingPkg) {
    // Only update verification timestamp
    packageId = existingPkg.id;
    await touchPackageVerified(existingPkg.id);
  } else if (versionDecision.action === "update" && existingPkg) {
    await archivePackage(existingPkg.id);

    // Create new version
    packageId = await persistNewPackage(sb, input, versionDecision, finalFacts, citations, relationships);
  } else {
    // Create first version
    packageId = await persistNewPackage(sb, input, versionDecision, finalFacts, citations, relationships);
  }

  // ─── Build Report ──────────────────────────────────────────────────────────

  const durationMs = Date.now() - startTime;

  const report: AssemblyReport = {
    packageId,
    slug: input.slug,
    version: versionDecision.version,
    knowledgeHash: versionDecision.knowledgeHash,
    status: versionDecision.action === "unchanged" ? "unchanged" : versionDecision.action === "update" ? "updated" : "created",
    factsCreated: finalFacts.length,
    duplicatesMerged,
    conflictsDetected: conflicts.length,
    relationshipsGenerated: relationships.length,
    glossaryNormalizations: normalizations.length,
    citationsCreated: citations.length,
    qualityMetrics,
    conflicts,
    normalizations,
    durationMs,
    assembledAt: new Date().toISOString(),
  };

  return report;
}

// ─── Persist Helper ──────────────────────────────────────────────────────────

async function persistNewPackage(
  sb: ReturnType<typeof createAdminClient>,
  input: AssemblyInput,
  versionDecision: { version: number; knowledgeHash: string },
  facts: DeduplicatedFact[],
  citations: CitationRecord[],
  relationships: ReturnType<typeof buildRelationships>
): Promise<string> {
  const packageId = await insertPackage({
    hub_slot_id: input.slotId,
    topic_id: input.topicId,
    slug: input.slug,
    version: versionDecision.version,
    knowledge_hash: versionDecision.knowledgeHash,
    source_count: citations.length,
    fact_count: facts.length,
    relationship_count: relationships.length,
    discovery_run_ids: [...new Set(input.candidates.map((c) => c.discoveryRunId))],
    status: "ready",
  });

  // Enqueue job for knowledge acquisition (facts, citations, relationships)
  // This ensures the package is populated with content before being used for rendering
  // Note: Using "content_refresh" as it's a valid job type in the database constraint
  if (input.topicId) {
    try {
      await enqueueJob({
        objectId: input.topicId,
        objectType: "topic",
        jobType: "content_refresh" as any, // Type assertion: database constraint differs from JobType definition
        priority: 10,
        payload: { packageId, slug: input.slug }
      });
    } catch (error) {
      console.error(`Failed to enqueue knowledge-acquisition job for package ${packageId}:`, error);
      // Don't throw - package is created, job enqueue is best-effort
    }
  }

  // 2. Create citations
  const citationIdMap = new Map<string, string>(); // candidateId → citation UUID

  for (const cit of citations) {
    const { data: citRow } = await sb
      .from("knowledge_citations")
      .insert({
        package_id: packageId,
        source_name: cit.sourceName,
        source_url: cit.sourceUrl,
        adapter_name: cit.adapterName,
        extraction_method: cit.extractionMethod,
        source_authority: cit.sourceAuthority,
      })
      .select("id")
      .single();

    if (citRow) {
      citationIdMap.set(cit.candidateId, citRow.id);
    }
  }

  // 3. Create facts + evidence + provenance
  for (const fact of facts) {
    const { data: factRow } = await sb
      .from("knowledge_facts")
      .insert({
        package_id: packageId,
        statement: fact.statement,
        fact_type: fact.factType,
        confidence: fact.confidence,
        domain: fact.domain,
        scope: fact.scope,
        tags: fact.tags,
      })
      .select("id")
      .single();

    if (!factRow) continue;

    // Evidence
    for (const ev of fact.evidences) {
      const citationId = citationIdMap.get(ev.citationRef);
      if (citationId) {
        await sb.from("knowledge_evidence").insert({
          fact_id: factRow.id,
          citation_id: citationId,
          excerpt: ev.excerpt,
        });
      }
    }

    // Provenance
    for (const prov of fact.provenances) {
      // Only set FK fields if they look like valid UUIDs (avoid FK constraint violations)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      await sb.from("knowledge_provenance").insert({
        fact_id: factRow.id,
        discovery_run_id: isUUID.test(prov.discoveryRunId) ? prov.discoveryRunId : null,
        discovery_candidate_id: isUUID.test(prov.candidateId) ? prov.candidateId : null,
        adapter_name: prov.adapterName,
        source_slug: prov.sourceSlug,
      });
    }
  }

  // 4. Create relationships
  // We need fact IDs — fetch them in order
  const { data: factRows } = await sb
    .from("knowledge_facts")
    .select("id")
    .eq("package_id", packageId)
    .order("created_at");

  if (factRows && factRows.length > 0) {
    for (const rel of relationships) {
      if (rel.sourceIndex < factRows.length && rel.targetIndex < factRows.length) {
        await sb.from("knowledge_relationships").insert({
          source_id: factRows[rel.sourceIndex].id,
          source_level: rel.sourceLevel,
          target_id: factRows[rel.targetIndex].id,
          target_level: rel.targetLevel,
          relationship_type: rel.type,
          strength: rel.strength,
          explanation: rel.explanation,
          bidirectional: rel.bidirectional,
        });
      }
    }
  }

  return packageId;
}
