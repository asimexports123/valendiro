/**
 * Re-score narrative metrics on live flagships (no republish).
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, readFileSync, mkdirSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "@/lib/supabase/admin";
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

async function main() {
  mkdirSync("temp", { recursive: true });
  const sb = createAdminClient();
  const path = "temp/narrative-ordering-ceo-report.json";
  const existing = JSON.parse(readFileSync(path, "utf8"));

  for (const slug of SLUGS) {
    const { data: row } = await sb
      .from("topics")
      .select("id, slug, topic_translations(title, content)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();
    if (!row) continue;
    const title = (row.topic_translations as Array<{ title: string; content: string }>)[0].title;
    const content = (row.topic_translations as Array<{ title: string; content: string }>)[0].content;
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
    const arc = composeArticleArc(planArticleReasoning(notes, shortTopicLabel(slug, title), 0));
    const narrative = scoreNarrativeQuality(content, arc);
    const i = existing.reports.findIndex((r: { slug: string }) => r.slug === slug);
    if (i >= 0) {
      existing.reports[i] = {
        ...existing.reports[i],
        wordCount: countWords(content),
        narrativeFlowScore: narrative.narrativeFlowScore,
        conceptDependencyScore: narrative.conceptDependencyScore,
        readerUnderstandingScore: narrative.readerUnderstandingScore,
        ceoEditorialScore: narrative.ceoEditorialScore,
        narrativePass: narrative.pass,
        whyDisconnected: narrative.pass ? [] : narrative.reasons,
      };
    }
    console.log(
      slug,
      `flow=${narrative.narrativeFlowScore}`,
      `dep=${narrative.conceptDependencyScore}`,
      `understand=${narrative.readerUnderstandingScore}`,
      `editorial=${narrative.ceoEditorialScore}`,
      narrative.pass ? "PASS" : `WHY: ${narrative.reasons.slice(0, 2).join("; ")}`
    );
  }
  existing.generatedAt = new Date().toISOString();
  writeFileSync(path, JSON.stringify(existing, null, 2));
  console.log("Updated", path);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
