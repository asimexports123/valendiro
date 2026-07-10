/**
 * CEO Editorial Continuity — snapshot previous gen, regenerate 5, compare teaching feel.
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.BRAIN_AUTO_PUBLISH = "true";
process.env.ALLOW_RENDER = "true";
process.env.BRAIN_DEBUG_WRITER = "true";

import { createAdminClient } from "@/lib/supabase/admin";
import { publishOriginalTopicBySlug } from "../services/discovery/catalogOriginalPublish";
import { countWords } from "@/services/knowledge/contentQualityGate";

const SLUGS = [
  "what-is-artificial-intelligence",
  "design-patterns",
  "html-fundamentals",
  "health-insurance",
  "index-funds",
] as const;

function extractBodyParas(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((p) => p.replace(/^#+\s+.+$/m, "").trim())
    .filter((p) => p.length > 40 && !p.startsWith("#"));
}

function teachingSignals(content: string) {
  const paras = extractBodyParas(content);
  const sentences = paras.flatMap((p) => p.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 12));
  const singleSentenceParas = paras.filter(
    (p) => p.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 12).length <= 1
  ).length;
  const continuityMarkers = (
    content.match(
      /\b(That means|In other words|So |Because of that|From there|Continuing that thread|That leads to|Practically,|Building on that)\b/gi
    ) ?? []
  ).length;
  const stockFiller = (
    content.match(
      /\b(Related ideas sit beside|You meet it in everyday tools long before|Once this piece is clear|Treat it as a building block)\b/gi
    ) ?? []
  ).length;
  const avgSentencesPerPara =
    paras.length === 0
      ? 0
      : paras.reduce(
          (n, p) => n + p.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 12).length,
          0
        ) / paras.length;

  return {
    paragraphCount: paras.length,
    sentenceCount: sentences.length,
    singleSentenceParas,
    singleSentenceRatio: paras.length ? singleSentenceParas / paras.length : 0,
    avgSentencesPerPara: Math.round(avgSentencesPerPara * 100) / 100,
    continuityMarkers,
    stockFiller,
    sampleParas: paras.slice(0, 4).map((p) => p.slice(0, 220)),
  };
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
  mkdirSync("temp/previous-editorial-gen", { recursive: true });
  mkdirSync("temp", { recursive: true });
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
    if (!row) continue;
    const trans = (row.topic_translations as Array<{ title: string; content: string }>)[0];
    const before = trans?.content ?? "";
    writeFileSync(`temp/previous-editorial-gen/${slug}.md`, before);
    const beforeSig = teachingSignals(before);

    await clearCache(sb, row.id);
    const result = await publishOriginalTopicBySlug(slug);

    const { data: afterRow } = await sb
      .from("topic_translations")
      .select("content")
      .eq("topic_id", row.id)
      .eq("language_code", "en")
      .maybeSingle();
    const after = afterRow?.content ?? "";
    const afterSig = teachingSignals(after);

    const report = {
      slug,
      title: trans?.title ?? slug,
      status: result.status,
      reason: result.reason,
      wordCountBefore: countWords(before),
      wordCountAfter: countWords(after),
      before: beforeSig,
      after: afterSig,
      deltas: {
        singleSentenceRatio:
          Math.round((afterSig.singleSentenceRatio - beforeSig.singleSentenceRatio) * 1000) / 1000,
        avgSentencesPerPara:
          Math.round((afterSig.avgSentencesPerPara - beforeSig.avgSentencesPerPara) * 100) / 100,
        continuityMarkers: afterSig.continuityMarkers - beforeSig.continuityMarkers,
        stockFiller: afterSig.stockFiller - beforeSig.stockFiller,
      },
    };
    reports.push(report);
    console.log(
      `  ${result.status} singleSent ${beforeSig.singleSentenceRatio.toFixed(2)}→${afterSig.singleSentenceRatio.toFixed(2)} avgSent ${beforeSig.avgSentencesPerPara}→${afterSig.avgSentencesPerPara} continuity ${beforeSig.continuityMarkers}→${afterSig.continuityMarkers} filler ${beforeSig.stockFiller}→${afterSig.stockFiller}`
    );
    if (result.reason) console.log(`  reason: ${result.reason}`);
  }

  const out = {
    directive: "Editor-in-Chief teaching continuity",
    generatedAt: new Date().toISOString(),
    published: reports.filter((r) => r.status === "published").length,
    total: reports.length,
    brainChanges: [
      "Body sections may merge 2 related claims into one teaching paragraph",
      "Secondary claim rendered as follow-on support (That means / So / Practically)",
      "Stock stage filler demoted; empty preferred over generic connectors",
      "Same-stage continuity bridges when subjects overlap",
      "Paragraph gate allows up to 4 sentences for developed teaching",
    ],
    reports,
  };
  writeFileSync("temp/editorial-continuity-ceo-report.json", JSON.stringify(out, null, 2));
  console.log("\n=== REPORT → temp/editorial-continuity-ceo-report.json ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
