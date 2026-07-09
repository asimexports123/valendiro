/**
 * Catalog Brain Engine — standalone writer (no renderer, no composer, no LLM).
 *
 * This module owns the full article lifecycle:
 *   understand fuel → plan sections → synthesize prose → quality gate
 *
 * Legacy renderer/composer/autonomousLearner stacks are NOT used here.
 */

import type { CatalogTopicTarget } from "./catalogHierarchy";
import {
  brainUnderstand,
  transformClaim,
  categoryKey,
  notesFactCount,
  type BrainNotes,
} from "./catalogBrainUtils";
import { evaluateBrainQuality, MIN_BRAIN_WORD_COUNT } from "./brainQualityGate";

export interface BrainArticlePlan {
  sections: Array<{
    id: string;
    heading: string;
    factPool: string[];
    minWords: number;
  }>;
}

const CATEGORY_TRANSITIONS: Record<string, string[]> = {
  finance: ["From a risk angle, ", "In portfolio terms, ", "For planners, ", "Equally relevant, "],
  technology: ["In practice, ", "Architecturally, ", "When shipping this, ", "Teams often see that "],
  business: ["Strategically, ", "Operationally, ", "For decision-makers, ", "This also implies "],
  health: ["From a safety lens, ", "Evidence-wise, ", "Clinically, ", "Caregivers should note "],
  education: ["For learners, ", "Pedagogically, ", "When studying this, ", "It helps to know "],
  default: ["Next, ", "This also means ", "Another layer is that ", "Connected to that, "],
};

function transitionsFor(categorySlug: string | null): string[] {
  return CATEGORY_TRANSITIONS[categoryKey(categorySlug)] ?? CATEGORY_TRANSITIONS.default;
}

function lcFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function clusterFacts(facts: string[], max = 5): string[][] {
  const clusters: string[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < facts.length && clusters.length < max; i++) {
    if (used.has(i)) continue;
    const cluster = [facts[i]];
    used.add(i);
    const keys = facts[i].toLowerCase().split(/\W+/).filter((w) => w.length > 4);

    for (let j = i + 1; j < facts.length && cluster.length < 3; j++) {
      if (used.has(j)) continue;
      const overlap = keys.filter((k) => facts[j].toLowerCase().includes(k)).length;
      if (overlap >= 1) {
        cluster.push(facts[j]);
        used.add(j);
      }
    }
    clusters.push(cluster);
  }

  for (let i = 0; i < facts.length && clusters.length < max; i++) {
    if (!used.has(i)) clusters.push([facts[i]]);
  }
  return clusters;
}

function synthesizeParagraph(
  rawFacts: string[],
  topicTitle: string,
  categorySlug: string | null
): string {
  if (rawFacts.length === 0) return "";
  const bridges = transitionsFor(categorySlug);
  const sentences = rawFacts.map((f) => transformClaim(f, topicTitle));
  let out = sentences[0];
  for (let i = 1; i < sentences.length; i++) {
    const bridge = bridges[(i - 1) % bridges.length];
    out += ` ${bridge}${lcFirst(sentences[i].replace(/\.$/, ""))}.`;
  }
  return out;
}

function synthesizeSection(
  facts: string[],
  topicTitle: string,
  categorySlug: string | null,
  maxParagraphs = 3
): string {
  return clusterFacts(facts, maxParagraphs)
    .map((c) => synthesizeParagraph(c, topicTitle, categorySlug))
    .filter((p) => wordCount(p) >= 40)
    .join("\n\n");
}

/** Teaching plan — owned by brain, not legacy composer. */
export function planBrainArticle(target: CatalogTopicTarget, notes: BrainNotes): BrainArticlePlan {
  const { title } = target;
  return {
    sections: [
      {
        id: "what",
        heading: `What ${title} is`,
        factPool: notes.definitions.length > 0 ? notes.definitions : notes.allFacts.slice(0, 5),
        minWords: 120,
      },
      {
        id: "why",
        heading: `Why ${title} matters`,
        factPool: [...notes.properties, ...notes.measurements].slice(0, 8),
        minWords: 100,
      },
      {
        id: "how",
        heading: `How ${title} works`,
        factPool: [...notes.procedures, ...notes.properties.slice(0, 4)],
        minWords: 90,
      },
      {
        id: "ideas",
        heading: "Key ideas",
        factPool: notes.allFacts.slice(0, 12),
        minWords: 80,
      },
      {
        id: "pitfalls",
        heading: "Common pitfalls",
        factPool: [...notes.warnings, ...notes.comparisons.slice(0, 2)],
        minWords: 60,
      },
      {
        id: "faq",
        heading: "Questions readers ask",
        factPool: notes.allFacts.slice(0, 8),
        minWords: 80,
      },
    ].filter((s) => s.factPool.length > 0),
  };
}

function buildFaqBlock(notes: BrainNotes, topicTitle: string, categorySlug: string | null): string {
  const pools = [
    { q: `What is ${topicTitle}?`, facts: notes.definitions.slice(0, 2) },
    { q: `Why does ${topicTitle} matter?`, facts: notes.properties.slice(0, 2) },
    { q: `How do you apply ${topicTitle}?`, facts: notes.procedures.slice(0, 2) },
    { q: `What mistakes should you avoid with ${topicTitle}?`, facts: notes.warnings.slice(0, 2) },
    { q: `How does ${topicTitle} compare to alternatives?`, facts: notes.comparisons.slice(0, 2) },
  ].filter((p) => p.facts.length > 0);

  const lines: string[] = [];
  for (const { q, facts } of pools.slice(0, 5)) {
    const answer = synthesizeParagraph(facts, topicTitle, categorySlug);
    if (wordCount(answer) < 35) continue;
    lines.push(`### ${q}`, "", answer, "");
  }
  return lines.join("\n");
}

function buildKeyIdeasList(facts: string[], topicTitle: string): string {
  return facts
    .slice(0, 10)
    .map((f) => {
      const line = transformClaim(f, topicTitle);
      return `- ${line.length > 180 ? `${line.slice(0, 177).replace(/\s+\S*$/, "")}…` : line}`;
    })
    .join("\n");
}

function buildSteps(procedures: string[], topicTitle: string): string {
  if (procedures.length === 0) return "";
  return procedures
    .slice(0, 6)
    .map((p, i) => `${i + 1}. ${transformClaim(p, topicTitle).replace(/\.$/, "")}`)
    .join("\n");
}

function buildIntro(target: CatalogTopicTarget, notes: BrainNotes): string {
  const path = [target.categoryTitle, target.subcategoryTitle].filter(Boolean).join(" › ");
  const seed = synthesizeParagraph(
    [...notes.definitions.slice(0, 1), ...notes.properties.slice(0, 1)].filter(Boolean),
    target.title,
    target.categorySlug
  );
  const lead = path
    ? `This article explains **${target.title}** within ${path}.`
    : `This article explains **${target.title}** in depth.`;
  return seed ? `${lead} ${seed}` : lead;
}

/** Standalone brain write — no legacy renderer imports. */
export function writeBrainArticle(target: CatalogTopicTarget, notes: BrainNotes): string | null {
  const plan = planBrainArticle(target, notes);
  const parts: string[] = [];
  const path = [target.categoryTitle, target.subcategoryTitle, target.title].filter(Boolean).join(" › ");

  parts.push(`# ${target.title}`, "", `*${path}*`, "", buildIntro(target, notes), "");

  let sectionsWritten = 0;

  for (const section of plan.sections) {
    if (section.id === "faq") continue;
    if (section.id === "ideas") {
      const list = buildKeyIdeasList(section.factPool, target.title);
      if (wordCount(list) < section.minWords) continue;
      parts.push(`## ${section.heading}`, "", list, "");
      sectionsWritten++;
      continue;
    }

    const body = synthesizeSection(section.factPool, target.title, target.categorySlug, 3);
    if (wordCount(body) < section.minWords) continue;
    parts.push(`## ${section.heading}`, "", body, "");
    sectionsWritten++;
  }

  const steps = buildSteps(notes.procedures, target.title);
  if (steps && wordCount(steps) >= 50) {
    parts.push("## Step-by-step", "", steps, "");
    sectionsWritten++;
  }

  const faq = buildFaqBlock(notes, target.title, target.categorySlug);
  if (wordCount(faq) >= 80) {
    parts.push(`## Questions readers ask`, "", faq);
    sectionsWritten++;
  }

  const remember = synthesizeParagraph(
    [...notes.warnings.slice(0, 1), ...notes.definitions.slice(0, 1), ...notes.properties.slice(0, 1)].filter(Boolean),
    target.title,
    target.categorySlug
  );
  if (remember) {
    parts.push("", "## What to remember", "", remember);
    sectionsWritten++;
  }

  if (sectionsWritten < 4) return null;

  return parts.join("\n");
}

export interface BrainEngineResult {
  markdown: string;
  notes: BrainNotes;
  quality: ReturnType<typeof evaluateBrainQuality>;
  sectionsWritten: number;
}

/** Full standalone brain run. */
export function runBrainEngine(
  target: CatalogTopicTarget,
  fuelTexts: string[]
): BrainEngineResult | null {
  if (fuelTexts.length < 3) return null;

  const notes = brainUnderstand(fuelTexts, target.title);
  if (notes.allFacts.length < 8 || notesFactCount(notes) < 10) return null;

  const markdown = writeBrainArticle(target, notes);
  if (!markdown) return null;

  const quality = evaluateBrainQuality(markdown);
  if (!quality.pass || quality.wordCount < MIN_BRAIN_WORD_COUNT) return null;

  const sectionsWritten = (markdown.match(/^## /gm) ?? []).length;
  return { markdown, notes, quality, sectionsWritten };
}
