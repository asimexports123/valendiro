/**
 * Phase 9 Verification: Knowledge Assembler
 *
 * Tests the full 8-step pipeline end-to-end:
 * 1. Load existing discovery candidates from DB
 * 2. Run assembler to create a Knowledge Package
 * 3. Verify facts, citations, evidence, provenance, relationships persisted
 * 4. Test deduplication (same input = merged, not duplicated)
 * 5. Test versioning (re-run = unchanged hash, no new version)
 * 6. Verify assembly report is complete and auditable
 * 7. Backward compatibility check
 */

// Set env vars BEFORE any imports that use createAdminClient
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";
import { assemble } from "../services/knowledge/assembler";
import { computeKnowledgeHash } from "../services/knowledge/packageVersioner";
import { deduplicateFacts, jaccardSimilarity } from "../services/knowledge/factDeduplicator";
import { classifyFactType, decomposeIntoAtomicClaims } from "../services/knowledge/factExtractor";
import { detectContradiction } from "../services/knowledge/conflictResolver";
import { clearGlossaryCache } from "../services/knowledge/normalizer";
import type { AssemblyInput, CandidateInput } from "../services/knowledge/types";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Phase 9 Verification: Knowledge Assembler ===\n");
  clearGlossaryCache();

  let passed = 0;
  let failed = 0;

  function check(name: string, ok: boolean) {
    if (ok) { console.log(`  PASS: ${name}`); passed++; }
    else { console.log(`  FAIL: ${name}`); failed++; }
  }

  // ─── 1. Unit Tests: Atomic Decomposition ────────────────────────────────────
  console.log("\n--- 1. Atomic Decomposition ---\n");

  const decomp1 = decomposeIntoAtomicClaims("Python supports OOP, procedural, and functional programming");
  check("Compound list decomposed", decomp1.length === 3);
  console.log(`  Decomposed into ${decomp1.length} claims: ${decomp1.join(" | ")}`);

  const decomp2 = decomposeIntoAtomicClaims("Python was created by Guido van Rossum in 1991");
  check("Creator+year decomposed", decomp2.length === 2);

  const decomp3 = decomposeIntoAtomicClaims("Python uses dynamic typing");
  check("Atomic fact stays atomic", decomp3.length === 1);

  // ─── 2. Unit Tests: Fact Classification ─────────────────────────────────────
  console.log("\n--- 2. Fact Classification ---\n");

  check("Definition detected", classifyFactType("Python is a high-level programming language") === "definition");
  check("Historical detected", classifyFactType("Python was created in 1991") === "historical");
  check("Warning detected", classifyFactType("Avoid using mutable defaults") === "warning");
  check("Property detected", classifyFactType("Python has garbage collection") === "property");
  check("Measurement detected", classifyFactType("Python has over 300,000 packages on PyPI") === "measurement");

  // ─── 3. Unit Tests: Deduplication ───────────────────────────────────────────
  console.log("\n--- 3. Deduplication ---\n");

  const sim = jaccardSimilarity(
    "Python is a high-level general-purpose programming language used widely",
    "Python is a high-level general-purpose programming language used broadly"
  );
  check("Similar statements detected (Jaccard)", sim > 0.7);
  console.log(`  Jaccard similarity: ${sim.toFixed(3)}`);

  // ─── 4. Unit Tests: Contradiction Detection ─────────────────────────────────
  console.log("\n--- 4. Contradiction Detection ---\n");

  const c1 = detectContradiction(
    "Python is dynamically typed",
    "Python is not dynamically typed"
  );
  check("Direct contradiction detected", c1);

  const c2 = detectContradiction(
    "Python supports OOP",
    "JavaScript supports prototypal inheritance"
  );
  check("Unrelated statements not contradicted", !c2);

  // ─── 5. End-to-End: Assemble from mock candidates ──────────────────────────
  console.log("\n--- 5. End-to-End Assembly ---\n");

  // Get a discovery run ID for provenance
  const { data: runs } = await sb
    .from("discovery_runs")
    .select("id")
    .limit(1);

  const runId = runs?.[0]?.id ?? "00000000-0000-0000-0000-000000000001";

  const testCandidates: CandidateInput[] = [
    {
      id: "test-cand-1",
      title: "Python Data Types",
      description: "Python has several built-in data types including int, float, str, list, dict, tuple, and set. Python lists are mutable ordered sequences. Python dictionaries store key-value pairs.",
      sourceUrl: "https://docs.python.org/3/library/stdtypes.html",
      discoveryRunId: runId,
      adapterName: "DocsAdapter",
      sourceSlug: "python-docs",
      sourceAuthority: "official",
      metadata: { domain: "Software Development" },
    },
    {
      id: "test-cand-2",
      title: "Python Programming Language",
      description: "Python is a high-level programming language. Python was created by Guido van Rossum in 1991. Python supports object-oriented, procedural, and functional programming.",
      sourceUrl: "https://en.wikipedia.org/wiki/Python_(programming_language)",
      discoveryRunId: runId,
      adapterName: "WikipediaAdapter",
      sourceSlug: "wikipedia-en",
      sourceAuthority: "encyclopedic",
      metadata: { domain: "Software Development" },
    },
  ];

  const input: AssemblyInput = {
    slotId: null,
    topicId: null,
    slug: "test-phase9-python-basics",
    candidates: testCandidates,
  };

  const report = await assemble(input);

  console.log(`  Package ID: ${report.packageId}`);
  console.log(`  Version: ${report.version}`);
  console.log(`  Hash: ${report.knowledgeHash.slice(0, 16)}...`);
  console.log(`  Facts: ${report.factsCreated}`);
  console.log(`  Citations: ${report.citationsCreated}`);
  console.log(`  Duplicates merged: ${report.duplicatesMerged}`);
  console.log(`  Conflicts: ${report.conflictsDetected}`);
  console.log(`  Relationships: ${report.relationshipsGenerated}`);
  console.log(`  Normalizations: ${report.glossaryNormalizations}`);
  console.log(`  Duration: ${report.durationMs}ms`);
  console.log(`  Status: ${report.status}`);

  check("Package created", report.status === "created");
  check("Facts extracted", report.factsCreated >= 3);
  check("Citations created (2 sources)", report.citationsCreated === 2);
  check("Report has knowledgeHash", report.knowledgeHash.length === 64);
  check("Duration tracked", report.durationMs > 0);

  // ─── 6. Verify Persistence ─────────────────────────────────────────────────
  console.log("\n--- 6. Verify Persistence ---\n");

  const { data: pkgRow } = await sb
    .from("knowledge_packages")
    .select("*")
    .eq("id", report.packageId)
    .single();

  check("Package persisted in DB", !!pkgRow);
  check("Package status = ready", pkgRow?.status === "ready");
  check("Package version = 1", pkgRow?.version === 1);

  const { count: factCount } = await sb
    .from("knowledge_facts")
    .select("*", { count: "exact", head: true })
    .eq("package_id", report.packageId);

  check("Facts persisted", (factCount ?? 0) >= 3);

  const { count: evidenceCount } = await sb
    .from("knowledge_evidence")
    .select("*", { count: "exact", head: true })
    .in("fact_id", (await sb.from("knowledge_facts").select("id").eq("package_id", report.packageId)).data?.map(f => f.id) ?? []);

  check("Evidence persisted", (evidenceCount ?? 0) >= 1);

  const { count: provCount } = await sb
    .from("knowledge_provenance")
    .select("*", { count: "exact", head: true })
    .in("fact_id", (await sb.from("knowledge_facts").select("id").eq("package_id", report.packageId)).data?.map(f => f.id) ?? []);

  check("Provenance persisted", (provCount ?? 0) >= 1);

  // ─── 7. Test Idempotency (re-run = unchanged) ─────────────────────────────
  console.log("\n--- 7. Idempotency Test ---\n");

  const report2 = await assemble(input);
  check("Re-run detected unchanged hash", report2.status === "unchanged");
  check("Version not incremented", report2.version === 1);
  console.log(`  Second run status: ${report2.status}`);

  // ─── 8. Test Version Increment ─────────────────────────────────────────────
  console.log("\n--- 8. Version Increment ---\n");

  const modifiedInput: AssemblyInput = {
    ...input,
    candidates: [
      ...testCandidates,
      {
        id: "test-cand-3",
        title: "Python Advanced Features",
        description: "Python supports decorators for metaprogramming. Python generators use yield for lazy evaluation. Python context managers handle resource cleanup.",
        sourceUrl: "https://docs.python.org/3/howto/",
        discoveryRunId: runId,
        adapterName: "DocsAdapter",
        sourceSlug: "python-docs",
        sourceAuthority: "official",
        metadata: { domain: "Software Development" },
      },
    ],
  };

  const report3 = await assemble(modifiedInput);
  check("New knowledge = new version", report3.status === "updated");
  check("Version incremented to 2", report3.version === 2);
  check("More facts in v2", report3.factsCreated > report.factsCreated);
  console.log(`  v2 facts: ${report3.factsCreated} (was ${report.factsCreated})`);

  // ─── 9. Backward Compatibility ─────────────────────────────────────────────
  console.log("\n--- 9. Backward Compatibility ---\n");

  const { count: srcCount } = await sb.from("discovery_sources").select("*", { count: "exact", head: true });
  const { count: discRunCount } = await sb.from("discovery_runs").select("*", { count: "exact", head: true });
  const { count: candCount } = await sb.from("discovery_candidates").select("*", { count: "exact", head: true });

  check("Discovery sources intact", (srcCount ?? 0) >= 1);
  check("Discovery runs intact", (discRunCount ?? 0) >= 1);
  check("Discovery candidates intact", (candCount ?? 0) >= 1);

  // ─── 10. Cleanup test packages ─────────────────────────────────────────────
  console.log("\n--- 10. Cleanup ---\n");

  await sb.from("knowledge_packages").delete().eq("slug", "test-phase9-python-basics");
  console.log("  Cleaned up test packages");

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${"=".repeat(50)}\n`);

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
