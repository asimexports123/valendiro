/**
 * Brain compose — editorial layer that turns facts into a reading journey (no LLM).
 *
 * Orders ideas, dedupes repeats, adds transitions, and rejects fragments before publish.
 */

import type { ParagraphThesis } from "./brainReasoning";
import { understandFact } from "./brainUnderstanding";
import { isCoherentDiscourse, isCompleteIdeaSentence } from "./paragraphQualityGate";
import {
  composeSummaryConclusion,
  isIntroRepeat,
  realWorldExampleFor,
  shouldAddBridge,
  stripMechanicalTransitions,
  subtleBridge,
} from "./brainNarration";
import { isEditorialFillerSentence } from "./brainDiscourseVariety";
import {
  applyNarrativeOrdering,
  orderSectionNarratively,
} from "./brainNarrativeOrder";
import {
  curiosityAfterThesis,
  orderThesesForTeaching,
  scoreAnswersCuriosity,
  sectionEntryCuriosity,
  wrapTeachingParagraph,
} from "./brainTeaching";

const SOURCE_FRAGMENT_PATTERNS = [
  /\[\d+\]/,
  /\[[a-z]\]/i,
  /\b(rese|trunc)\b/i,
  /\bthis point about\b/i,
  /\balso relates to\b/i,
  /;\s*$/,
  /\b[A-Z][a-z]+,\s+[A-Z][a-z]+,\s+[A-Z][a-z]+,\s+and\s+[A-Z][a-z]+\s+$/,
];

const BRIDGE_OPENERS: string[] = [];

function normalizeIdeaKey(idea: string): string {
  return idea
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeParaKey(paragraph: string): string {
  return paragraph
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

/** Fix acronym / topic-ref grammar glitches from discourse assembly. */
export function polishEditorialText(text: string, topicLabel: string): string {
  let out = stripMechanicalTransitions(text);
  out = out.replace(/\baI\b/g, "AI");
  out = out.replace(/\bthis field development\b/gi, `${topicLabel} development`);
  out = out.replace(/\bthis field systems\b/gi, `${topicLabel} systems`);
  out = out.replace(/\bit programs\b/gi, `${topicLabel} programs`);
  out = out.replace(/\bas this field systems\b/gi, `as ${topicLabel} systems`);
  out = out.replace(/\bin this field development\b/gi, `in ${topicLabel} development`);
  out = out.replace(/\bIn this field,\b/g, `In ${topicLabel},`);
  out = out.replace(/,\s*in it,\s*/gi, `, in ${topicLabel}, `);
  out = out.replace(/\bIn it,\b/g, `In ${topicLabel},`);
  out = out.replace(/\bmade it widely accessible\b/gi, `made ${topicLabel} widely accessible`);
  out = out.replace(/\bwhen this field should\b/gi, `when ${topicLabel} should`);
  out = out.replace(/\bmeet it through\b/gi, `meet ${topicLabel} through`);
  out = out.replace(/\bthis field is rooted\b/gi, `${topicLabel} is rooted`);
  out = out.replace(/\bgenerative this field\b/gi, `generative ${topicLabel}`);
  return out;
}

/** True when a composed paragraph is fit to publish. */
export function isEditoriallySound(paragraph: string, topicLabel = ""): boolean {
  const trimmed = topicLabel ? polishEditorialText(paragraph.trim(), topicLabel) : paragraph.trim();
  if (!trimmed || trimmed.length < 40) return false;
  if (/^\*[^*]+\*$/.test(trimmed)) return false;
  if (!isCoherentDiscourse(trimmed)) return false;
  // Remove harmless numeric/list citations like [1], [12], [a] before fragment checks.
  const citationStripped = trimmed.replace(/\[\d+\]/g, "").replace(/\[[a-z]\]/gi, "");
  if (SOURCE_FRAGMENT_PATTERNS.some((re) => re.test(citationStripped))) return false;
  if (/^[a-z]/.test(trimmed)) return false;
  if (/\baI\b/.test(trimmed)) return false;
  if (/\bthis field (development|systems)\b/i.test(trimmed)) return false;
  if (/^this field is\b/i.test(trimmed)) return false;
  if (/\bcan be combined\b/i.test(trimmed) && !/\b(is a|is an|means)\b/i.test(trimmed)) return false;
  if (/\bit programs\b/i.test(trimmed)) return false;

  const sentences = citationStripped
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .filter((s) => !isEditorialFillerSentence(s));
  if (sentences.length === 0) return false;
  // One dense teaching sentence is better than two with filler
  if (sentences.length === 1) {
    return sentences[0].length >= 40 && (isCompleteIdeaSentence(sentences[0]) || /\b(is|are|means|because|when|for example)\b/i.test(sentences[0]));
  }
  if (sentences.every((s) => s.length > 12)) {
    return !SOURCE_FRAGMENT_PATTERNS.some((re) => re.test(trimmed));
  }
  if (sentences.some((s) => !isCompleteIdeaSentence(s))) return false;
  return true;
}

/** True when two paragraphs repeat the same idea or opening. */
export function paragraphsTooSimilar(a: string, b: string): boolean {
  const ka = normalizeParaKey(a);
  const kb = normalizeParaKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  if (ka.startsWith(kb.slice(0, 50)) || kb.startsWith(ka.slice(0, 50))) return true;
  const wordsA = new Set(ka.split(/\s+/).filter((w) => w.length > 4));
  const wordsB = kb.split(/\s+/).filter((w) => w.length > 4);
  let shared = 0;
  for (const w of wordsB) {
    if (wordsA.has(w)) shared++;
  }
  return shared >= 8;
}

/** Drop theses whose central idea already appeared earlier in the article. */
export function dedupeByCentralIdea(
  theses: ParagraphThesis[],
  seen: Set<string>
): ParagraphThesis[] {
  const kept: ParagraphThesis[] = [];
  for (const thesis of theses) {
    const key = normalizeIdeaKey(thesis.centralIdea);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push(thesis);
  }
  return kept;
}

/** Order theses for a logical reading journey within a section. */
export function orderThesesForJourney(
  theses: ParagraphThesis[],
  sectionId: string
): ParagraphThesis[] {
  return orderSectionNarratively(theses, sectionId);
}

/** Prepend a subtle transition only when the topic shift warrants it. */
export function addParagraphBridge(
  prev: ParagraphThesis | null,
  next: ParagraphThesis,
  paragraph: string,
  seed: number,
  sectionId: string,
  index: number
): string {
  if (!prev || !paragraph.trim()) return paragraph;
  if (!shouldAddBridge(prev, next, sectionId, index, seed)) return paragraph;

  const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) return paragraph;

  const bridgedFirst = subtleBridge(prev, next, sentences[0]);
  return [bridgedFirst, ...sentences.slice(1)].join(" ");
}

export interface ComposedSection {
  paragraphs: string[];
  thesesUsed: ParagraphThesis[];
}

/** Compose a section body: teach by curiosity chain, then render. */
export function composeSectionNarrative(
  theses: ParagraphThesis[],
  sectionId: string,
  seenIdeas: Set<string>,
  renderParagraph: (thesis: ParagraphThesis, index: number) => string,
  sectionClose: string,
  seed: number,
  topicLabel = "",
  displayName = topicLabel
): ComposedSection {
  // Narrative deps first, then reorder by “what is the reader wondering?”
  let pool = orderThesesForTeaching(
    orderThesesForJourney(theses, sectionId),
    sectionId,
    topicLabel || displayName
  );
  if (sectionId === "summary") {
    pool = pool.filter((t) => !isIntroRepeat(t));
  }
  const unique = dedupeByCentralIdea(pool, seenIdeas);

  const paragraphs: string[] = [];
  const thesesUsed: ParagraphThesis[] = [];
  let prevThesis: ParagraphThesis | null = null;
  let liveCuriosity = sectionEntryCuriosity(sectionId, topicLabel || displayName);

  for (let i = 0; i < unique.length; i++) {
    const thesis = unique[i];
    const claim = thesis.claims[0];
    const answeredScore = claim ? scoreAnswersCuriosity(claim, liveCuriosity) : 0;
    // Only skip claims that fight the live question (ordering already ranked the pool)
    if (answeredScore < 0 && sectionId !== "overview" && sectionId !== "summary") {
      continue;
    }

    let para = renderParagraph(thesis, i);
    if (!para) continue;
    if (topicLabel) para = polishEditorialText(para, topicLabel);

    const exitCuriosity = curiosityAfterThesis(
      thesis,
      sectionId,
      topicLabel || displayName,
      thesesUsed.length
    );
    para = wrapTeachingParagraph(para, {
      entryCuriosity: liveCuriosity,
      exitCuriosity,
      index: thesesUsed.length,
      seed: seed + i,
      topicLabel: topicLabel || displayName,
      sectionId,
      answeredScore,
    });
    liveCuriosity = exitCuriosity;

    const example = realWorldExampleFor(thesis);
    if (example && !para.includes(example.slice(0, 20))) {
      const withEx = `${para} ${example}`;
      const sentCount = withEx.split(/(?<=[.!?])\s+/).filter(Boolean).length;
      if (sentCount <= 4) para = withEx;
    }

    if (prevThesis) {
      para = addParagraphBridge(prevThesis, thesis, para, seed + i, sectionId, i);
      if (topicLabel) para = polishEditorialText(para, topicLabel);
    }

    if (!isEditoriallySound(para, topicLabel)) continue;
    if (paragraphs.some((p) => paragraphsTooSimilar(p, para))) continue;

    paragraphs.push(para);
    thesesUsed.push(thesis);
    prevThesis = thesis;
  }

  if (sectionId === "summary" && displayName) {
    const conclusion = composeSummaryConclusion(topicLabel, displayName);
    const closed = topicLabel ? polishEditorialText(conclusion, topicLabel) : conclusion;
    if (isEditoriallySound(closed, topicLabel) && !paragraphs.some((p) => paragraphsTooSimilar(p, closed))) {
      paragraphs.push(closed);
    }
  } else if (
    paragraphs.length > 0 &&
    sectionClose &&
    sectionId !== "summary" &&
    sectionId !== "overview"
  ) {
    // Skip overview meta closers; keep short teaching closes for body sections
    let closed = topicLabel ? polishEditorialText(sectionClose, topicLabel) : sectionClose;
    if (isEditoriallySound(closed, topicLabel)) {
      const lastBody = paragraphs[paragraphs.length - 1];
      if (!paragraphsTooSimilar(lastBody, closed)) {
        paragraphs.push(closed);
      }
    }
  }

  return { paragraphs, thesesUsed };
}

/** Apply narrative + teaching curiosity ordering across all sections. */
export function composeArticleArc(
  reasoning: Map<string, ParagraphThesis[]>,
  topicLabel = ""
): Map<string, ParagraphThesis[]> {
  const narrated = applyNarrativeOrdering(reasoning);
  const result = new Map<string, ParagraphThesis[]>();
  for (const [id, theses] of narrated) {
    result.set(id, orderThesesForTeaching(theses, id, topicLabel || id));
  }
  return result;
}

/** Register intro central ideas so later sections do not repeat them. */
export function markIntroIdeasUsed(
  notes: { definitions: string[]; properties: string[] },
  topicLabel: string,
  seen: Set<string>
): void {
  const slots: Array<{ fact: string; kind: "definition" | "property" }> = [
    { fact: notes.definitions[0], kind: "definition" },
    { fact: notes.definitions[1], kind: "definition" },
    { fact: notes.properties[0], kind: "property" },
  ].filter((s): s is { fact: string; kind: "definition" | "property" } => Boolean(s.fact));
  for (const { fact, kind } of slots) {
    const claim = understandFact(fact, topicLabel, kind);
    seen.add(normalizeIdeaKey(claim.assertion));
  }
}

/** Compose intro paragraphs with transitions and editorial filtering. */
export function composeIntroNarrative(
  rawParagraphs: string[],
  seed = 0,
  topicLabel = "",
  options?: { skipJourneyLead?: boolean }
): string {
  const kept: string[] = [];
  // Journey lead is meta filler — never inject (CEO editorial directive)
  void options?.skipJourneyLead;

  for (let i = 0; i < rawParagraphs.length; i++) {
    let para = topicLabel ? polishEditorialText(rawParagraphs[i], topicLabel) : rawParagraphs[i];
    if (!para) continue;
    if (kept.length > 0 && i > 0) {
      const prior: ParagraphThesis = {
        centralIdea: "intro",
        mainIdea: kept[kept.length - 1],
        question: "",
        claims: [],
        sectionKind: "definition",
      };
      const dummy: ParagraphThesis = {
        centralIdea: "intro next",
        mainIdea: para,
        question: "",
        claims: [],
        sectionKind: "definition",
      };
      if (shouldAddBridge(prior, dummy, "intro", i, seed + i)) {
        para = addParagraphBridge(prior, dummy, para, seed + i, "intro", i);
      }
      if (topicLabel) para = polishEditorialText(para, topicLabel);
    }
    if (!isEditoriallySound(para, topicLabel)) continue;
    // First paragraph must answer “What is X?” with a real definition form
    if (
      kept.length === 0 &&
      !/\b(is a|is an|are a|are an|refers to|defined as|means)\b/i.test(para)
    ) {
      continue;
    }
    if (kept.some((p) => paragraphsTooSimilar(p, para))) continue;
    kept.push(para);
  }
  return kept.join("\n\n");
}
