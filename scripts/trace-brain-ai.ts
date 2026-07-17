/**
 * Trace brain pipeline for what-is-artificial-intelligence.
 * Run: npx tsx scripts/trace-brain-ai.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { prepareBrainCandidates } from "../services/discovery/brainAssemble";
import { traceBrainPipeline, writeBrainArticleOriginal } from "../services/discovery/brainWriter";
import { auditParagraphQuality } from "../services/discovery/paragraphQualityGate";
import { scoreInternalContent } from "../services/discovery/internalContentScorer";
import { createAdminClient } from "../lib/supabase/admin";
import type { CatalogTopicTarget } from "../services/discovery/catalogHierarchy";
import { PHASE_1_SEED_SLUG_SET } from "../config/phase1SeedTopics";

const SLUG = "what-is-artificial-intelligence";
const LIVE_URL = `https://valendiro.com/en/topics/${SLUG}`;

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
    reason: "trace script",
  };
}

async function fetchLiveArticle(): Promise<string | null> {
  try {
    const res = await fetch(LIVE_URL);
    if (!res.ok) return null;
    const html = await res.text();
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (!articleMatch) return null;
    return articleMatch[1]
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n")
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n")
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return null;
  }
}

function extractParagraphs(markdown: string): string[] {
  return markdown
    .replace(/^#.+$/m, "")
    .split(/\n{2,}/)
    .map((p) => p.replace(/^##\s+.+$/m, "").trim())
    .filter((p) => p.length > 30);
}

async function main() {
  console.log(`\n=== BRAIN TRACE: ${SLUG} ===\n`);

  const target = await loadTarget(SLUG);
  if (!target) {
    console.error("Topic not found");
    process.exit(1);
  }

  const fuel = await gatherExternalWorldFuel(target);
  const prepared = prepareBrainCandidates(target, fuel);

  console.log(`Facts: ${prepared.notes.allFacts.length}`);
  console.log(`Definitions: ${prepared.notes.definitions.length}`);
  console.log(`Properties: ${prepared.notes.properties.length}\n`);

  const trace = traceBrainPipeline(
    prepared.notes,
    target.title,
    target.slug,
    fuel.texts
  );

  console.log("--- PIPELINE TRACE ---\n");
  for (const stage of trace) {
    console.log(`STAGE: ${stage.stage}`);
    console.log(`  knowledgeIn:  ${stage.knowledgeIn.slice(0, 120)}${stage.knowledgeIn.length > 120 ? "…" : ""}`);
    console.log(`  understood:   ${stage.understood.slice(0, 120)}${stage.understood.length > 120 ? "…" : ""}`);
    console.log(`  reasoning:    ${stage.reasoning}`);
    console.log(`  decision:     ${stage.decision}`);
    console.log(`  paragraphOut: ${stage.paragraphOut.slice(0, 200)}${stage.paragraphOut.length > 200 ? "…" : ""}`);
    const audit = auditParagraphQuality(stage.paragraphOut);
    console.log(`  quality:      ${audit.pass ? "PASS" : `FAIL — ${audit.failures.join("; ")}`}`);
    console.log();
  }

  const written = writeBrainArticleOriginal(
    prepared.notes,
    target.title,
    target.slug,
    fuel.texts
  );

  if (!written) {
    console.error("Writer failed to produce quality article");
    process.exit(1);
  }

  const internal = scoreInternalContent({
    content: written.markdown,
    sourceTexts: fuel.texts,
    topicTitle: target.title,
    isSeed: PHASE_1_SEED_SLUG_SET.has(SLUG),
  });

  console.log("--- NEW ARTICLE METRICS ---");
  console.log(`Word count:     ${written.wordCount}`);
  console.log(`Attempts:       ${written.attempts}`);
  console.log(`Internal score: ${internal.overallScore} (${internal.passed ? "PASS" : "FAIL"})`);
  console.log(`Understanding:  ${internal.categories.understanding.score} (${internal.categories.understanding.pass ? "PASS" : "FAIL"})`);
  if (internal.failures.length) console.log(`Failures:       ${internal.failures.join("; ")}`);

  const oldLive = await fetchLiveArticle();
  const sb = createAdminClient();
  const { data: row } = await sb
    .from("topics")
    .select("topic_translations(content)")
    .eq("slug", SLUG)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  const oldDb = row?.topic_translations?.[0]?.content ?? null;
  const oldArticle = oldLive ?? oldDb ?? "(no old article found)";

  const oldParas = typeof oldArticle === "string" ? extractParagraphs(oldArticle) : [];
  const newParas = extractParagraphs(written.markdown);

  console.log("\n--- OLD vs NEW PARAGRAPHS ---\n");
  const maxParas = Math.max(oldParas.length, newParas.length);
  for (let i = 0; i < maxParas; i++) {
    console.log(`--- Paragraph ${i + 1} ---`);
    console.log(`OLD: ${oldParas[i]?.slice(0, 300) ?? "(none)"}${(oldParas[i]?.length ?? 0) > 300 ? "…" : ""}`);
    console.log(`NEW: ${newParas[i]?.slice(0, 300) ?? "(none)"}${(newParas[i]?.length ?? 0) > 300 ? "…" : ""}`);
    console.log();
  }

  const outPath = resolve(process.cwd(), "scripts", "trace-brain-ai-output.json");
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        slug: SLUG,
        trace,
        oldParagraphs: oldParas,
        newParagraphs: newParas,
        newMarkdown: written.markdown,
        metrics: {
          wordCount: written.wordCount,
          attempts: written.attempts,
          internalScore: internal.overallScore,
          understandingScore: internal.categories.understanding.score,
        },
      },
      null,
      2
    )
  );
  console.log(`Trace saved to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
