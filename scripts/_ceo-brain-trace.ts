/**
 * CEO Brain Trace — runs 5 flagship topics through the Brain pipeline
 * and captures every decision: facts in, sections built, TopicModel concepts,
 * what was rejected and why, publish decision.
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "@/lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import {
  brainUnderstand,
  notesFactCount,
  type BrainNotes,
} from "../services/discovery/catalogBrainUtils";
import {
  rankBrainNotes,
  rankFactsForDebug,
  MIN_COMPOSE_PRIORITY,
} from "../services/discovery/brainSemanticRank";
import { planArticleReasoning } from "../services/discovery/brainReasoning";
import { composeArticleArc } from "../services/discovery/brainCompose";
import { buildTopicModel } from "../services/discovery/topicModel";
import { assessFactForSection } from "../services/discovery/readerUnderstanding";
import { writeBrainArticleOriginal } from "../services/discovery/brainWriter";
import { shortTopicLabel } from "@/services/content/topicHeading";
import { planArticleSections } from "../services/discovery/languageSystem";

const SLUGS = [
  // flagship topics
  "what-is-artificial-intelligence",
  "design-patterns",
  "html-fundamentals",
  "health-insurance",
  "index-funds",
  // diverse verification topics to validate generic teaching capability
  "sql-fundamentals",
  "project-management",
  "strength-training-basics",
  "stress-management-basics",
  "compound-interest-explained",
];

async function traceTopic(slug: string) {
  const sb = createAdminClient();
  const { data: row } = await sb
    .from("topics")
    .select("id, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!row) return { slug, error: "missing topic" };
  const title = (row.topic_translations as any)[0].title;
  const target = { topicId: row.id, slug, title } as any;

  // === STAGE 1: Fuel ===
  const fuel = await gatherExternalWorldFuel(target);

  // === STAGE 2: Understand ===
  const rawNotes = brainUnderstand(fuel.texts, title, { slug, relaxed: true });
  const rawFactsTotal = notesFactCount(rawNotes);

  // === STAGE 3: Semantic Ranking ===
  const ranked = rankBrainNotes(rawNotes, title, { slug });
  const rankedDebug = rankFactsForDebug(rawNotes, title, { slug }, 500);
  const semanticKept = rankedDebug.filter((r) => r.priority >= MIN_COMPOSE_PRIORITY);
  const semanticRejected = rankedDebug.filter((r) => r.priority < MIN_COMPOSE_PRIORITY);

  // === STAGE 4: TopicModel ===
  const topicModel = buildTopicModel(ranked, title, { slug });

  // === STAGE 5: Reader Understanding per section ===
  const bodyLabel = shortTopicLabel(slug, title);
  const sectionPlans = planArticleSections(title);
  const sectionTrace: Record<string, { factsIn: number; passed: string[]; rejected: Array<{ fact: string; reason: string; score: number }> }> = {};

  for (const plan of sectionPlans) {
    const passed: string[] = [];
    const rejected: Array<{ fact: string; reason: string; score: number }> = [];
    for (const f of semanticKept.slice(0, 80).map((r) => r.fact)) {
      const a = assessFactForSection(f, plan.id, ranked, bodyLabel, { slug });
      if (a.kept) passed.push(f);
      else rejected.push({ fact: f.slice(0, 100), reason: a.reasons.join(", "), score: a.score });
    }
    sectionTrace[plan.id] = { factsIn: semanticKept.length, passed, rejected: rejected.slice(0, 5) };
  }

  // === STAGE 6: Reasoning / Arc ===
  const reasoning = planArticleReasoning(ranked, bodyLabel, 0);
  const arc = composeArticleArc(reasoning, bodyLabel);
  const arcSummary: Record<string, { theses: number; factsSample: string[] }> = {};
  let totalTheses = 0;
  for (const [sec, theses] of arc.entries()) {
    totalTheses += theses.length;
    arcSummary[sec] = {
      theses: theses.length,
      factsSample: theses.slice(0, 2).map((t) => t.claims[0]?.sourceFact?.slice(0, 80) ?? "").filter(Boolean),
    };
  }
  const stage6_sectionsWithContent = Object.entries(arcSummary).filter(([, v]) => v.theses > 0).map(([k]) => k);
  const stage6_emptySections = sectionPlans.map((p) => p.id).filter((id) => (arcSummary[id]?.theses ?? 0) === 0);

  // === STAGE 7: Write (dry run — no publish) ===
  process.env.BRAIN_AUTO_PUBLISH = "false";
  process.env.ALLOW_RENDER = "false";
  process.env.BRAIN_DEBUG_WRITER = "true";
  const writeResult = writeBrainArticleOriginal(ranked, title, slug, fuel.texts);

  // === False Positives: semantic-rejected facts that look teachable ===
  const falsePositives = semanticRejected
    .filter((r) => {
      const f = r.fact;
      return (
        f.length > 40 &&
        /\b(is|are|helps|enables|allows|because|benefit|used in|used for|step|process|when|who|explains|means|works|makes)\b/i.test(f)
      );
    })
    .slice(0, 8)
    .map((r) => ({ fact: r.fact.slice(0, 120), priority: r.priority, topSignals: r.signals.slice(0, 4) }));

  return {
    slug,
    title,
    fuelSources: fuel.sourceCount,
    stage2_rawFacts: rawFactsTotal,
    stage3_semanticKept: semanticKept.length,
    stage3_semanticRejected: semanticRejected.length,
    stage4_topicModelConcepts: topicModel.concepts.length,
    stage4_topicModelMechanisms: topicModel.mechanisms.length,
    stage5_sectionTrace: sectionTrace,
    stage6_arc: arcSummary,
    stage6_sectionsWithContent,
    stage6_emptySections,
    stage6_totalTheses: totalTheses,
    stage7_published: writeResult !== null,
    stage7_wordCount: writeResult?.wordCount ?? 0,
    stage7_attempts: writeResult?.attempts ?? 0,
    stage7_articleSnippet: writeResult?.markdown?.slice(0, 600) ?? null,
    falsePositives,
    topSemKeptFacts: semanticKept.slice(0, 5).map((r) => ({ fact: r.fact.slice(0, 100), priority: r.priority })),
    topSemRejFacts: semanticRejected.slice(0, 5).map((r) => ({ fact: r.fact.slice(0, 100), priority: r.priority, signals: r.signals.slice(0, 3) })),
  };
}

(async () => {
  const results: any[] = [];
  for (const slug of SLUGS) {
    console.error(`Tracing: ${slug}...`);
    try {
      results.push(await traceTopic(slug));
    } catch (e) {
      results.push({ slug, error: String(e) });
    }
  }
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
})();
