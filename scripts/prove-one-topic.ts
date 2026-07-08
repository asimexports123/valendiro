/**
 * PROOF: One topic end-to-end — acquire from web, filter relevance, assemble, publish.
 * Run: npx tsx scripts/prove-one-topic.ts [slug]
 */

import { createAdminClient } from "../lib/supabase/admin";
import { analyzePackageGaps } from "../services/learning/packageGapAnalyzer";
import { seekKnowledgeForGaps } from "../services/learning/webKnowledgeSeeker";
import { assemble } from "../services/knowledge/assembler";
import { filterRelevantCandidates } from "../services/knowledge/relevanceGate";
import { mergeCandidateSets } from "../services/knowledge/multiSourceGatherer";
import { renderPackage } from "../services/render/engine";
import { publishRenderedOutput } from "../services/publish/service";

const SLUG = process.argv[2] ?? "design-patterns";

async function main() {
  const sb = createAdminClient();
  console.log(`\n=== PROOF RUN: ${SLUG} ===\n`);

  const { data: topic } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title, content)")
    .eq("slug", SLUG)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();

  if (!topic) {
    console.error("Topic not found:", SLUG);
    process.exit(1);
  }

  const title = topic.topic_translations?.[0]?.title ?? SLUG;
  const beforeContent = topic.topic_translations?.[0]?.content ?? "";
  const beforeWords = beforeContent.trim().split(/\s+/).filter(Boolean).length;

  console.log("BEFORE:", beforeWords, "words");
  console.log("Preview:", beforeContent.slice(0, 200).replace(/\n/g, " "), "...\n");

  // Gap analysis drives autonomous search
  const gapReport = await analyzePackageGaps(topic.id);
  console.log("Gaps:", gapReport.gaps.slice(0, 3).map((g) => g.detail).join(" | "));

  // Acquire from anywhere — wiki, docs, RSS registry, web search
  const acquired = await seekKnowledgeForGaps(gapReport);
  console.log(`\nAcquired ${acquired.length} raw candidates:`);
  for (const c of acquired) {
    console.log(`  • [${c.sourceAuthority}] ${c.adapterName}: ${c.title.slice(0, 60)} (${c.description?.length ?? 0} chars)`);
  }

  const { kept, dropped } = filterRelevantCandidates(acquired, SLUG, title);
  console.log(`\nRelevance gate: kept ${kept.length}, dropped ${dropped.length}`);
  for (const d of dropped) {
    console.log(`  ✗ ${d.title} — ${d.reason}`);
  }

  if (kept.length === 0) {
    console.error("\nFAIL: No relevant candidates after gate.");
    process.exit(1);
  }

  const report = await assemble({
    slotId: null,
    topicId: topic.id,
    slug: SLUG,
    candidates: kept,
  });

  if (!report.packageId) {
    console.error("\nFAIL: Assembly produced no package.");
    process.exit(1);
  }

  console.log(`\nAssembled: ${report.factsExtracted} facts, package ${report.packageId}`);

  process.env.ALLOW_RENDER = "true";
  const rendered = await renderPackage({
    packageId: report.packageId,
    format: "markdown",
    forceRerender: true,
    policyMode: "strict",
  });

  if (!rendered.outputId) {
    console.error("\nFAIL: Render failed.");
    process.exit(1);
  }

  const pub = await publishRenderedOutput(rendered.outputId, "en");
  if (!pub.success) {
    console.error("\nFAIL: Publish failed:", pub.error);
    process.exit(1);
  }

  const { data: after } = await sb
    .from("topic_translations")
    .select("content")
    .eq("topic_id", topic.id)
    .eq("language_code", "en")
    .maybeSingle();

  const afterContent = after?.content ?? "";
  const afterWords = afterContent.trim().split(/\s+/).filter(Boolean).length;

  console.log("\n=== AFTER ===");
  console.log("Words:", afterWords, `(Δ ${afterWords - beforeWords >= 0 ? "+" : ""}${afterWords - beforeWords})`);
  console.log("Preview:\n", afterContent.slice(0, 600));

  const junkPhrases = ["Users Don't Need More Tools", "Startup Battlefield", "Mark Zuckerberg", "Chevy built"];
  const hasJunk = junkPhrases.some((p) => afterContent.includes(p));
  const hasDesign = /design pattern/i.test(afterContent);

  console.log("\n=== PROOF CHECK ===");
  console.log("Contains design pattern content:", hasDesign ? "✓" : "✗");
  console.log("RSS junk removed:", !hasJunk ? "✓" : "✗ STILL PRESENT");
  console.log("Word count improved:", afterWords >= 800 ? "✓" : afterWords > beforeWords ? "~" : "✗");

  if (hasDesign && !hasJunk && afterWords >= 800) {
    console.log("\n✓ PROOF PASSED for", SLUG);
  } else {
    console.log("\n✗ PROOF INCOMPLETE — engine needs more work on this topic");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
