/**
 * Re-publish AI + design-patterns after opening/gate fixes.
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync, readFileSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.BRAIN_AUTO_PUBLISH = "true";
process.env.ALLOW_RENDER = "true";
process.env.BRAIN_DEBUG_WRITER = "true";

import { createAdminClient } from "@/lib/supabase/admin";
import { publishOriginalTopicBySlug } from "../services/discovery/catalogOriginalPublish";
import { scoreOpeningQuality } from "../services/discovery/brainExplain";
import { inferReaderFirstQuestion } from "../services/discovery/brainReaderIntent";
import { shortTopicLabel } from "@/services/content/topicHeading";
import { countWords } from "@/services/knowledge/contentQualityGate";

const SLUGS = ["what-is-artificial-intelligence", "design-patterns"] as const;

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
  const updates: Array<Record<string, unknown>> = [];

  for (const slug of SLUGS) {
    console.log(`\n=== ${slug} ===`);
    const { data: row } = await sb
      .from("topics")
      .select("id, slug, topic_translations(title, content)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();
    if (!row) continue;
    const trans = (row.topic_translations as Array<{ title: string; content: string }>)?.[0];
    const title = trans?.title ?? slug;
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
    const scores = scoreOpeningQuality(opening, intent.topicNoun);
    const report = {
      slug,
      title,
      status: result.status,
      reason: result.reason,
      newOpening: opening.slice(0, 240),
      wordCount: countWords(content),
      openingQuality: scores.openingQuality,
      definitionQuality: scores.definitionQuality,
      readerHook: scores.readerHook,
      humanEditorialScore: scores.humanEditorialScore,
      openingPass: scores.pass,
      openingReasons: scores.reasons,
    };
    updates.push(report);
    console.log(
      `  ${result.status} editorial=${scores.humanEditorialScore} def=${scores.definitionQuality} hook=${scores.readerHook}`
    );
    console.log(`  OPEN: ${opening.slice(0, 180)}`);
    if (result.reason) console.log(`  reason: ${result.reason}`);
  }

  // Merge into main CEO report
  const path = "temp/opening-composer-ceo-report.json";
  const existing = JSON.parse(readFileSync(path, "utf8")) as {
    reports: Array<Record<string, unknown>>;
    published: number;
    total: number;
    generatedAt: string;
    directive: string;
  };
  for (const u of updates) {
    const i = existing.reports.findIndex((r) => r.slug === u.slug);
    if (i >= 0) existing.reports[i] = { ...existing.reports[i], ...u };
  }
  existing.published = existing.reports.filter((r) => r.status === "published").length;
  existing.generatedAt = new Date().toISOString();
  writeFileSync(path, JSON.stringify(existing, null, 2));
  console.log("\nUpdated", path, "published", existing.published, "/", existing.total);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
