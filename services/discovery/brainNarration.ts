/**
 * Brain narration — human voice and flow from journey meaning (no LLM, no topic templates).
 */

import type { ParagraphThesis } from "./brainReasoning";
import type { JourneyStage } from "./brainDiscoursePlanner";

export type NarrationVoice =
  | "explain"
  | "example"
  | "contrast"
  | "warn"
  | "compare"
  | "conclude"
  | "question";

const MECHANICAL_BRIDGE =
  /^(From there|Building on that idea|That foundation leads to a related point|With that context set|The next piece of the picture is that|This connects directly),?\s*/i;

/** Journey-stage bridges — matched by idea progression, not topic name. */
const STAGE_BRIDGES: Array<{ from: JourneyStage; to: JourneyStage; bridge: string }> = [
  { from: "definition", to: "why_it_matters", bridge: "That definition matters because " },
  { from: "definition", to: "core_ideas", bridge: "From that meaning, " },
  { from: "core_ideas", to: "how_it_works", bridge: "In operation, " },
  { from: "how_it_works", to: "applications", bridge: "In everyday use, " },
  { from: "applications", to: "benefits", bridge: "Those uses pay off when " },
  { from: "benefits", to: "limitations", bridge: "Still, " },
  { from: "limitations", to: "mistakes", bridge: "A common failure mode is that " },
];

function stageFromIdea(idea: string): JourneyStage {
  const i = idea.toLowerCase();
  if (/what .+ is|definition/.test(i)) return "definition";
  if (/why .+ matters/.test(i)) return "why_it_matters";
  if (/how .+ works/.test(i)) return "how_it_works";
  if (/shows up|application|concrete example/.test(i)) return "applications";
  if (/benefit/.test(i)) return "benefits";
  if (/limitation/.test(i)) return "limitations";
  if (/mistake/.test(i)) return "mistakes";
  if (/takeaway|essential/.test(i)) return "summary";
  return "core_ideas";
}

/** Pick narration voice from section role and claim meaning. */
export function voiceForThesis(
  thesis: ParagraphThesis,
  sectionId: string,
  index: number
): NarrationVoice {
  const stage = stageFromIdea(thesis.centralIdea);
  if (sectionId === "summary" || stage === "summary") return "conclude";
  if (sectionId === "mistakes" || stage === "mistakes" || stage === "limitations") return "warn";
  if (stage === "applications" || stage === "examples") return "example";
  if (thesis.claims[0]?.relation === "compares") return "compare";
  if (stage === "why_it_matters" && index % 3 === 0) return "question";
  return "explain";
}

function subjectsOverlap(a: ParagraphThesis, b: ParagraphThesis): boolean {
  const sa = (a.claims[0]?.subject || a.centralIdea).toLowerCase().trim();
  const sb = (b.claims[0]?.subject || b.centralIdea).toLowerCase().trim();
  if (sa.length > 3 && sb.length > 3 && (sa === sb || sa.includes(sb) || sb.includes(sa))) {
    return true;
  }
  const aw = new Set(
    (a.claims[0]?.assertion || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
  );
  const bw = (b.claims[0]?.assertion || "").toLowerCase().split(/\s+/).filter((w) => w.length > 4);
  let shared = 0;
  for (const w of bw) if (aw.has(w)) shared++;
  return shared >= 3;
}

export function shouldAddBridge(
  prev: ParagraphThesis | null,
  next: ParagraphThesis,
  sectionId: string,
  index: number,
  seed: number
): boolean {
  if (!prev || index === 0 || sectionId === "summary") return false;
  const from = stageFromIdea(prev.centralIdea);
  const to = stageFromIdea(next.centralIdea);
  // Same-stage continuity: teacher continuing one thread
  if (from === to) {
    return subjectsOverlap(prev, next) && (seed + index) % 2 === 0;
  }
  // Stage change: bridge more often so the reader feels earned progression
  return (seed + index) % 3 !== 2;
}

export function subtleBridge(
  prev: ParagraphThesis,
  next: ParagraphThesis,
  firstSentence: string
): string {
  if (MECHANICAL_BRIDGE.test(firstSentence)) {
    return firstSentence.replace(MECHANICAL_BRIDGE, "");
  }
  const from = stageFromIdea(prev.centralIdea);
  const to = stageFromIdea(next.centralIdea);
  if (from === to && subjectsOverlap(prev, next)) {
    const cont = ["From there, ", "That leads to another piece: ", "Continuing that thread, "];
    const pick = cont[Math.abs(prev.centralIdea.length + next.centralIdea.length) % cont.length];
    return pick + lowerFirst(firstSentence.replace(MECHANICAL_BRIDGE, ""));
  }
  for (const { from: f, to: t, bridge } of STAGE_BRIDGES) {
    if (f === from && t === to) {
      const rest = firstSentence.replace(MECHANICAL_BRIDGE, "");
      return bridge + lowerFirst(rest);
    }
  }
  return firstSentence;
}

function lowerFirst(s: string): string {
  if (!s) return s;
  const m = s.match(/^(\S+)([\s\S]*)$/);
  if (!m) return s;
  const word = m[1];
  if (/^[A-Z]{2,}$/.test(word)) return s;
  return `${word.charAt(0).toLowerCase()}${word.slice(1)}${m[2]}`;
}

export function stripMechanicalTransitions(text: string): string {
  return text
    .replace(MECHANICAL_BRIDGE, "")
    .replace(/\bThis matters because\b/gi, "")
    .replace(/\bPut simply,\b/gi, "")
    .replace(/\bAs a result,\b/gi, "")
    .replace(/\bThat is why\b/gi, "")
    .replace(/\bThat sentence is enough[^.]+\.\s*/gi, "")
    .replace(/\bThe sections ahead[^.]+\.\s*/gi, "")
    .replace(/\bThe paragraphs below[^.]+\.\s*/gi, "")
    .replace(/\bHold onto this[^.]+\.\s*/gi, "")
    .replace(/\bEach idea below[^.]+\.\s*/gi, "")
    .replace(/\bKeep that idea in mind[^.]+\.\s*/gi, "")
    .replace(/\bThis article explains[^.]*\.\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Extract examples from the fact itself — never inject topic-specific product names. */
export function realWorldExampleFor(thesis: ParagraphThesis): string | null {
  const fact = thesis.claims[0]?.sourceFact ?? thesis.mainIdea;
  const m = fact.match(/(?:such as|including|includes?|e\.g\.|for example)\s+(.+?)(?:\.|;|$)/i);
  if (!m) return null;
  const items = m[1]
    .split(/,|\band\b/)
    .map((p) => p.trim())
    .filter((p) => p.length > 2 && p.length < 40)
    .slice(0, 3);
  if (items.length === 0) return null;
  const joined =
    items.length === 1
      ? items[0]
      : items.length === 2
        ? `${items[0]} and ${items[1]}`
        : `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  return `For example, ${joined}.`;
}

export function composeSummaryConclusion(topicLabel: string, displayName: string): string {
  return [
    `${displayName} is easiest to remember through one real example, one core idea, and one limitation a practitioner would name.`,
    `If you can explain those three without jargon, you understand enough to go deeper when you need to.`,
  ].join(" ");
}

/** Skip summary theses that repeat the opening definition — meaning-based, not topic-specific. */
export function isIntroRepeat(thesis: ParagraphThesis): boolean {
  const idea = thesis.centralIdea.toLowerCase();
  return /what .+ is|definition|essential takeaway about/.test(idea) && thesis.sectionId === "summary";
}

export function sectionLeadLine(sectionId: string, topicLabel: string): string | null {
  // Curiosity hooks are injected by brainTeaching — avoid meta section banners
  void sectionId;
  void topicLabel;
  return null;
}

function ideaRank(idea: string): number {
  const order: JourneyStage[] = [
    "definition",
    "why_it_matters",
    "core_ideas",
    "how_it_works",
    "examples",
    "applications",
    "benefits",
    "limitations",
    "mistakes",
    "summary",
  ];
  const stage = stageFromIdea(idea);
  const idx = order.indexOf(stage);
  return idx >= 0 ? idx * 10 : 35;
}

export { ideaRank as journeyRankForIdea };
