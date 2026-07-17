/**
 * Debug exactly why design-patterns and html-fundamentals keep failing.
 * Bypasses the 3-attempt limit; tries once and shows every gate decision.
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "@/lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { brainUnderstand, notesFactCount } from "../services/discovery/catalogBrainUtils";
import { rankBrainNotes, scoreFactPriority, MIN_COMPOSE_PRIORITY } from "../services/discovery/brainSemanticRank";
import { planArticleReasoning } from "../services/discovery/brainReasoning";
import { composeArticleArc } from "../services/discovery/brainCompose";
import {
  composeArticleOpening,
  scoreOpeningQuality,
} from "../services/discovery/brainExplain";
import {
  resolveTopicDisplayName,
  shortTopicLabel,
} from "@/services/content/topicHeading";
import { planArticleSections } from "../services/discovery/languageSystem";
import { auditParagraphQuality, hasAbruptTopicSwitch } from "../services/discovery/paragraphQualityGate";
import { composeSectionNarrative } from "../services/discovery/brainCompose";
import { explainParagraph, explainSectionClose } from "../services/discovery/brainExplain";
import { markIntroIdeasUsed } from "../services/discovery/brainCompose";
import { understandFact } from "../services/discovery/brainUnderstanding";
import { countWords } from "@/services/knowledge/contentQualityGate";

const SLUGS = ["design-patterns", "html-fundamentals"];

function buildSection(heading: string, body: string): string {
  if (countWords(body) < 12) return "";
  return `## ${heading}\n\n${body}\n`;
}

async function debugSlug(slug: string) {
  const sb = createAdminClient();
  const { data: row } = await sb
    .from("topics")
    .select("id, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!row) return { slug, error: "missing" };
  const title = (row.topic_translations as any)[0].title;
  const target = { topicId: row.id, slug, title } as any;

  const fuel = await gatherExternalWorldFuel(target);
  const rawNotes = brainUnderstand(fuel.texts, title, { slug, relaxed: true });
  const ranked = rankBrainNotes(rawNotes, title, { slug });
  const displayName = resolveTopicDisplayName(slug, title);
  const bodyLabel = shortTopicLabel(slug, title);

  // Check definitions
  const defCount = ranked.definitions?.length ?? 0;
  const topDefs = ranked.definitions?.slice(0, 3).map(f => f.slice(0, 120)) ?? [];

  // Check opening gate
  const opening = composeArticleOpening(ranked, bodyLabel, displayName, slug, false);
  const openingResult = opening
    ? {
        score: opening.quality.humanEditorialScore,
        defQuality: opening.quality.definitionQuality,
        pass: opening.quality.pass,
        reasons: opening.quality.reasons,
        snippet: opening.markdown?.slice(0, 200),
      }
    : { error: "no opening returned" };

  // Check sections
  const sectionPlans = planArticleSections(displayName);
  const reasoning = planArticleReasoning(ranked, bodyLabel, 0);
  const arc = composeArticleArc(reasoning, bodyLabel);
  const seenIdeas = new Set<string>();
  markIntroIdeasUsed(ranked, bodyLabel, seenIdeas);

  const sectionResults: any[] = [];
  for (const plan of sectionPlans) {
    const theses = arc.get(plan.id) ?? [];

    let body = "";
    if (plan.id === "practical") {
      // simplified
      body = theses.length > 0 ? "practical content" : "";
    } else {
      const { paragraphs } = composeSectionNarrative(
        theses,
        plan.id,
        seenIdeas,
        (thesis, i) => explainParagraph(thesis, bodyLabel, i),
        explainSectionClose(plan.id, bodyLabel, 0),
        0,
        bodyLabel,
        displayName
      );
      body = paragraphs.join("\n\n");
    }

    const section = buildSection(plan.heading, body);
    const words = countWords(body);

    // paragraph quality check
    const paraAudits = body.split(/\n{2,}/).filter(p => !p.startsWith("##") && p.trim().length > 20).map(p => ({
      snippet: p.slice(0, 80),
      ...auditParagraphQuality(p),
    }));

    sectionResults.push({
      id: plan.id,
      theses: theses.length,
      words,
      built: section.length > 0,
      paraAudits: paraAudits.slice(0, 3),
    });
  }

  const written = sectionResults.filter(s => s.built);
  
  return {
    slug,
    title,
    defCount,
    topDefs,
    allFacts: ranked.allFacts?.length ?? 0,
    props: ranked.properties?.length ?? 0,
    procs: ranked.procedures?.length ?? 0,
    warnings: ranked.warnings?.length ?? 0,
    comparisons: ranked.comparisons?.length ?? 0,
    opening: openingResult,
    sections: sectionResults,
    sectionsBuilt: written.length,
    willPublish: written.length >= 3 && (opening?.quality.pass ?? false),
  };
}

(async () => {
  const results: any[] = [];
  for (const slug of SLUGS) {
    console.error(`Debugging: ${slug}...`);
    try {
      results.push(await debugSlug(slug));
    } catch (e) {
      results.push({ slug, error: String(e) });
    }
  }
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
})();
