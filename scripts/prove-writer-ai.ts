/**
 * PROOF: Brain writer fixes for what-is-artificial-intelligence.
 * Run: npx tsx scripts/prove-writer-ai.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.ALLOW_RENDER = "true";
process.env.BRAIN_AUTO_PUBLISH = "true";

import { publishOriginalTopicBySlug } from "../services/discovery/catalogOriginalPublish";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { prepareBrainCandidates } from "../services/discovery/brainAssemble";
import { writeBrainArticleOriginal } from "../services/discovery/brainWriter";
import { evaluateOriginality } from "../services/discovery/originalityGate";
import { scoreInternalContent } from "../services/discovery/internalContentScorer";
import { createAdminClient } from "../lib/supabase/admin";
import type { CatalogTopicTarget } from "../services/discovery/catalogHierarchy";
import { PHASE_1_SEED_SLUG_SET } from "../config/phase1SeedTopics";

const SLUG = "what-is-artificial-intelligence";

async function loadTarget(slug: string): Promise<CatalogTopicTarget | null> {
  const sb = createAdminClient();
  const { data: row } = await sb
    .from("topics")
    .select("id, slug, category_id, subcategory_id, topic_translations(title, content)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!row) return null;
  const trans = row.topic_translations?.[0];
  const content = trans?.content ?? "";
  return {
    topicId: row.id,
    slug: row.slug,
    title: trans?.title ?? row.slug,
    wordCount: content.trim().split(/\s+/).filter(Boolean).length,
    factCount: 0,
    categorySlug: null,
    categoryTitle: null,
    subcategorySlug: null,
    subcategoryTitle: null,
    priorityScore: 100,
    reason: "proof script",
  };
}

async function main() {
  console.log(`\n=== BRAIN WRITER PROOF: ${SLUG} ===\n`);

  const target = await loadTarget(SLUG);
  if (!target) {
    console.error("Topic not found");
    process.exit(1);
  }

  const fuel = await gatherExternalWorldFuel(target);
  const prepared = prepareBrainCandidates(target, fuel);
  const written = writeBrainArticleOriginal(
    prepared.notes,
    target.title,
    target.slug,
    fuel.texts
  );

  if (written) {
    const originality = evaluateOriginality(written.markdown, fuel.texts);
    const internal = scoreInternalContent({
      content: written.markdown,
      sourceTexts: fuel.texts,
      topicTitle: target.title,
      isSeed: PHASE_1_SEED_SLUG_SET.has(SLUG),
    });

    const body = written.markdown.replace(/^#.+$/m, "").trim();
    const sentences = body
      .replace(/^##\s+.+$/gm, "")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 40);

    console.log("--- Writer metrics ---");
    console.log(`Overlap:        ${Math.round((written.originalityOverlap ?? originality.maxOverlap) * 100)}%`);
    console.log(`Originality:    ${originality.pass ? "PASS" : "FAIL"} (${originality.reason})`);
    console.log(`Internal score: ${internal.overallScore} (${internal.passed ? "PASS" : "FAIL"})`);
    console.log(`Word count:     ${written.wordCount}`);
    console.log(`Attempts:       ${written.attempts}`);
    console.log("\n--- Sample sentences ---");
    console.log(`1. ${sentences[0]?.slice(0, 200) ?? "(none)"}`);
    console.log(`2. ${sentences[1]?.slice(0, 200) ?? "(none)"}`);
  } else {
    console.log("Writer: FAILED to produce original article");
  }

  console.log("\n--- Publish run ---");
  const result = await publishOriginalTopicBySlug(SLUG);
  console.log(`Publish status: ${result.status}`);
  if (result.reason) console.log(`Reason:         ${result.reason}`);
  if (result.internalScore != null) console.log(`Internal score: ${result.internalScore}`);
  if (result.wordCount != null) console.log(`Word count:     ${result.wordCount}`);

  process.exit(result.status === "published" ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
