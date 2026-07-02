/**
 * Phase 12 Verification: Reading Experience Engine
 *
 * Tests:
 * 1. Typography — sentence variety, no repeated openings
 * 2. Section transitions — inter-section connectors present
 * 3. Callout blocks — warnings render as callouts
 * 4. Table of Contents — generated for 3+ section articles
 * 5. Summary block — key takeaways for 10+ fact articles
 * 6. Reading flow validation — all metrics computed
 * 7. Quality score includes reading flow
 * 8. HTML serialization — new nodes render correctly
 * 9. Markdown serialization — new nodes render correctly
 * 10. Determinism preserved
 * 11. Backward compatibility — prior phases still green
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
import { validateReadingFlow } from "../services/renderer/readingFlowValidator";
import type { PluginFact, CitationInput, RelationshipInput, RendererConfig } from "../services/renderer/types";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Phase 12 Verification: Reading Experience Engine ===\n");

  let passed = 0;
  let failed = 0;

  function check(name: string, ok: boolean) {
    if (ok) { console.log(`  PASS: ${name}`); passed++; }
    else { console.log(`  FAIL: ${name}`); failed++; }
  }

  // Load package
  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("*")
    .eq("slug", "python-programming-fundamentals")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pkg) { console.log("ERROR: No seeded package."); process.exit(1); }
  console.log(`  Using package: ${pkg.slug} (v${pkg.version}, ${pkg.fact_count} facts)\n`);

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

  const decision = evaluate(facts, citations);
  const config: RendererConfig = {
    rendererId: "long-article-v2",
    rendererVersion: "2.0.0",
    templateVersion: "1.0.0",
    format: "html",
    style: ["intermediate"],
    slug: pkg.slug,
    intent: "educate",
    category: "technology",
  };

  // Render
  const tree = longArticleStrategy.render(facts, citations, relationships, config, decision);
  const citTree = decorateWithCitations(tree, citations);
  const html = serializeToHTML(citTree);
  const md = serializeToMarkdown(citTree);

  // ─── 1. Table of Contents ──────────────────────────────────────────────────
  console.log("--- 1. Table of Contents ---\n");

  const tocNode = tree.find((n) => n.type === "table-of-contents");
  check("ToC generated for multi-section article", !!tocNode);
  if (tocNode && tocNode.type === "table-of-contents") {
    check("ToC has 3+ entries", tocNode.entries.length >= 3);
    check("ToC entries have anchors", tocNode.entries.every((e) => e.anchor.length > 0));
    check("ToC entries have text", tocNode.entries.every((e) => e.text.length > 0));
    console.log(`  Entries: ${tocNode.entries.map((e) => e.text).join(" | ")}`);
  }

  // ─── 2. Summary Block ─────────────────────────────────────────────────────
  console.log("\n--- 2. Summary Block ---\n");

  const summaryNode = tree.find((n) => n.type === "summary");
  check("Summary block generated (29 facts >= 10)", !!summaryNode);
  if (summaryNode && summaryNode.type === "summary") {
    check("Summary has 3-5 key points", summaryNode.keyPoints.length >= 3 && summaryNode.keyPoints.length <= 5);
    check("Summary has closing sentence", summaryNode.closingSentence.length > 0);
    console.log(`  Key points: ${summaryNode.keyPoints.length}`);
  }

  // ─── 3. Callout Blocks ─────────────────────────────────────────────────────
  console.log("\n--- 3. Callout Blocks ---\n");

  const calloutNodes = tree.filter((n) => n.type === "callout");
  const hasWarningFacts = facts.some((f) => f.factType === "warning");
  check("Warning facts render as callouts", hasWarningFacts ? calloutNodes.length > 0 : true);
  if (calloutNodes.length > 0) {
    check("Callout has variant 'warning'", calloutNodes.some((n) => n.type === "callout" && (n as any).variant === "warning"));
    check("Callout has children", calloutNodes.every((n) => n.type === "callout" && (n as any).children.length > 0));
  }

  // ─── 4. Section Transitions ────────────────────────────────────────────────
  console.log("\n--- 4. Section Transitions ---\n");

  const paragraphs = tree.filter((n) => n.type === "paragraph");
  const paragraphTexts = paragraphs.map((p) => {
    if (p.type !== "paragraph") return "";
    return p.children.map((c) => typeof c === "string" ? c : "").join("");
  });

  const transitionSignals = [
    "with the fundamentals", "now that", "knowing", "these features",
    "this history", "understanding", "while following",
  ];
  const hasTransitions = paragraphTexts.some((text) =>
    transitionSignals.some((signal) => text.toLowerCase().includes(signal))
  );
  check("Inter-section transitions present", hasTransitions);

  // Section intros
  const introSignals = [
    "several characteristics", "the following features", "a closer look",
    "the history behind", "putting knowledge", "awareness of",
    "numbers tell", "understanding cause",
  ];
  const hasIntros = paragraphTexts.some((text) =>
    introSignals.some((signal) => text.toLowerCase().includes(signal))
  );
  check("Section intro paragraphs present", hasIntros);

  // ─── 5. Typography & Sentence Variety ──────────────────────────────────────
  console.log("\n--- 5. Typography ---\n");

  // Check no two adjacent paragraphs start with same word
  let adjacentRepeats = 0;
  for (let i = 1; i < paragraphTexts.length; i++) {
    const prev = paragraphTexts[i - 1].split(/\s+/)[0]?.toLowerCase();
    const curr = paragraphTexts[i].split(/\s+/)[0]?.toLowerCase();
    if (prev === curr && prev && prev.length > 2) adjacentRepeats++;
  }
  check("No excessive adjacent paragraph same-word starts", adjacentRepeats <= 1);
  console.log(`  Adjacent repeats: ${adjacentRepeats}`);

  // Sentence length variety
  const allSentences = paragraphTexts.join(". ").split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const lengths = allSentences.map((s) => s.trim().split(/\s+/).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / Math.max(1, lengths.length);
  const stdDev = Math.sqrt(variance);
  check("Sentence length std deviation > 2", stdDev > 2);
  console.log(`  Sentence stdDev: ${stdDev.toFixed(1)} words (avg: ${avgLen.toFixed(1)})`);

  // ─── 6. Reading Flow Validation ────────────────────────────────────────────
  console.log("\n--- 6. Reading Flow Validation ---\n");

  const flowMetrics = validateReadingFlow(tree);
  check("Reading flow computed", flowMetrics.overallFlowScore > 0);
  check("Repeated openings score > 0", flowMetrics.repeatedOpenings > 0);
  check("Paragraph balance score > 0", flowMetrics.paragraphLengthBalance > 0);
  check("Heading density score > 0", flowMetrics.headingDensity > 0);
  check("Bullet list ratio score > 0", flowMetrics.bulletListRatio > 0);
  check("Transition quality score > 0", flowMetrics.transitionQuality > 0);
  check("Sentence variety score > 0", flowMetrics.sentenceVariety > 0);
  check("Overall flow score >= 60", flowMetrics.overallFlowScore >= 60);
  console.log(`  Flow: ${flowMetrics.overallFlowScore} (openings: ${flowMetrics.repeatedOpenings}, balance: ${flowMetrics.paragraphLengthBalance}, transitions: ${flowMetrics.transitionQuality}, variety: ${flowMetrics.sentenceVariety})`);

  // ─── 7. Quality Score ──────────────────────────────────────────────────────
  console.log("\n--- 7. Quality Score ---\n");

  const score = scoreQuality(citTree, facts, citations, decision);
  check("Quality score includes readingFlow", !!score.readingFlow);
  check("ReadingFlow overallFlowScore > 0", score.readingFlow.overallFlowScore > 0);
  check("Overall score >= 70", score.overall >= 70);
  check("Word count improved (>= 150)", score.wordCount >= 150);
  console.log(`  Overall: ${score.overall}, Flow: ${score.readingFlow.overallFlowScore}, Words: ${score.wordCount}`);

  // ─── 8. HTML Serialization ─────────────────────────────────────────────────
  console.log("\n--- 8. HTML New Nodes ---\n");

  check("HTML has ToC nav", html.includes("table-of-contents"));
  check("HTML has summary section", html.includes("class=\"summary\""));
  check("HTML has callout aside (or no warning facts)", html.includes("class=\"callout") || !hasWarningFacts);
  check("HTML has ARIA landmarks", html.includes("aria-label"));
  check("HTML has role=note on callouts (or no warning facts)", html.includes("role=\"note\"") || !hasWarningFacts);
  check("HTML has anchor links in ToC", html.includes("href=\"#"));
  console.log(`  HTML length: ${html.length} chars`);

  // ─── 9. Markdown Serialization ─────────────────────────────────────────────
  console.log("\n--- 9. Markdown New Nodes ---\n");

  check("Markdown has ToC (Contents heading)", md.includes("## Contents"));
  check("Markdown has Key Takeaways", md.includes("## Key Takeaways"));
  check("Markdown has admonition syntax (or no warning facts)", md.includes("[!WARNING]") || !hasWarningFacts);
  check("Markdown has ToC links", md.includes("](#"));
  console.log(`  Markdown length: ${md.length} chars`);

  // ─── 10. Determinism ───────────────────────────────────────────────────────
  console.log("\n--- 10. Determinism ---\n");

  const outputs: string[] = [];
  for (let i = 0; i < 10; i++) {
    const t = longArticleStrategy.render(facts, citations, relationships, config, decision);
    const decorated = decorateWithCitations(t, citations);
    outputs.push(serializeToHTML(decorated));
  }
  check("10 renders produce identical output", outputs.every((o) => o === outputs[0]));

  // ─── 11. End-to-End Orchestrator ───────────────────────────────────────────
  console.log("\n--- 11. End-to-End ---\n");

  const result = await render({ packageId: pkg.id, format: "html", forceRerender: true });
  check("E2E render succeeds", !!result.outputId);
  check("E2E score includes readingFlow", !!result.qualityScore.readingFlow);
  check("E2E status is published", result.status === "published");
  check("E2E content has ToC", result.content.includes("table-of-contents"));
  check("E2E content has summary", result.content.includes("summary"));
  console.log(`  Score: ${result.qualityScore.overall}, Flow: ${result.qualityScore.readingFlow.overallFlowScore}`);

  // ─── 12. Backward Compatibility ────────────────────────────────────────────
  console.log("\n--- 12. Backward Compatibility ---\n");

  const { count: pkgCount } = await sb.from("knowledge_packages").select("*", { count: "exact", head: true });
  const { count: factCount } = await sb.from("knowledge_facts").select("*", { count: "exact", head: true });
  check("Knowledge packages intact", (pkgCount ?? 0) >= 1);
  check("Knowledge facts intact", (factCount ?? 0) >= 1);

  const { data: pkgAfter } = await sb.from("knowledge_packages").select("*").eq("id", pkg.id).single();
  check("Package unchanged by rendering", pkgAfter?.knowledge_hash === pkg.knowledge_hash);

  // FAQ still works
  const faqResult = await render({ packageId: pkg.id, format: "html", rendererId: "faq", forceRerender: true });
  check("FAQ renderer still works", !!faqResult.outputId);

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${"=".repeat(50)}\n`);

  // Print sample output preview
  console.log("─── Sample Output Preview (first 800 chars) ───\n");
  console.log(html.slice(0, 800));
  console.log("\n...\n");

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
