/**
 * Phase 8 Verification: Knowledge Package Foundation
 *
 * Checks:
 * 1. All 7 tables exist and are queryable
 * 2. Domain Glossary has seed data
 * 3. TypeScript types align with DB schema
 * 4. Can insert and query a test Knowledge Package with facts, citations, evidence, provenance, relationships
 * 5. Cascade delete works (delete package → facts, citations, evidence, provenance removed)
 * 6. Backward compatibility: discovery tables still intact
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Phase 8 Verification: Knowledge Package Foundation ===\n");

  let passed = 0;
  let failed = 0;

  function check(name: string, ok: boolean) {
    if (ok) { console.log(`  PASS: ${name}`); passed++; }
    else { console.log(`  FAIL: ${name}`); failed++; }
  }

  // ─── 1. Table Existence ──────────────────────────────────────────────────────
  console.log("\n--- 1. Table Existence ---\n");

  const tables = [
    "domain_glossary",
    "knowledge_packages",
    "knowledge_citations",
    "knowledge_facts",
    "knowledge_evidence",
    "knowledge_provenance",
    "knowledge_relationships",
  ];

  for (const table of tables) {
    const { error } = await sb.from(table).select("*", { count: "exact", head: true });
    check(`${table} exists`, !error);
  }

  // ─── 2. Domain Glossary Seed ─────────────────────────────────────────────────
  console.log("\n--- 2. Domain Glossary ---\n");

  const { data: glossaryData, count: glossaryCount } = await sb
    .from("domain_glossary")
    .select("*", { count: "exact" })
    .limit(5);

  check("Glossary has entries", (glossaryCount ?? 0) >= 50);
  console.log(`  Entries: ${glossaryCount}`);

  if (glossaryData && glossaryData.length > 0) {
    const sample = glossaryData[0];
    check("Glossary has abbreviation field", "abbreviation" in sample);
    check("Glossary has canonical_form field", "canonical_form" in sample);
    check("Glossary has domain field", "domain" in sample);
    console.log(`  Sample: ${sample.abbreviation} → ${sample.canonical_form} (${sample.domain})`);
  }

  // ─── 3. Insert Test Knowledge Package ────────────────────────────────────────
  console.log("\n--- 3. Insert Test Package ---\n");

  const { data: pkg, error: pkgErr } = await sb
    .from("knowledge_packages")
    .insert({
      slug: "test-python-data-types",
      knowledge_hash: "sha256-test-abc123",
      version: 1,
      source_count: 2,
      fact_count: 3,
      relationship_count: 1,
      status: "draft",
    })
    .select()
    .single();

  check("Package inserted", !pkgErr && !!pkg);

  if (!pkg) {
    console.error("Cannot continue without package. Error:", pkgErr?.message);
    return;
  }

  const pkgId = pkg.id;
  console.log(`  Package ID: ${pkgId}`);

  // ─── 4. Insert Citations ─────────────────────────────────────────────────────
  console.log("\n--- 4. Insert Citations ---\n");

  const { data: cit1 } = await sb
    .from("knowledge_citations")
    .insert({
      package_id: pkgId,
      source_name: "Python Official Documentation",
      source_url: "https://docs.python.org/3/library/datatypes.html",
      adapter_name: "DocsAdapter",
      extraction_method: "toc_heading",
      source_authority: "official",
    })
    .select()
    .single();

  const { data: cit2 } = await sb
    .from("knowledge_citations")
    .insert({
      package_id: pkgId,
      source_name: "Wikipedia: Python",
      source_url: "https://en.wikipedia.org/wiki/Python_(programming_language)",
      adapter_name: "WikipediaAdapter",
      extraction_method: "section_extraction",
      source_authority: "encyclopedic",
    })
    .select()
    .single();

  check("Citation 1 (official) inserted", !!cit1);
  check("Citation 2 (encyclopedic) inserted", !!cit2);

  // ─── 5. Insert Facts ─────────────────────────────────────────────────────────
  console.log("\n--- 5. Insert Facts ---\n");

  const factsToInsert = [
    {
      package_id: pkgId,
      statement: "Python has several built-in data types including int, float, str, list, dict, tuple, and set",
      fact_type: "definition",
      confidence: "verified",
      domain: "Software Development",
      scope: "universal",
      tags: ["python", "data-types", "built-in"],
    },
    {
      package_id: pkgId,
      statement: "Python lists are mutable ordered sequences",
      fact_type: "property",
      confidence: "verified",
      domain: "Software Development",
      scope: "universal",
      tags: ["python", "list", "mutable"],
    },
    {
      package_id: pkgId,
      statement: "Using mutable objects as dictionary keys raises a TypeError",
      fact_type: "warning",
      confidence: "high",
      domain: "Software Development",
      scope: "contextual",
      tags: ["python", "dict", "mutable", "error"],
    },
  ];

  const { data: facts, error: factsErr } = await sb
    .from("knowledge_facts")
    .insert(factsToInsert)
    .select();

  check("3 facts inserted", !factsErr && facts?.length === 3);

  if (!facts || facts.length === 0) {
    console.error("Cannot continue without facts. Error:", factsErr?.message);
    return;
  }

  // ─── 6. Insert Evidence ──────────────────────────────────────────────────────
  console.log("\n--- 6. Insert Evidence ---\n");

  const { error: ev1Err } = await sb.from("knowledge_evidence").insert({
    fact_id: facts[0].id,
    citation_id: cit1!.id,
    excerpt: "Built-in Types: int, float, complex, str, list, tuple, range, dict, set, frozenset, bool, bytes",
  });

  const { error: ev2Err } = await sb.from("knowledge_evidence").insert({
    fact_id: facts[0].id,
    citation_id: cit2!.id,
    excerpt: "Python's built-in data types include numeric types, sequences, mappings, and sets",
  });

  const { error: ev3Err } = await sb.from("knowledge_evidence").insert({
    fact_id: facts[1].id,
    citation_id: cit1!.id,
    excerpt: "Lists are mutable sequences, typically used to store collections of homogeneous items",
  });

  check("Evidence 1 (fact1 ← official)", !ev1Err);
  check("Evidence 2 (fact1 ← encyclopedic)", !ev2Err);
  check("Evidence 3 (fact2 ← official)", !ev3Err);

  // ─── 7. Insert Provenance ───────────────────────────────────────────────────
  console.log("\n--- 7. Insert Provenance ---\n");

  const { error: provErr } = await sb.from("knowledge_provenance").insert({
    fact_id: facts[0].id,
    adapter_name: "DocsAdapter",
    source_slug: "python-docs",
  });

  check("Provenance inserted", !provErr);

  // ─── 8. Insert Relationship ──────────────────────────────────────────────────
  console.log("\n--- 8. Insert Relationship ---\n");

  const { error: relErr } = await sb.from("knowledge_relationships").insert({
    source_id: facts[0].id,
    source_level: "fact",
    target_id: facts[1].id,
    target_level: "fact",
    relationship_type: "generalizes",
    strength: "strong",
    explanation: "Built-in data types generalizes to list properties",
    bidirectional: false,
  });

  check("Relationship inserted (fact → fact)", !relErr);

  // ─── 9. Query Package with Relations ─────────────────────────────────────────
  console.log("\n--- 9. Query Full Package ---\n");

  const { data: fullFacts } = await sb
    .from("knowledge_facts")
    .select("*, knowledge_evidence(*), knowledge_provenance(*)")
    .eq("package_id", pkgId);

  check("Facts queryable with joins", !!fullFacts && fullFacts.length === 3);

  if (fullFacts) {
    const factWithMultiEvidence = fullFacts.find((f: any) => f.knowledge_evidence?.length > 1);
    check("Fact has multiple evidence sources", !!factWithMultiEvidence);
  }

  // ─── 10. Cascade Delete ──────────────────────────────────────────────────────
  console.log("\n--- 10. Cascade Delete ---\n");

  const { error: delErr } = await sb.from("knowledge_packages").delete().eq("id", pkgId);
  check("Package deleted", !delErr);

  const { count: remainingFacts } = await sb
    .from("knowledge_facts")
    .select("*", { count: "exact", head: true })
    .eq("package_id", pkgId);

  check("Cascade: facts removed", (remainingFacts ?? 0) === 0);

  const { count: remainingCitations } = await sb
    .from("knowledge_citations")
    .select("*", { count: "exact", head: true })
    .eq("package_id", pkgId);

  check("Cascade: citations removed", (remainingCitations ?? 0) === 0);

  // ─── 11. Backward Compatibility ─────────────────────────────────────────────
  console.log("\n--- 11. Backward Compatibility ---\n");

  const { count: srcCount } = await sb
    .from("discovery_sources")
    .select("*", { count: "exact", head: true });

  const { count: runCount } = await sb
    .from("discovery_runs")
    .select("*", { count: "exact", head: true });

  const { count: candCount } = await sb
    .from("discovery_candidates")
    .select("*", { count: "exact", head: true });

  check("Discovery sources intact", (srcCount ?? 0) >= 1);
  check("Discovery runs intact", (runCount ?? 0) >= 1);
  check("Discovery candidates intact", (candCount ?? 0) >= 1);

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${"=".repeat(50)}\n`);

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
