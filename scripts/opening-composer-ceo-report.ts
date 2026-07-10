/**
 * CEO Opening Composer proof — fuel-first + opening scores for 5 flagships.
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.BRAIN_AUTO_PUBLISH = "true";
process.env.ALLOW_RENDER = "true";
process.env.BRAIN_DEBUG_WRITER = "true";

import { createAdminClient } from "@/lib/supabase/admin";
import { publishOriginalTopicBySlug } from "../services/discovery/catalogOriginalPublish";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { scoreOpeningQuality } from "../services/discovery/brainExplain";
import { inferReaderFirstQuestion } from "../services/discovery/brainReaderIntent";
import { shortTopicLabel } from "@/services/content/topicHeading";
import { countWords } from "@/services/knowledge/contentQualityGate";

const SLUGS = [
  "what-is-artificial-intelligence",
  "design-patterns",
  "html-fundamentals",
  "health-insurance",
  "index-funds",
] as const;

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
    // Published pages may omit H1 — treat first prose as opening
    if (pastTitle || !line.startsWith("#")) {
      pastTitle = true;
      paras.push(line);
    }
  }
  return paras.join(" ").replace(/\*\*/g, "").trim();
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
    const title = trans?.title ?? slug;
    const before = extractFirstParagraph(trans?.content ?? "");
    const target = {
      topicId: row.id,
      slug,
      title,
      wordCount: 0,
      factCount: 0,
      categorySlug: null,
      subcategorySlug: null,
      categoryTitle: null,
      subcategoryTitle: null,
      priorityScore: 0,
      reason: "",
    };
    const fuel = await gatherExternalWorldFuel(target);
    console.log(
      `  fuel sources=${fuel.sourceCount} live=${fuel.liveCrawlCount} rss=${fuel.rssCount} def=${fuel.hasDefinitionSignal} wiki=${fuel.encyclopedicCount}`
    );

    await clearCache(sb, row.id);
    const result = await publishOriginalTopicBySlug(slug);

    const { data: afterRow } = await sb
      .from("topic_translations")
      .select("content")
      .eq("topic_id", row.id)
      .eq("language_code", "en")
      .maybeSingle();
    const content = afterRow?.content ?? "";
    const opening = extractFirstParagraph(content);
    const intent = inferReaderFirstQuestion(title, shortTopicLabel(slug, title));
    const scores = scoreOpeningQuality(opening || before, intent.topicNoun);

    const report = {
      slug,
      title,
      url: `https://valendiro.com/en/topics/${slug}`,
      status: result.status,
      reason: result.reason,
      fuel: {
        sources: fuel.sourceCount,
        liveCrawl: fuel.liveCrawlCount,
        rss: fuel.rssCount,
        hasDefinitionSignal: fuel.hasDefinitionSignal,
        encyclopedic: fuel.encyclopedicCount,
      },
      previousOpening: before.slice(0, 200),
      newOpening: opening.slice(0, 220),
      wordCount: countWords(content),
      openingQuality: scores.openingQuality,
      definitionQuality: scores.definitionQuality,
      readerHook: scores.readerHook,
      humanEditorialScore: scores.humanEditorialScore,
      openingPass: scores.pass,
      openingReasons: scores.reasons,
    };
    reports.push(report);
    console.log(
      `  ${result.status} editorial=${scores.humanEditorialScore} def=${scores.definitionQuality} hook=${scores.readerHook}`
    );
    console.log(`  OPEN: ${opening.slice(0, 160)}`);
    if (result.reason) console.log(`  reason: ${result.reason}`);
  }

  const out = {
    directive: "Opening Composer + fuel-first crawler supply",
    generatedAt: new Date().toISOString(),
    published: reports.filter((r) => r.status === "published").length,
    total: reports.length,
    reports,
  };
  writeFileSync("temp/opening-composer-ceo-report.json", JSON.stringify(out, null, 2));
  console.log("\n=== REPORT → temp/opening-composer-ceo-report.json ===");
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
