/**
 * Phase 5 operational re-assembly — Knowledge Acquisition & Synthesis Excellence
 *
 * Re-assembles representative packages with Phase 5 extraction improvements.
 * Compares BEFORE vs AFTER knowledge metrics and projection quality (unchanged engine).
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { exitLegacyPublishScript } from "./lib/legacyPublishRedirect";
exitLegacyPublishScript();

import { createClient } from "@supabase/supabase-js";
import { assemble } from "../services/knowledge/assembler";
import { rebuildCandidatesFromPackage, gatherCandidatesForTopic, mergeCandidateSets } from "../services/knowledge/multiSourceGatherer";
import { computeKnowledgePackageMetrics } from "../services/knowledge/knowledgePackageMetrics";
import { renderPackage } from "../services/render/engine";
import { publishRenderedOutput } from "../services/publish/service";
import { clearGlossaryCache } from "../services/knowledge/normalizer";

const DOMAINS = ["technology", "finance", "health", "travel", "business"];

interface PackageSnapshot {
  packageId: string;
  slug: string;
  domain: string;
  version: number;
  facts: number;
  relationships: number;
  citations: number;
  entities: number;
  factDensity: number;
  entityDensity: number;
  relationshipDensity: number;
  citationCoverage: number;
  multiSourceCoverage: number;
  completenessScore: number;
  confidenceScore: number;
  knowledgeRichness: number;
  factTypes: Record<string, number>;
  sampleFacts: string[];
}

interface Phase5Result {
  domain: string;
  slug: string;
  topicId: string;
  oldPackageId: string;
  newPackageId: string;
  oldVersion: number;
  newVersion: number;
  before: PackageSnapshot;
  after: PackageSnapshot;
  duplicatesMerged: number;
  conflictsDetected: number;
  assemblyDurationMs: number;
  projectionQualityScore?: number;
  projectionVersion?: string;
  validationPassed: boolean;
}

async function snapshotPackage(
  sb: ReturnType<typeof createClient>,
  packageId: string,
  slug: string,
  domain: string
): Promise<PackageSnapshot> {
  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("version, fact_count, relationship_count")
    .eq("id", packageId)
    .single();

  const { data: facts } = await sb
    .from("knowledge_facts")
    .select("id, statement, fact_type, confidence, tags")
    .eq("package_id", packageId);

  const { data: citations } = await sb
    .from("knowledge_citations")
    .select("id")
    .eq("package_id", packageId);

  const { data: rels } = await sb
    .from("knowledge_relationships")
    .select("relationship_type")
    .eq("package_id", packageId);

  const factRows = facts ?? [];
  const factTypes: Record<string, number> = {};
  for (const f of factRows) {
    factTypes[f.fact_type] = (factTypes[f.fact_type] ?? 0) + 1;
  }

  const entitySet = new Set<string>();
  for (const f of factRows) {
    for (const tag of f.tags ?? []) {
      entitySet.add(tag);
    }
  }

  const { data: evidence } = await sb
    .from("knowledge_evidence")
    .select("fact_id")
    .in("fact_id", factRows.map((f) => f.id).filter(Boolean) as string[]);

  const factsWithEvidence = new Set((evidence ?? []).map((e) => e.fact_id));

  const metrics = computeKnowledgePackageMetrics({
    facts: factRows.map((f) => ({
      statement: f.statement,
      normalizedStatement: f.statement.toLowerCase(),
      factType: f.fact_type,
      confidence: f.confidence,
      domain: null,
      scope: "contextual" as const,
      tags: f.tags ?? [],
      evidences: factsWithEvidence.has(f.id) ? [{ excerpt: f.statement, citationRef: "x" }] : [],
      provenances: [{ candidateId: "x", discoveryRunId: "x", adapterName: "x", sourceSlug: "x" }],
    })),
    relationships: (rels ?? []).map((_, i) => ({
      sourceIndex: i,
      targetIndex: i + 1,
      type: "related_to" as const,
      sourceLevel: "fact" as const,
      targetLevel: "fact" as const,
      strength: "moderate" as const,
      explanation: "",
      bidirectional: true,
    })),
    citations: (citations ?? []).map((c) => ({
      candidateId: c.id,
      sourceName: "",
      sourceUrl: null,
      adapterName: "",
      extractionMethod: "",
      sourceAuthority: "community" as const,
    })),
    conflicts: [],
  });

  return {
    packageId,
    slug,
    domain,
    version: pkg?.version ?? 0,
    facts: factRows.length,
    relationships: rels?.length ?? 0,
    citations: citations?.length ?? 0,
    entities: entitySet.size,
    factDensity: metrics.factDensity,
    entityDensity: metrics.entityDensity,
    relationshipDensity: metrics.relationshipDensity,
    citationCoverage: metrics.citationCoverage,
    multiSourceCoverage: metrics.multiSourceCoverage,
    completenessScore: metrics.completenessScore,
    confidenceScore: metrics.confidenceScore,
    knowledgeRichness: metrics.knowledgeRichness,
    factTypes,
    sampleFacts: factRows.slice(0, 5).map((f) => f.statement),
  };
}

async function main() {
  clearGlossaryCache();
  mkdirSync("temp", { recursive: true });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id, slug, topic_id, fact_count, version")
    .gte("fact_count", 8)
    .eq("status", "ready")
    .order("fact_count", { ascending: false });

  const selected: typeof packages = [];
  const used = new Set<string>();

  for (const domain of DOMAINS) {
    const match = (packages ?? []).find(
      (p) => !used.has(p.id) && p.slug?.toLowerCase().includes(domain)
    );
    if (match) {
      selected.push(match);
      used.add(match.id);
    }
  }

  for (const p of packages ?? []) {
    if (selected.length >= 5) break;
    if (!used.has(p.id)) {
      selected.push(p);
      used.add(p.id);
    }
  }

  const results: Phase5Result[] = [];

  for (const pkg of selected.slice(0, 5)) {
    const domain =
      DOMAINS.find((d) => pkg.slug?.includes(d)) ?? "general";

    console.log(`\n=== Re-assembling: ${pkg.slug} (${domain}) ===`);

    const before = await snapshotPackage(sb, pkg.id, pkg.slug, domain);

    const rebuilt = await rebuildCandidatesFromPackage(pkg.id);
    let candidates = rebuilt;

    if (pkg.topic_id) {
      const { candidates: topicCandidates } = await gatherCandidatesForTopic(pkg.topic_id);
      candidates = mergeCandidateSets(topicCandidates, rebuilt);
    }

    if (candidates.length === 0) {
      console.log("  SKIP: no candidates");
      continue;
    }

    const report = await assemble({
      slotId: null,
      topicId: pkg.topic_id,
      slug: pkg.slug,
      candidates,
    });

    const after = await snapshotPackage(sb, report.packageId, pkg.slug, domain);

    process.env.ALLOW_RENDER = "true";
    const renderResult = await renderPackage({
      packageId: report.packageId,
      format: "markdown",
      forceRerender: true,
    });

    if (renderResult.outputId) {
      await publishRenderedOutput(renderResult.outputId, "en");
    }

    const improved =
      after.knowledgeRichness >= before.knowledgeRichness ||
      after.facts >= before.facts ||
      after.relationships > before.relationships;

    results.push({
      domain,
      slug: pkg.slug,
      topicId: pkg.topic_id ?? "",
      oldPackageId: pkg.id,
      newPackageId: report.packageId,
      oldVersion: before.version,
      newVersion: after.version,
      before,
      after,
      duplicatesMerged: report.duplicatesMerged,
      conflictsDetected: report.conflictsDetected,
      assemblyDurationMs: report.durationMs,
      projectionQualityScore: renderResult.qualityScore,
      projectionVersion: renderResult.projectionVersion,
      validationPassed: improved && (report.qualityMetrics?.citationCoverage ?? 0) >= 90,
    });

    console.log(`  Facts: ${before.facts} → ${after.facts}`);
    console.log(`  Relationships: ${before.relationships} → ${after.relationships}`);
    console.log(`  Richness: ${before.knowledgeRichness} → ${after.knowledgeRichness}`);
    console.log(`  Citation coverage: ${after.citationCoverage}%`);
  }

  writeFileSync("temp/phase5-results.json", JSON.stringify(results, null, 2));
  console.log("\n=== Phase 5 Results ===");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
