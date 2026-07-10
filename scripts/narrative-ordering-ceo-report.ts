/**
 * CEO Narrative Ordering proof — regenerate 5 flagships; report narrative scores only.
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
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { getPhase1SeedTopic } from "../config/phase1SeedTopics";
import { rankBrainNotes } from "../services/discovery/brainSemanticRank";
import { planArticleReasoning } from "../services/discovery/brainReasoning";
import { composeArticleArc } from "../services/discovery/brainCompose";
import { scoreNarrativeQuality } from "../services/discovery/brainNarrativeOrder";
import { shortTopicLabel } from "@/services/content/topicHeading";
import { countWords } from "@/services/knowledge/contentQualityGate";

const SLUGS = [
  "what-is-artificial-intelligence",
  "design-patterns",
  "html-fundamentals",
  "health-insurance",
  "index-funds",
] as const;

function extractHeadings(content: string): string[] {
  return content
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => l.replace(/^##\s+/, "").trim());
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
    const title = (row.topic_translations as Array<{ title: string }>)?.[0]?.title ?? slug;
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
    const seed = getPhase1SeedTopic(slug);
    const notes = rankBrainNotes(
      brainUnderstand(fuel.texts, seed?.primaryKeyword ?? title),
      shortTopicLabel(slug, title),
      { slug }
    );
    const reasoning = planArticleReasoning(notes, shortTopicLabel(slug, title), 0);
    const arc = composeArticleArc(reasoning);

    await clearCache(sb, row.id);
    const result = await publishOriginalTopicBySlug(slug);

    const { data: afterRow } = await sb
      .from("topic_translations")
      .select("content")
      .eq("topic_id", row.id)
      .eq("language_code", "en")
      .maybeSingle();
    const content = afterRow?.content ?? "";
    const narrative = scoreNarrativeQuality(content, arc);
    const headings = extractHeadings(content);

    const disconnected =
      narrative.ceoEditorialScore < 80 ||
      narrative.narrativeFlowScore < 70 ||
      narrative.readerUnderstandingScore < 70;

    const report = {
      slug,
      title,
      url: `https://valendiro.com/en/topics/${slug}`,
      status: result.status,
      reason: result.reason,
      wordCount: countWords(content),
      headings,
      narrativeFlowScore: narrative.narrativeFlowScore,
      conceptDependencyScore: narrative.conceptDependencyScore,
      readerUnderstandingScore: narrative.readerUnderstandingScore,
      ceoEditorialScore: narrative.ceoEditorialScore,
      narrativePass: narrative.pass,
      whyDisconnected: disconnected ? narrative.reasons : [],
    };
    reports.push(report);
    console.log(
      `  ${result.status} flow=${narrative.narrativeFlowScore} dep=${narrative.conceptDependencyScore} understand=${narrative.readerUnderstandingScore} editorial=${narrative.ceoEditorialScore}`
    );
    console.log(`  H2: ${headings.join(" | ")}`);
    if (disconnected) console.log(`  WHY: ${narrative.reasons.slice(0, 3).join("; ")}`);
    if (result.reason) console.log(`  reason: ${result.reason}`);
  }

  const out = {
    directive: "Narrative Ordering Layer",
    generatedAt: new Date().toISOString(),
    published: reports.filter((r) => r.status === "published").length,
    total: reports.length,
    reports,
  };
  writeFileSync("temp/narrative-ordering-ceo-report.json", JSON.stringify(out, null, 2));
  console.log("\n=== REPORT → temp/narrative-ordering-ceo-report.json ===");
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
