/**
 * Discourse variety — avoid repeating mechanical openers across an article (no LLM).
 *
 * Support lines must teach, explain, connect, or illustrate — never meta filler.
 */

import type { JourneyStage } from "./brainDiscoursePlanner";

export interface DiscourseVarietyContext {
  openerCounts: Map<string, number>;
  paragraphIndex: number;
}

let activeContext: DiscourseVarietyContext | null = null;

export function createDiscourseVarietyContext(): DiscourseVarietyContext {
  return { openerCounts: new Map(), paragraphIndex: 0 };
}

export function withDiscourseVariety<T>(fn: () => T): T {
  activeContext = createDiscourseVarietyContext();
  try {
    return fn();
  } finally {
    activeContext = null;
  }
}

export function getDiscourseVariety(): DiscourseVarietyContext | null {
  return activeContext;
}

function trackOpener(phrase: string): void {
  if (!activeContext || !phrase) return;
  const key = phrase.toLowerCase().replace(/[^\w\s]/g, "").trim();
  activeContext.openerCounts.set(key, (activeContext.openerCounts.get(key) ?? 0) + 1);
}

function openerOverused(phrase: string): boolean {
  if (!activeContext) return false;
  const key = phrase.toLowerCase().replace(/[^\w\s]/g, "").trim();
  return (activeContext.openerCounts.get(key) ?? 0) >= 1;
}

const LEAD_MARKERS = [
  "",
  "",
  "",
  "In practice,",
  "More specifically,",
  "",
];

const VOICE_SUPPORT_MARKERS: Record<string, string[]> = {
  explain: ["", "", "", "In practice,"],
  example: ["", "For example,", ""],
  contrast: ["By contrast,", "", ""],
  warn: ["", "Worth noting:", ""],
  compare: ["", "", "On balance,"],
  conclude: ["", "", ""],
  question: ["", "", ""],
};

/**
 * Content-bearing supports only. Prefer empty — fact elaboration / examples fill the gap.
 * Never: "that sentence", "sections ahead", "this guide", "hold onto", "paragraphs below".
 */
const STAGE_SUPPORTS: Partial<Record<JourneyStage, string[]>> = {
  definition: [],
  why_it_matters: [
    "When this is missing, people guess instead of deciding with a shared model.",
    "The cost shows up in rework, confusion, and mismatched expectations.",
  ],
  core_ideas: [],
  how_it_works: [
    "Follow the sequence once; the labels matter less than the order of operations.",
  ],
  examples: [],
  applications: [
    "Match the idea to a choice you might actually face this week.",
  ],
  benefits: [],
  limitations: [
    "Name the boundary early so the idea is not asked to do work it cannot do.",
  ],
  mistakes: [
    "Catching the pattern early is cheaper than explaining the failure later.",
  ],
  summary: [],
};

/** Meta / filler sentences that must never survive composition. */
export const EDITORIAL_FILLER_PATTERNS: RegExp[] = [
  /\bthat sentence is enough\b/i,
  /\borient someone new to the topic\b/i,
  /\bthe sections ahead\b/i,
  /\beach idea below\b/i,
  /\bhold onto this\b/i,
  /\bkeep that idea in mind\b/i,
  /\beverything below builds\b/i,
  /\bthe rest of the guide\b/i,
  /\bthis guide\b/i,
  /\bthe paragraphs below\b/i,
  /\bthe next section\b/i,
  /\bsections ahead unpack\b/i,
  /\bfrom there, the rest\b/i,
  /\bthat framing helps\b/i,
  /\bhold that thought\b/i,
  /\bremember this point\b/i,
  /\bas you read on\b/i,
  /\bin the pages that follow\b/i,
  /\bwhat follows in this article\b/i,
  /\bthis article explains\b/i,
  /\bthis article looks\b/i,
  /\bif .+ has felt like buzzword soup\b/i,
  /\bstays concrete\. we cover what it is\b/i,
  /\bthat trio is enough\b/i,
  /\bwalking away\b/i,
  /\bwhat to remember:\b/i,
];

export function isEditorialFillerSentence(sentence: string): boolean {
  const t = sentence.trim();
  if (!t) return true;
  if (EDITORIAL_FILLER_PATTERNS.some((re) => re.test(t))) return true;
  // Pure meta about reading the article, not about the subject
  if (
    /^(the|this|those)\s+(section|paragraph|guide|article|chapter)s?\b/i.test(t) &&
    /\b(below|ahead|follow|unpack|cover|explain)\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

/** Whether to prefix the lead with a discourse marker (minority of paragraphs). */
export function shouldUseLeadMarker(seed: number, isFirstAnswer = false): boolean {
  if (isFirstAnswer) return false;
  const ctx = activeContext;
  const idx = ctx?.paragraphIndex ?? seed;
  if (ctx) ctx.paragraphIndex++;
  return idx % 5 === 0;
}

/** Pick a lead opener, avoiding repeats. Empty string = start with the idea directly. */
export function pickLeadMarker(seed: number, isFirstAnswer = false): string {
  if (!shouldUseLeadMarker(seed, isFirstAnswer)) return "";
  for (let i = 0; i < LEAD_MARKERS.length; i++) {
    const marker = LEAD_MARKERS[(seed + i) % LEAD_MARKERS.length];
    if (!marker) return "";
    if (!openerOverused(marker)) {
      trackOpener(marker);
      return marker;
    }
  }
  return "";
}

/** Pick a support linker — often empty so the support stands on its own. */
export function pickSupportMarker(voice: string, seed: number): string {
  const options = VOICE_SUPPORT_MARKERS[voice] ?? VOICE_SUPPORT_MARKERS.explain;
  for (let i = 0; i < options.length; i++) {
    const marker = options[(seed + i) % options.length];
    if (!marker) return "";
    if (!openerOverused(marker)) {
      trackOpener(marker);
      return marker;
    }
  }
  return "";
}

/**
 * Varied support for a journey stage.
 * Returns empty often so composition prefers fact elaboration / examples over stock lines.
 */
export function variedSupportForStage(
  stage: JourneyStage,
  topicRef: string,
  seed: number
): string {
  // Prefer silence — caller should use claim elaboration or examples first
  if (seed % 2 !== 0) return "";
  const pool = STAGE_SUPPORTS[stage] ?? STAGE_SUPPORTS.core_ideas ?? [];
  if (pool.length === 0) return "";
  const support = pool[(seed + (activeContext?.paragraphIndex ?? 0)) % pool.length];
  if (!support || isEditorialFillerSentence(support)) return "";
  return support.replace(/\{topicRef\}/g, topicRef);
}

/** Strip overused discourse markers and leftover filler from composed text. */
export function stripOverusedDiscourse(text: string): string {
  let out = text;
  out = out.replace(/\bThat framing helps you recognize[^.]+\.\s*/gi, "");
  out = out.replace(/^(In plain terms|Stated plainly|The point is that),?\s*/i, "");
  const sentences = out.split(/(?<=[.!?])\s+/).filter(Boolean);
  out = sentences.filter((s) => !isEditorialFillerSentence(s)).join(" ");
  return out.trim();
}
