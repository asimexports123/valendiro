import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, readFileSync, mkdirSync } from "fs";

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

const slug = "what-is-artificial-intelligence";

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

async function main() {
  mkdirSync("temp", { recursive: true });
  const sb = createAdminClient();
  const { data: row } = await sb
    .from("topics")
    .select("id, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!row) throw new Error("missing");
  const title = (row.topic_translations as Array<{ title: string }>)[0].title;
  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id")
    .eq("topic_id", row.id)
    .in("status", ["ready", "draft"]);
  for (const pkg of packages ?? []) {
    await sb.from("rendered_outputs").delete().eq("package_id", pkg.id);
    await sb.from("knowledge_packages").update({ status: "archived" }).eq("id", pkg.id);
  }
  const result = await publishOriginalTopicBySlug(slug);
  const { data: after } = await sb
    .from("topic_translations")
    .select("content")
    .eq("topic_id", row.id)
    .eq("language_code", "en")
    .maybeSingle();
  const opening = extractFirstParagraph(after?.content ?? "");
  const intent = inferReaderFirstQuestion(title, shortTopicLabel(slug, title));
  const scores = scoreOpeningQuality(opening, intent.topicNoun);
  console.log(result.status, scores, opening.slice(0, 220));
  if (result.reason) console.log(result.reason);

  const path = "temp/opening-composer-ceo-report.json";
  const existing = JSON.parse(readFileSync(path, "utf8"));
  const i = existing.reports.findIndex((r: { slug: string }) => r.slug === slug);
  if (i >= 0) {
    existing.reports[i] = {
      ...existing.reports[i],
      status: result.status,
      reason: result.reason,
      newOpening: opening.slice(0, 240),
      wordCount: countWords(after?.content ?? ""),
      openingQuality: scores.openingQuality,
      definitionQuality: scores.definitionQuality,
      readerHook: scores.readerHook,
      humanEditorialScore: scores.humanEditorialScore,
      openingPass: scores.pass,
      openingReasons: scores.reasons,
    };
  }
  existing.published = existing.reports.filter((r: { status: string }) => r.status === "published").length;
  existing.generatedAt = new Date().toISOString();
  writeFileSync(path, JSON.stringify(existing, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
