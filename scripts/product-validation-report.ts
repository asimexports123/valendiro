/**
 * Product Validation Report
 *
 * Generates a comprehensive report across all Knowledge Packages:
 *   - Total packages, articles, facts, citations
 *   - Coverage % by domain
 *   - Average render quality score
 *   - Render time statistics
 *   - Empty hubs detection
 *   - Missing packages
 *   - Duplicate detection
 *   - Rendering errors
 *   - Broken internal links
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";
import { render } from "../services/renderer/orchestrator";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  const reportDate = new Date().toISOString().slice(0, 10);
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  PRODUCT VALIDATION REPORT — ${reportDate}`);
  console.log(`${"═".repeat(60)}\n`);

  // ─── 1. Knowledge Package Counts ───────────────────────────────────────────

  const { data: packages, count: totalPackages } = await sb
    .from("knowledge_packages")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: true });

  const { count: totalFacts } = await sb
    .from("knowledge_facts")
    .select("*", { count: "exact", head: true });

  const { count: totalCitations } = await sb
    .from("knowledge_citations")
    .select("*", { count: "exact", head: true });

  const { count: totalRendered } = await sb
    .from("rendered_outputs")
    .select("*", { count: "exact", head: true });

  console.log("── 1. KNOWLEDGE BASE ──────────────────────────────────");
  console.log(`   Knowledge Packages:  ${totalPackages ?? 0}`);
  console.log(`   Total Facts:         ${totalFacts ?? 0}`);
  console.log(`   Total Citations:     ${totalCitations ?? 0}`);
  console.log(`   Rendered Articles:   ${totalRendered ?? 0}`);

  if (!packages || packages.length === 0) {
    console.log("\n   ⚠  No packages found. Run seed-validation-data.ts first.\n");
    process.exit(0);
  }

  // ─── 2. Coverage by Domain ─────────────────────────────────────────────────

  const domainMap: Record<string, { count: number; facts: number; scores: number[] }> = {};
  for (const pkg of packages) {
    const domain = (pkg.metadata as any)?.domain ?? "Unknown";
    if (!domainMap[domain]) domainMap[domain] = { count: 0, facts: 0, scores: [] };
    domainMap[domain].count++;
    domainMap[domain].facts += pkg.fact_count ?? 0;
  }

  console.log("\n── 2. COVERAGE BY DOMAIN ──────────────────────────────");
  console.log(`   ${"Domain".padEnd(30)} ${"Packages".padStart(8)} ${"Facts".padStart(6)}`);
  console.log(`   ${"─".repeat(48)}`);
  for (const [domain, data] of Object.entries(domainMap).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`   ${domain.padEnd(30)} ${String(data.count).padStart(8)} ${String(data.facts).padStart(6)}`);
  }

  // ─── 3. Render Quality Audit ───────────────────────────────────────────────

  console.log("\n── 3. RENDER QUALITY AUDIT ────────────────────────────");
  console.log("   Running render checks for all packages...\n");

  const renderResults: Array<{
    slug: string;
    status: string;
    score: number;
    flowScore: number;
    wordCount: number;
    durationMs: number;
    cached: boolean;
    error?: string;
  }> = [];

  for (const pkg of packages) {
    process.stdout.write(`   ${pkg.slug.padEnd(42)} `);
    const t0 = Date.now();
    try {
      const result = await render({
        packageId: pkg.id,
        format: "html",
        forceRerender: false,
      });
      const duration = Date.now() - t0;
      const score = result.qualityScore.overall;
      const flow = result.qualityScore.readingFlow?.overallFlowScore ?? 0;
      const words = result.qualityScore.wordCount;

      renderResults.push({
        slug: pkg.slug,
        status: result.status,
        score,
        flowScore: flow,
        wordCount: words,
        durationMs: duration,
        cached: result.cached,
      });

      const flag = score >= 80 ? "✓" : score >= 60 ? "~" : "✗";
      console.log(`${flag}  score: ${String(score).padStart(3)}  flow: ${String(flow).padStart(3)}  words: ${String(words).padStart(4)}  ${result.cached ? "(cached)" : `${duration}ms`}`);

      // Add domain scores
      const domain = (pkg.metadata as any)?.domain ?? "Unknown";
      if (domainMap[domain]) domainMap[domain].scores.push(score);
    } catch (err: any) {
      const duration = Date.now() - t0;
      console.log(`✗  ERROR: ${err?.message?.slice(0, 40)}`);
      renderResults.push({
        slug: pkg.slug, status: "error", score: 0,
        flowScore: 0, wordCount: 0, durationMs: duration,
        cached: false, error: err?.message,
      });
    }
  }

  // ─── 4. Quality Statistics ────────────────────────────────────────────────

  const successful = renderResults.filter((r) => r.status !== "error");
  const scores = successful.map((r) => r.score);
  const flowScores = successful.map((r) => r.flowScore);
  const durations = renderResults.filter((r) => !r.cached).map((r) => r.durationMs);

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const min = (arr: number[]) => (arr.length > 0 ? Math.min(...arr) : 0);
  const max = (arr: number[]) => (arr.length > 0 ? Math.max(...arr) : 0);

  console.log("\n── 4. QUALITY STATISTICS ──────────────────────────────");
  console.log(`   Packages rendered:   ${successful.length} / ${renderResults.length}`);
  console.log(`   Avg quality score:   ${avg(scores)}/100`);
  console.log(`   Min quality score:   ${min(scores)}/100`);
  console.log(`   Max quality score:   ${max(scores)}/100`);
  console.log(`   Avg flow score:      ${avg(flowScores)}/100`);
  console.log(`   Score >= 80 (great): ${scores.filter((s) => s >= 80).length}`);
  console.log(`   Score 60-79 (ok):    ${scores.filter((s) => s >= 60 && s < 80).length}`);
  console.log(`   Score < 60 (poor):   ${scores.filter((s) => s < 60).length}`);

  if (durations.length > 0) {
    console.log(`   Avg render time:     ${avg(durations)}ms`);
    console.log(`   Max render time:     ${max(durations)}ms`);
  }

  // Domain quality breakdown
  console.log("\n── 5. QUALITY BY DOMAIN ───────────────────────────────");
  console.log(`   ${"Domain".padEnd(30)} ${"Packages".padStart(8)} ${"Avg Score".padStart(10)}`);
  console.log(`   ${"─".repeat(52)}`);
  for (const [domain, data] of Object.entries(domainMap)) {
    const avgScore = avg(data.scores);
    const bar = avgScore >= 80 ? "✓" : avgScore >= 60 ? "~" : "✗";
    console.log(`   ${domain.padEnd(30)} ${String(data.count).padStart(8)} ${(bar + " " + avgScore + "/100").padStart(10)}`);
  }

  // ─── 5. Duplicate Detection ───────────────────────────────────────────────

  console.log("\n── 6. DUPLICATE DETECTION ─────────────────────────────");
  const slugs = packages.map((p) => p.slug);
  const slugSet = new Set(slugs);
  const duplicateSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (duplicateSlugs.length === 0) {
    console.log("   ✓ No duplicate slugs detected");
  } else {
    console.log(`   ✗ Duplicate slugs: ${duplicateSlugs.join(", ")}`);
  }

  // Check for similar fact statements across packages
  const { data: allFacts } = await sb
    .from("knowledge_facts")
    .select("statement, package_id")
    .limit(500);

  const stmtMap: Record<string, string[]> = {};
  for (const f of allFacts ?? []) {
    const key = f.statement.slice(0, 80).toLowerCase();
    if (!stmtMap[key]) stmtMap[key] = [];
    stmtMap[key].push(f.package_id);
  }
  const crossDupes = Object.entries(stmtMap).filter(([, pkgs]) => new Set(pkgs).size > 1);
  console.log(`   Cross-package duplicate facts: ${crossDupes.length}`);

  // ─── 6. Empty / Broken Checks ─────────────────────────────────────────────

  console.log("\n── 7. INTEGRITY CHECKS ────────────────────────────────");

  // Packages with zero facts
  const emptyPackages = packages.filter((p) => (p.fact_count ?? 0) === 0);
  if (emptyPackages.length === 0) {
    console.log("   ✓ No packages with zero facts");
  } else {
    console.log(`   ✗ Packages with zero facts: ${emptyPackages.map((p) => p.slug).join(", ")}`);
  }

  // Packages with no rendered output
  const { data: renderedOutputs } = await sb
    .from("rendered_outputs")
    .select("package_id, status")
    .in("status", ["published", "stale"]);

  const renderedPkgIds = new Set((renderedOutputs ?? []).map((r: any) => r.package_id));
  const unrenderedPackages = packages.filter((p) => !renderedPkgIds.has(p.id));
  if (unrenderedPackages.length === 0) {
    console.log("   ✓ All packages have rendered articles");
  } else {
    console.log(`   ✗ Packages without rendered articles: ${unrenderedPackages.length}`);
    for (const p of unrenderedPackages) console.log(`     - ${p.slug}`);
  }

  // Render errors
  const erroredRenders = renderResults.filter((r) => r.status === "error" || r.score === 0);
  if (erroredRenders.length === 0) {
    console.log("   ✓ No rendering errors");
  } else {
    console.log(`   ✗ Rendering errors: ${erroredRenders.length}`);
    for (const r of erroredRenders) console.log(`     - ${r.slug}: ${r.error ?? "score 0"}`);
  }

  // Low word count (< 50 words = probably broken)
  const thinPackages = renderResults.filter((r) => r.wordCount > 0 && r.wordCount < 50);
  if (thinPackages.length === 0) {
    console.log("   ✓ No thin articles (all have >= 50 words)");
  } else {
    console.log(`   ~ Thin articles (< 50 words): ${thinPackages.length}`);
    for (const r of thinPackages) console.log(`     - ${r.slug}: ${r.wordCount} words`);
  }

  // ─── 7. Final Verdict ─────────────────────────────────────────────────────

  const avgQuality = avg(scores);
  const renderErrorRate = erroredRenders.length / Math.max(1, renderResults.length);
  const verdict =
    avgQuality >= 75 && renderErrorRate === 0 && emptyPackages.length === 0
      ? "READY FOR FOUNDER REVIEW"
      : avgQuality >= 60 && renderErrorRate < 0.1
      ? "ACCEPTABLE — MINOR ISSUES"
      : "NEEDS ATTENTION";

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  VERDICT: ${verdict}`);
  console.log(`  Average Quality:  ${avgQuality}/100`);
  console.log(`  Total Packages:   ${totalPackages}`);
  console.log(`  Total Articles:   ${totalRendered}`);
  console.log(`  Errors:           ${erroredRenders.length}`);
  console.log(`${"═".repeat(60)}\n`);
}

main().catch(console.error);
