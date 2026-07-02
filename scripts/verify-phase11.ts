/**
 * Phase 11 Verification: Rendering Layer
 *
 * Tests:
 * 1. Determinism — identical input = identical output (10 runs)
 * 2. Rules engine — eligibility, missing knowledge detection
 * 3. Long Article render — produces valid Document Tree
 * 4. FAQ render — produces valid Document Tree
 * 5. Citation rendering — bibliography appended
 * 6. HTML serialization — valid output
 * 7. Markdown serialization — valid output
 * 8. Quality scoring — score computed
 * 9. Cache — hit after first render
 * 10. API endpoint — serves rendered content
 * 11. Backward compatibility — Knowledge Packages unchanged
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";
import { render } from "../services/renderer/orchestrator";
import { evaluate } from "../services/renderer/rulesEngine";
import { longArticleStrategy } from "../services/renderer/renderers/longArticle";
import { faqStrategy } from "../services/renderer/renderers/faq";
import { decorateWithCitations } from "../services/renderer/citationRenderer";
import { serializeToHTML } from "../services/renderer/serializers/html";
import { serializeToMarkdown } from "../services/renderer/serializers/markdown";
import { scoreQuality } from "../services/renderer/qualityScorer";
import { computeCacheKey } from "../services/renderer/cacheManager";
import type { PluginFact, CitationInput, RelationshipInput, RendererConfig, RenderDecision } from "../services/renderer/types";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const BASE = "http://localhost:3000";

async function main() {
  console.log("=== Phase 11 Verification: Rendering Layer ===\n");

  let passed = 0;
  let failed = 0;

  function check(name: string, ok: boolean) {
    if (ok) { console.log(`  PASS: ${name}`); passed++; }
    else { console.log(`  FAIL: ${name}`); failed++; }
  }

  // Get seeded package
  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("*")
    .eq("slug", "python-programming-fundamentals")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pkg) {
    console.log("ERROR: No seeded package found. Run seed-knowledge-package.ts first.");
    process.exit(1);
  }

  console.log(`  Using package: ${pkg.slug} (v${pkg.version}, ${pkg.fact_count} facts)\n`);

  // Load facts + citations for unit tests
  const { data: factsRaw } = await sb.from("knowledge_facts").select("*").eq("package_id", pkg.id);
  const { data: citRaw } = await sb.from("knowledge_citations").select("*").eq("package_id", pkg.id);

  const facts: PluginFact[] = (factsRaw ?? []).map((f: any) => ({
    id: f.id, statement: f.statement, factType: f.fact_type,
    confidence: f.confidence, scope: f.scope, tags: f.tags ?? [], domain: f.domain,
  }));

  const citations: CitationInput[] = (citRaw ?? []).map((c: any) => ({
    id: c.id, sourceName: c.source_name, sourceUrl: c.source_url,
    adapterName: c.adapter_name, sourceAuthority: c.source_authority, retrievedAt: c.retrieved_at,
  }));

  const relationships: RelationshipInput[] = [];

  // ─── 1. Rules Engine ───────────────────────────────────────────────────────
  console.log("--- 1. Rules Engine ---\n");

  const decision = evaluate(facts, citations);
  check("Package eligible for rendering", decision.eligible);
  check("Policy applied is 'default'", decision.policy.name === "default");
  check("Block order has entries", decision.blockOrder.length > 0);

  // Test ineligibility
  const emptyDecision = evaluate([], []);
  check("Empty package is ineligible", !emptyDecision.eligible);
  check("Missing knowledge detected for empty", emptyDecision.missingKnowledge.length > 0);

  // ─── 2. Long Article Renderer ──────────────────────────────────────────────
  console.log("\n--- 2. Long Article Renderer ---\n");

  const config: RendererConfig = {
    rendererId: "long-article-v1",
    rendererVersion: "1.0.0",
    templateVersion: "1.0.0",
    format: "html",
    style: ["intermediate"],
    slug: pkg.slug,
    intent: "educate",
    category: "technology",
  };

  const tree = longArticleStrategy.render(facts, citations, relationships, config, decision);
  check("Document Tree produced", tree.length > 0);
  check("Has title heading", tree[0]?.type === "heading" && (tree[0] as any).level === 1);
  check("Has sections (h2)", tree.some((n) => n.type === "heading" && (n as any).level === 2));
  check("Has paragraphs", tree.some((n) => n.type === "paragraph"));

  // ─── 3. FAQ Renderer ───────────────────────────────────────────────────────
  console.log("\n--- 3. FAQ Renderer ---\n");

  const faqTree = faqStrategy.render(facts, citations, relationships, config, decision);
  check("FAQ tree produced", faqTree.length > 0);
  check("FAQ has title", faqTree[0]?.type === "heading");
  check("FAQ has question headings", faqTree.filter((n) => n.type === "heading" && (n as any).level === 2).length >= 2);

  // ─── 4. Citation Rendering ─────────────────────────────────────────────────
  console.log("\n--- 4. Citation Rendering ---\n");

  const citTree = decorateWithCitations(tree, citations);
  check("Citation block appended", citTree.some((n) => n.type === "citation-block"));
  check("Divider before citations", citTree.some((n) => n.type === "divider"));
  const citBlock = citTree.find((n) => n.type === "citation-block") as any;
  check("Citation entries match source count", citBlock?.entries.length === citations.length);

  // ─── 5. HTML Serialization ─────────────────────────────────────────────────
  console.log("\n--- 5. HTML Serialization ---\n");

  const html = serializeToHTML(citTree);
  check("HTML output is non-empty", html.length > 100);
  check("HTML has article tag", html.includes("<article"));
  check("HTML has h1", html.includes("<h1"));
  check("HTML has h2", html.includes("<h2"));
  check("HTML has paragraphs", html.includes("<p>"));
  check("HTML has citation list", html.includes("citation-list"));
  console.log(`  HTML length: ${html.length} chars`);

  // ─── 6. Markdown Serialization ─────────────────────────────────────────────
  console.log("\n--- 6. Markdown Serialization ---\n");

  const md = serializeToMarkdown(citTree);
  check("Markdown output is non-empty", md.length > 100);
  check("Markdown has H1", md.includes("# "));
  check("Markdown has H2", md.includes("## "));
  console.log(`  Markdown length: ${md.length} chars`);

  // ─── 7. Quality Scoring ────────────────────────────────────────────────────
  console.log("\n--- 7. Quality Scoring ---\n");

  const score = scoreQuality(citTree, facts, citations, decision);
  check("Quality score computed", score.overall > 0);
  check("Word count > 0", score.wordCount > 0);
  check("Section count > 0", score.sectionCount > 0);
  check("Citation count matches", score.citationCount === citations.length);
  check("Score >= 60 (publishable)", score.overall >= 60);
  console.log(`  Overall: ${score.overall}, Words: ${score.wordCount}, Sections: ${score.sectionCount}`);

  // ─── 8. Determinism ────────────────────────────────────────────────────────
  console.log("\n--- 8. Determinism (10 runs) ---\n");

  const outputs: string[] = [];
  for (let i = 0; i < 10; i++) {
    const t = longArticleStrategy.render(facts, citations, relationships, config, decision);
    const decorated = decorateWithCitations(t, citations);
    const serialized = serializeToHTML(decorated);
    outputs.push(serialized);
  }
  const allIdentical = outputs.every((o) => o === outputs[0]);
  check("10 consecutive renders produce identical output", allIdentical);

  // ─── 9. Cache Key ──────────────────────────────────────────────────────────
  console.log("\n--- 9. Cache ---\n");

  const key1 = computeCacheKey("hash1", "1.0.0", "1.0.0", "html");
  const key2 = computeCacheKey("hash1", "1.0.0", "1.0.0", "html");
  const key3 = computeCacheKey("hash2", "1.0.0", "1.0.0", "html");
  check("Same inputs = same cache key", key1 === key2);
  check("Different hash = different cache key", key1 !== key3);

  // ─── 10. End-to-End Render via Orchestrator ────────────────────────────────
  console.log("\n--- 10. End-to-End Orchestrator ---\n");

  const result = await render({ packageId: pkg.id, format: "html", forceRerender: true });
  check("Render completed", !!result);
  check("Output stored (has ID)", !!result.outputId);
  check("Content is HTML", result.content.includes("<article"));
  check("Quality score present", result.qualityScore.overall > 0);
  check("Diagnostics present", !!result.diagnostics.rendererId);
  check("Diagnostics has knowledge hash", result.diagnostics.knowledgeHash === pkg.knowledge_hash);
  check("Diagnostics has cache key", !!result.diagnostics.cacheKey);
  check("Render duration tracked", result.diagnostics.renderDurationMs > 0);
  console.log(`  Status: ${result.status}, Score: ${result.qualityScore.overall}, Duration: ${result.diagnostics.renderDurationMs}ms`);

  // ─── 11. Cache Hit ─────────────────────────────────────────────────────────
  console.log("\n--- 11. Cache Hit ---\n");

  const cachedResult = await render({ packageId: pkg.id, format: "html" });
  check("Second render is cached", cachedResult.cached);
  check("Cached content matches", cachedResult.content === result.content);

  // ─── 12. API Endpoint ──────────────────────────────────────────────────────
  console.log("\n--- 12. API Endpoint ---\n");

  try {
    const apiRes = await fetch(`${BASE}/api/render/${pkg.id}?format=html`);
    check("GET /api/render/:id returns 200", apiRes.status === 200);
    const apiBody = await apiRes.json();
    check("API returns content", !!apiBody.content);
    check("API returns quality score", !!apiBody.qualityScore);
  } catch (e: any) {
    check("GET /api/render/:id returns 200", false);
    console.log(`  Error: ${e.message}`);
  }

  // ─── 13. Markdown via API ──────────────────────────────────────────────────
  console.log("\n--- 13. Markdown Render ---\n");

  const mdResult = await render({ packageId: pkg.id, format: "markdown", forceRerender: true });
  check("Markdown render completed", !!mdResult.outputId);
  check("Markdown content starts with #", mdResult.content.startsWith("# "));

  // ─── 14. FAQ via API ───────────────────────────────────────────────────────
  console.log("\n--- 14. FAQ Render ---\n");

  const faqResult = await render({ packageId: pkg.id, format: "html", rendererId: "faq", forceRerender: true });
  check("FAQ render completed", !!faqResult.outputId);
  check("FAQ content has article tag", faqResult.content.includes("<article"));
  check("FAQ has FAQ in title", faqResult.content.includes("Frequently Asked Questions"));

  // ─── 15. Backward Compatibility ────────────────────────────────────────────
  console.log("\n--- 15. Backward Compatibility ---\n");

  const { count: pkgCount } = await sb.from("knowledge_packages").select("*", { count: "exact", head: true });
  const { count: factCount } = await sb.from("knowledge_facts").select("*", { count: "exact", head: true });
  const { count: srcCount } = await sb.from("discovery_sources").select("*", { count: "exact", head: true });
  check("Knowledge packages intact", (pkgCount ?? 0) >= 1);
  check("Knowledge facts intact", (factCount ?? 0) >= 1);
  check("Discovery sources intact", (srcCount ?? 0) >= 1);

  // Verify package was not modified
  const { data: pkgAfter } = await sb.from("knowledge_packages").select("*").eq("id", pkg.id).single();
  check("Package hash unchanged by rendering", pkgAfter?.knowledge_hash === pkg.knowledge_hash);
  check("Package version unchanged by rendering", pkgAfter?.version === pkg.version);

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${"=".repeat(50)}\n`);

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
