/**
 * CEO Editorial Refinement — regenerate 5 flagships and report compression.
 * Run: npx tsx scripts/editorial-refinement-ceo-report.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.BRAIN_AUTO_PUBLISH = "true";
process.env.ALLOW_RENDER = "true";
process.env.BRAIN_DEBUG_WRITER = "true";

import { createAdminClient } from "@/lib/supabase/admin";
import { countWords } from "@/services/knowledge/contentQualityGate";
import { getPhase1SeedTopic } from "@/config/phase1SeedTopics";
import { publishOriginalTopicBySlug } from "../services/discovery/catalogOriginalPublish";
import { getLastEditorialPassStats } from "../services/discovery/brainGrammarPass";
import { isEditorialFillerSentence } from "../services/discovery/brainDiscourseVariety";
import { scoreInternalContent } from "../services/discovery/internalContentScorer";

const SLUGS = [
  "what-is-artificial-intelligence",
  "design-patterns",
  "html-fundamentals",
  "health-insurance",
  "index-funds",
] as const;

const BASE_URL = "https://valendiro.com/en/topics";

function extractFirstParagraph(content: string): string {
  const lines = content.split(/\n/).map((l) => l.trim());
  let pastTitle = false;
  const paras: string[] = [];
  for (const line of lines) {
    if (!line) {
      if (paras.length > 0) break;
      continue;
    }
    if (line.startsWith("# ")) {
      pastTitle = true;
      continue;
    }
    if (line.startsWith("## ")) break;
    if (pastTitle || !line.startsWith("#")) paras.push(line);
  }
  return paras.join(" ").replace(/\*\*/g, "").trim();
}

function countFillerSentences(content: string): number {
  const sentences = content.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.filter((s) => isEditorialFillerSentence(s)).length;
}

function editorialScore(opts: {
  firstPara: string;
  fillerLeft: number;
  words: number;
  defines: boolean;
  meta: boolean;
}): number {
  let score = 70;
  if (opts.defines) score += 12;
  if (!opts.meta) score += 8;
  if (opts.fillerLeft === 0) score += 10;
  else score -= Math.min(20, opts.fillerLeft * 4);
  if (opts.words >= 500 && opts.words <= 1200) score += 5;
  if (opts.words > 1400) score -= 5;
  return Math.max(0, Math.min(100, score));
}

async function clearCache(sb: ReturnType<typeof createAdminClient>, topicId: string) {
  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id")
    .eq("topic_id", topicId)
    .in("status", ["ready", "draft"]);
  for (const pkg of packages ?? []) {
    await sb.from("rendered_outputs").delete().eq("package_id", pkg.id);
    await sb.from("knowledge_packages").update({ status: "archived" }).eq("id", pkg.id);
  }
}

async function main() {
  mkdirSync("temp", { recursive: true });
  const prevPath = "temp/semantic-ranking-ceo-report.json";
  const previousBySlug: Record<string, { firstParagraph?: string; wordCount?: number; newScore?: number }> = {};
  if (existsSync(prevPath)) {
    try {
      const prev = JSON.parse(readFileSync(prevPath, "utf8"));
      for (const r of prev.reports ?? []) previousBySlug[r.slug] = r;
    } catch {
      /* ignore */
    }
  }

  const sb = createAdminClient();
  const reports: Array<Record<string, unknown>> = [];

  for (const slug of SLUGS) {
    console.log(`\n=== ${slug} ===`);
    const { data: row } = await sb
      .from("topics")
      .select("id, slug, topic_translations(title, content)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();
    if (!row) {
      reports.push({ slug, status: "failed", reason: "not found" });
      continue;
    }
    const trans = (row.topic_translations as Array<{ title: string; content: string }>)?.[0];
    const before = trans?.content ?? "";
    const beforePara = extractFirstParagraph(before);
    const beforeWords = countWords(before);
    const beforeFiller = countFillerSentences(before);
    const seed = getPhase1SeedTopic(slug);
    const prevScore = scoreInternalContent({
      content: before,
      sourceTexts: [],
      topicTitle: trans?.title ?? slug,
      isSeed: Boolean(seed),
      ignoreRegression: true,
    }).overallScore;

    await clearCache(sb, row.id);
    const result = await publishOriginalTopicBySlug(slug);
    const passStats = getLastEditorialPassStats();

    const { data: afterRow } = await sb
      .from("topic_translations")
      .select("content")
      .eq("topic_id", row.id)
      .eq("language_code", "en")
      .maybeSingle();
    const after = afterRow?.content ?? "";
    const afterPara = extractFirstParagraph(after);
    const afterWords = countWords(after);
    const afterFiller = countFillerSentences(after);
    const newScore = scoreInternalContent({
      content: after,
      sourceTexts: [],
      topicTitle: trans?.title ?? slug,
      isSeed: Boolean(seed),
      ignoreRegression: true,
    }).overallScore;

    const defines = /\b(is|are|refers to|defined as|means)\b/i.test(afterPara);
    const meta = /that sentence|sections ahead|this guide|hold onto|paragraphs below|buzzword soup/i.test(
      afterPara
    );
    const ceoEditorial = editorialScore({
      firstPara: afterPara,
      fillerLeft: afterFiller,
      words: afterWords,
      defines,
      meta,
    });

    const report = {
      slug,
      title: trans?.title ?? slug,
      url: `${BASE_URL}/${slug}`,
      status: result.status,
      reason: result.reason,
      previousOpening: (previousBySlug[slug]?.firstParagraph ?? beforePara).slice(0, 220),
      newOpening: afterPara.slice(0, 220),
      previousWordCount: previousBySlug[slug]?.wordCount ?? beforeWords,
      newWordCount: afterWords,
      wordsDelta: afterWords - (previousBySlug[slug]?.wordCount ?? beforeWords),
      fillerBefore: beforeFiller,
      fillerAfter: afterFiller,
      fillerRemoved: Math.max(0, beforeFiller - afterFiller),
      sentencesRemovedPass: passStats.sentencesRemoved,
      fillerRemovedPass: passStats.fillerRemoved,
      previousScore: previousBySlug[slug]?.newScore ?? prevScore,
      newScore,
      ceoEditorialScore: ceoEditorial,
      readabilityImprovement:
        afterFiller < beforeFiller || (defines && !meta)
          ? "Denser opening; less meta filler; clearer first-answer definition."
          : "Opening still needs editorial attention.",
    };
    reports.push(report);
    console.log(
      `  ${result.status} — words ${report.previousWordCount}→${afterWords}, filler ${beforeFiller}→${afterFiller}, editorial ${ceoEditorial}` +
        (result.reason ? ` | ${result.reason}` : "")
    );
    console.log(`  OPEN: ${afterPara.slice(0, 140)}`);
  }

  const out = {
    directive: "CEO Editorial Refinement — filler delete + compression (no new engine)",
    generatedAt: new Date().toISOString(),
    published: reports.filter((r) => r.status === "published").length,
    total: reports.length,
    reports,
  };
  writeFileSync("temp/editorial-refinement-ceo-report.json", JSON.stringify(out, null, 2));
  console.log("\n=== CEO EDITORIAL REPORT → temp/editorial-refinement-ceo-report.json ===");
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
