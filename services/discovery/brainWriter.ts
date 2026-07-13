/**
 * Brain writer — understand → reason → explain pipeline (no LLM).
 *
 * Transforms extracted facts into original markdown prose. Never pastes raw fuel text.
 */

import { type BrainNotes } from "./catalogBrainUtils";
import { countWords } from "@/services/knowledge/contentQualityGate";
import {
  BRAIN_SECTION_HEADINGS,
  resolveTopicDisplayName,
  shortTopicLabel,
} from "@/services/content/topicHeading";
import { evaluateOriginality } from "./originalityGate";
import { planArticleSections } from "./languageSystem";
import { planArticleReasoning } from "./brainReasoning";
import {
  composeArticleOpening,
  composePracticalApplicationCard,
  explainParagraph,
  explainSectionClose,
  scoreOpeningQuality,
} from "./brainExplain";
import { inferReaderFirstQuestion } from "./brainReaderIntent";
import {
  composeArticleArc,
  composeSectionNarrative,
  markIntroIdeasUsed,
  polishEditorialText,
} from "./brainCompose";
import { understandFact } from "./brainUnderstanding";
import type { UnderstoodClaim } from "./brainUnderstanding";
import type { ParagraphThesis } from "./brainReasoning";
import type { FactKind } from "./languageSystem/types";
import { rankBrainNotes } from "./brainSemanticRank";
import { withDiscourseVariety } from "./brainDiscourseVariety";
import { repairCompositionGrammar } from "./brainGrammarPass";
import { auditParagraphQuality, hasAbruptTopicSwitch } from "./paragraphQualityGate";

function scoreOpeningFromText(opening: string, bodyLabel: string, displayName: string) {
  const intent = inferReaderFirstQuestion(displayName, bodyLabel);
  return scoreOpeningQuality(opening, intent.topicNoun);
}

function buildSection(heading: string, body: string): string {
  if (countWords(body) < 12) return "";
  return `## ${heading}\n\n${body}\n`;
}

function enrichNotes(notes: BrainNotes): BrainNotes {
  const comparisons = notes.comparisons ?? [];
  const warnings =
    (notes.warnings?.length ?? 0) > 0
      ? notes.warnings
      : comparisons.length > 0
        ? comparisons.slice(0, 4)
        : [];
  return {
    ...notes,
    definitions: notes.definitions ?? [],
    properties: notes.properties ?? [],
    procedures: notes.procedures ?? [],
    comparisons,
    measurements: notes.measurements ?? [],
    allFacts: notes.allFacts ?? [],
    warnings,
  };
}

function rotateNotes(notes: BrainNotes, seed: number): BrainNotes {
  const rot = <T>(arr: T[], pinFirst = false): T[] => {
    if (arr.length < 2) return arr;
    if (pinFirst) {
      const [head, ...rest] = arr;
      if (rest.length < 2) return arr;
      const n = seed % rest.length;
      return [head, ...rest.slice(n), ...rest.slice(0, n)];
    }
    const n = seed % arr.length;
    return [...arr.slice(n), ...arr.slice(0, n)];
  };
  return {
    definitions: rot(notes.definitions, true),
    properties: rot(notes.properties),
    procedures: rot(notes.procedures),
    warnings: rot(notes.warnings),
    comparisons: rot(notes.comparisons),
    measurements: rot(notes.measurements),
    allFacts: rot(notes.allFacts),
  };
}

function renderSectionBody(
  theses: ParagraphThesis[],
  topicLabel: string,
  displayName: string,
  seed: number,
  sectionId: string,
  seenIdeas: Set<string>
): string {
  if (sectionId === "practical") {
    const items = theses
      .map((thesis, i) => composePracticalApplicationCard(thesis, topicLabel || displayName, seed + i))
      .filter((item): item is { title: string; summary: string } => Boolean(item))
      .slice(0, 4);
    if (items.length === 0) return "";
    return items.map((item) => `- **${item.title}** — ${item.summary}`).join("\n");
  }

  const { paragraphs } = composeSectionNarrative(
    theses,
    sectionId,
    seenIdeas,
    (thesis, i) => explainParagraph(thesis, topicLabel, seed + i),
    explainSectionClose(sectionId, topicLabel, seed),
    seed,
    topicLabel,
    displayName
  );

  return paragraphs.join("\n\n");
}

export interface BrainWriterResult {
  markdown: string;
  wordCount: number;
  sectionsWritten: number;
}

export interface BrainTraceStage {
  stage: string;
  knowledgeIn: string;
  understood: string;
  reasoning: string;
  decision: string;
  paragraphOut: string;
}

/** Trace the understand → reason → explain pipeline for debugging. */
export function traceBrainPipeline(
  notes: BrainNotes,
  topicTitle: string,
  slug: string,
  sourceTexts: string[] = [],
  seed = 0
): BrainTraceStage[] {
  const enriched = enrichNotes(notes);
  const bodyLabel = shortTopicLabel(slug, topicTitle);
  const reasoning = planArticleReasoning(enriched, bodyLabel, seed);
  const composed = composeArticleArc(reasoning, bodyLabel);
  const stages: BrainTraceStage[] = [];

  const opening = composeArticleOpening(
    notes,
    bodyLabel,
    resolveTopicDisplayName(slug, topicTitle),
    slug,
    false
  );

  stages.push({
    stage: "intro",
    knowledgeIn: [
      ...enriched.definitions.slice(0, 2),
      ...enriched.properties.slice(0, 1),
    ].join(" | "),
    understood: [
      ...enriched.definitions.slice(0, 2),
      ...enriched.properties.slice(0, 1),
    ]
      .map((f, i) => {
        const kind: FactKind = i < enriched.definitions.slice(0, 2).length ? "definition" : "property";
        const c = understandFact(f, bodyLabel, kind);
        return `[${c.relation}] ${c.assertion}`;
      })
      .join(" | "),
    reasoning: "opening composer: What is X? → why → where",
    decision: opening
      ? `opening score ${opening.quality.humanEditorialScore}`
      : "opening failed quality gate",
    paragraphOut: opening?.markdown ?? "",
  });

  const sectionPlans = planArticleSections(resolveTopicDisplayName(slug, topicTitle));
  for (const plan of sectionPlans) {
    const theses = composed.get(plan.id) ?? [];
    for (let i = 0; i < theses.length; i++) {
      const thesis = theses[i];
      stages.push({
        stage: `${plan.id}[${i}]`,
        knowledgeIn: thesis.claims.map((c) => c.sourceFact).join(" | "),
        understood: thesis.claims
          .map((c: UnderstoodClaim) => `[${c.relation}] subj=${c.subject} assert="${c.assertion}"`)
          .join(" | "),
        reasoning: `centralIdea: ${thesis.centralIdea}`,
        decision: `editorial compose — order, dedupe, bridge`,
        paragraphOut: polishEditorialText(explainParagraph(thesis, bodyLabel, seed + i), bodyLabel),
      });
    }
  }

  void sourceTexts;
  return stages;
}

/** Generate a full markdown article from brain notes — no raw source text. */
export function writeBrainArticle(
  notes: BrainNotes,
  topicTitle: string,
  slug: string,
  seed = 0,
  _sourceTexts: string[] = []
): BrainWriterResult | null {
  const enriched = enrichNotes(notes);
  const displayName = resolveTopicDisplayName(slug, topicTitle);
  const bodyLabel = shortTopicLabel(slug, topicTitle);
  const ranked = rankBrainNotes(enriched, bodyLabel, { slug });
  const rotated = rotateNotes(ranked, seed);

  return withDiscourseVariety(() => {
  const sectionPlans = planArticleSections(displayName);
  const reasoning = planArticleReasoning(rotated, bodyLabel, seed);
  const arc = composeArticleArc(reasoning, bodyLabel);
  const seenIdeas = new Set<string>();
  // Keep the opening deterministic across retry seeds; only body phrasing should vary.
  const opening = composeArticleOpening(notes, bodyLabel, displayName, slug, false);
  if (!opening || !opening.quality.pass) {
    if (process.env.BRAIN_DEBUG_WRITER === "true") {
      console.error(
        `[brain-writer] opening blocked: score=${opening?.quality.humanEditorialScore ?? 0} reasons=${(opening?.quality.reasons ?? ["no opening"]).join("; ")}`
      );
    }
    return null;
  }
  markIntroIdeasUsed(rotated, bodyLabel, seenIdeas);
  const parts: string[] = [];
  parts.push(`# ${displayName}`, "", opening.markdown, "");

  const sections: string[] = [];
  for (const plan of sectionPlans) {
    const theses = arc.get(plan.id) ?? [];
    const body = renderSectionBody(theses, bodyLabel, displayName, seed, plan.id, seenIdeas);
    sections.push(buildSection(plan.heading, body));
  }

  const written = sections.filter(Boolean);
  // Calculator rule: if fuel/filtering left too little to teach, refuse to publish a chipak article
  if (written.length < 3) {
    if (process.env.BRAIN_DEBUG_WRITER === "true") {
      console.error(`[brain-writer] only ${written.length} sections written — refuse thin teaching`);
    }
    return null;
  }

  parts.push(...written);
  const protectedOpening = opening.markdown;
  let markdown = repairCompositionGrammar(parts.join("\n"), bodyLabel, displayName);
  // Opening Composer owns the first paragraph — restore if grammar pass damaged it
  markdown = (() => {
    const lines = markdown.split("\n");
    const titleIdx = lines.findIndex((l) => l.startsWith("# "));
    if (titleIdx < 0) return markdown;
    let i = titleIdx + 1;
    while (i < lines.length && lines[i].trim() === "") i++;
    const start = i;
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("## ")) i++;
    return [...lines.slice(0, start), protectedOpening, ...lines.slice(i)].join("\n");
  })();
  // Re-validate first paragraph after grammar pass + restore
  const firstPara = (() => {
    const lines = markdown.split(/\n/).map((l) => l.trim());
    const paras: string[] = [];
    let pastTitle = false;
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
      if (pastTitle) paras.push(line);
    }
    return paras.join(" ");
  })();
  const openingCheck = scoreOpeningFromText(firstPara, bodyLabel, displayName);
  if (!openingCheck.pass) {
    if (process.env.BRAIN_DEBUG_WRITER === "true") {
      console.error(
        `[brain-writer] opening failed after grammar: score=${openingCheck.humanEditorialScore} ${openingCheck.reasons.join("; ")}`
      );
    }
    return null;
  }
  let wordCount = countWords(markdown);

  // Dense knowledge only — never pad with meta Q&A to hit a word count (CEO editorial directive)
  // Publication floor restored to 350 for live visibility (fast path).
  if (wordCount < 350) return null;

  return {
    markdown,
    wordCount,
    sectionsWritten: written.length,
  };
  });
}

const MAX_ORIGINALITY_ATTEMPTS = 24;

function passesQualityGate(markdown: string): boolean {
  const body = markdown.replace(/^#.+$/m, "").trim();
  const nextHeading = `## ${BRAIN_SECTION_HEADINGS.nextSteps}`;
  const mainBody = body.includes(nextHeading) ? body.split(nextHeading)[0].trim() : body;
  // Opening Composer already gated the first paragraph — do not re-fail it here
  const paragraphs = mainBody
    .split(/\n{2,}/)
    .filter((p) => !p.startsWith("##") && p.trim().length > 20)
    .slice(1);

  for (const para of paragraphs) {
    const audit = auditParagraphQuality(para);
    if (!audit.pass) {
      if (process.env.BRAIN_DEBUG_WRITER === "true") {
        console.error(`[brain-writer] quality fail: ${audit.failures.slice(0, 2).join("; ")}`);
      }
      return false;
    }
  }

  for (let i = 1; i < paragraphs.length; i++) {
    if (hasAbruptTopicSwitch(paragraphs[i - 1], paragraphs[i])) {
      if (process.env.BRAIN_DEBUG_WRITER === "true") {
        console.error(`[brain-writer] quality fail: abrupt switch between paragraphs ${i} and ${i + 1}`);
      }
      return false;
    }
  }

  return true;
}

/** Write article, retrying until originality and paragraph quality pass. */
export function writeBrainArticleOriginal(
  notes: BrainNotes,
  topicTitle: string,
  slug: string,
  sourceTexts: string[]
): (BrainWriterResult & { originalityOverlap: number; attempts: number }) | null {
  let structuralMisses = 0;
  for (let attempt = 0; attempt < MAX_ORIGINALITY_ATTEMPTS; attempt++) {
    const written = writeBrainArticle(notes, topicTitle, slug, attempt, sourceTexts);
    if (!written) {
      structuralMisses += 1;
      if (process.env.BRAIN_DEBUG_WRITER === "true") {
        console.error(`[brain-writer] attempt ${attempt + 1}: no article produced`);
      }
      // Same fuel + same gates — more seed jitter will not invent missing sections
      if (structuralMisses >= 3) return null;
      continue;
    }
    structuralMisses = 0;

    const qualityOk = passesQualityGate(written.markdown);
    const originalitySources =
      notes.allFacts.length > 0 ? notes.allFacts : sourceTexts;
    const originality = evaluateOriginality(written.markdown, originalitySources);

    if (process.env.BRAIN_DEBUG_WRITER === "true") {
      console.error(
        `[brain-writer] attempt ${attempt + 1}: quality=${qualityOk} overlap=${originality.maxOverlap.toFixed(3)} pass=${originality.pass} words=${written.wordCount}`
      );
    }

    if (!qualityOk) continue;

    if (originality.pass) {
      return {
        ...written,
        originalityOverlap: originality.maxOverlap,
        attempts: attempt + 1,
      };
    }
  }
  return null;
}
