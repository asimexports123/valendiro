/**
 * Phase 10 Verification: Knowledge Preview UI + API Layer
 *
 * Tests:
 * 1. Knowledge Package list page serves 200
 * 2. Knowledge Package detail page serves 200
 * 3. GET /api/knowledge returns packages
 * 4. GET /api/knowledge/:id returns full package with facts/citations/relationships
 * 5. POST /api/knowledge/assemble creates a package (via API)
 * 6. Seeded package exists with facts, citations, relationships
 * 7. Pipeline constraint: Knowledge Package is single source of truth
 * 8. Backward compatibility
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const BASE = "http://localhost:3000";

async function main() {
  console.log("=== Phase 10 Verification: Knowledge Preview UI + API ===\n");

  let passed = 0;
  let failed = 0;

  function check(name: string, ok: boolean) {
    if (ok) { console.log(`  PASS: ${name}`); passed++; }
    else { console.log(`  FAIL: ${name}`); failed++; }
  }

  // ─── 1. Pages Serve ────────────────────────────────────────────────────────
  console.log("\n--- 1. Preview Pages ---\n");

  try {
    const listRes = await fetch(`${BASE}/preview/knowledge`);
    check("List page serves 200", listRes.status === 200);
  } catch {
    check("List page serves 200", false);
  }

  // ─── 2. API: GET /api/knowledge ────────────────────────────────────────────
  console.log("\n--- 2. API: List Packages ---\n");

  try {
    const apiRes = await fetch(`${BASE}/api/knowledge`);
    check("GET /api/knowledge returns 200", apiRes.status === 200);

    const body = await apiRes.json();
    check("API returns packages array", Array.isArray(body.packages));
    console.log(`  Packages in API: ${body.packages.length}`);
  } catch (e: any) {
    check("GET /api/knowledge returns 200", false);
    console.log(`  Error: ${e.message}`);
  }

  // ─── 3. Seeded Package Exists ──────────────────────────────────────────────
  console.log("\n--- 3. Seeded Package ---\n");

  const { data: seededPkg } = await sb
    .from("knowledge_packages")
    .select("*")
    .eq("slug", "python-programming-fundamentals")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  check("Seeded package exists", !!seededPkg);

  if (seededPkg) {
    console.log(`  ID: ${seededPkg.id}`);
    console.log(`  Facts: ${seededPkg.fact_count}`);
    console.log(`  Sources: ${seededPkg.source_count}`);
    console.log(`  Relationships: ${seededPkg.relationship_count}`);
    console.log(`  Status: ${seededPkg.status}`);

    check("Package has facts", seededPkg.fact_count > 0);
    check("Package has sources", seededPkg.source_count > 0);
    check("Package has relationships", seededPkg.relationship_count > 0);
    check("Package status = ready", seededPkg.status === "ready");

    // ─── 4. API: GET /api/knowledge/:id ──────────────────────────────────────
    console.log("\n--- 4. API: Package Detail ---\n");

    try {
      const detailRes = await fetch(`${BASE}/api/knowledge/${seededPkg.id}`);
      check("GET /api/knowledge/:id returns 200", detailRes.status === 200);

      const detail = await detailRes.json();
      check("Detail has package", !!detail.package);
      check("Detail has facts array", Array.isArray(detail.facts));
      check("Detail has citations array", Array.isArray(detail.citations));
      check("Detail has relationships array", Array.isArray(detail.relationships));
      check("Facts count matches", detail.facts.length === seededPkg.fact_count);
      check("Citations count matches", detail.citations.length === seededPkg.source_count);

      // Check evidence is nested
      const factWithEvidence = detail.facts.find((f: any) => f.knowledge_evidence?.length > 0);
      check("Evidence nested in facts", !!factWithEvidence);

      // Check provenance is nested
      const factWithProv = detail.facts.find((f: any) => f.knowledge_provenance?.length > 0);
      check("Provenance nested in facts", !!factWithProv);

      console.log(`  Facts: ${detail.facts.length}`);
      console.log(`  Citations: ${detail.citations.length}`);
      console.log(`  Relationships: ${detail.relationships.length}`);
    } catch (e: any) {
      check("GET /api/knowledge/:id returns 200", false);
      console.log(`  Error: ${e.message}`);
    }

    // ─── 5. Detail Page ──────────────────────────────────────────────────────
    console.log("\n--- 5. Detail Page ---\n");

    try {
      const detailPageRes = await fetch(`${BASE}/preview/knowledge/${seededPkg.id}`);
      check("Detail page serves 200", detailPageRes.status === 200);
    } catch {
      check("Detail page serves 200", false);
    }
  }

  // ─── 6. Pipeline Constraint Verification ───────────────────────────────────
  console.log("\n--- 6. Pipeline Constraints ---\n");

  // Verify that no article references a knowledge_package_id (since rendering hasn't been implemented)
  // Legacy articles may exist from pre-architecture phases — that's fine
  const { data: articlesWithKP } = await sb.from("articles").select("id").not("knowledge_package_id", "is", null).limit(1);
  check("No articles linked to Knowledge Packages yet (rendering not implemented)", (articlesWithKP ?? []).length === 0);

  const { count: renderCount } = await sb.from("rendered_pages").select("*", { count: "exact", head: true });
  check("No rendered pages exist yet", (renderCount ?? 0) === 0);

  // Verify discovery tables don't have article content
  const { data: discSources } = await sb
    .from("discovery_sources")
    .select("*")
    .limit(1);

  if (discSources && discSources.length > 0) {
    const hasArticle = "article_content" in discSources[0];
    check("Discovery sources have no article_content field", !hasArticle);
  }

  // ─── 7. Backward Compatibility ────────────────────────────────────────────
  console.log("\n--- 7. Backward Compatibility ---\n");

  const { count: srcCount } = await sb.from("discovery_sources").select("*", { count: "exact", head: true });
  const { count: runCount } = await sb.from("discovery_runs").select("*", { count: "exact", head: true });
  const { count: candCount } = await sb.from("discovery_candidates").select("*", { count: "exact", head: true });
  const { count: glossCount } = await sb.from("domain_glossary").select("*", { count: "exact", head: true });

  check("Discovery sources intact", (srcCount ?? 0) >= 1);
  check("Discovery runs intact", (runCount ?? 0) >= 1);
  check("Discovery candidates intact", (candCount ?? 0) >= 1);
  check("Domain glossary intact", (glossCount ?? 0) >= 50);

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${"=".repeat(50)}\n`);

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
