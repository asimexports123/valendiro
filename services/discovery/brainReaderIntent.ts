/**
 * Reader intent — infer the reader's first question before composition (no LLM).
 */

import type { BrainNotes } from "./catalogBrainUtils";
import { buildUnderstandKeywords } from "./catalogBrainUtils";
import { classifyFactType } from "@/services/knowledge/factExtractor";
import { rankBrainNotes, scoreFactPriority } from "./brainSemanticRank";

export interface ReaderIntent {
  firstQuestion: string;
  topicNoun: string;
  displayLabel: string;
}

/** Generic noun for “What is X?” — strip guide suffixes; singularize common plurals. */
function singularizeTopicNoun(displayName: string): string {
  let clean = displayName.replace(/\?$/u, "").trim();
  clean = clean.replace(/^what\s+(is|are)\s+/i, "").trim();
  clean = clean
    .replace(/\s+(fundamentals|basics|explained|guide|overview|introduction)$/i, "")
    .trim();
  // Common educational plurals → singular subject (“Index Funds” → “Index Fund”)
  const plural = clean.match(/^(.+?)\s+(patterns|funds|systems|methods|models|frameworks)$/i);
  if (plural) {
    const head = plural[1];
    const unit = plural[2].replace(/s$/i, "");
    return `${head} ${unit.charAt(0).toUpperCase()}${unit.slice(1).toLowerCase()}`;
  }
  return clean;
}

function articleFor(noun: string): string {
  return /^[aeiou]/i.test(noun.trim()) ? "an" : "a";
}

/** Infer the first question a reader asks when landing on this topic. */
export function inferReaderFirstQuestion(displayName: string, _topicLabel = ""): ReaderIntent {
  const displayLabel = displayName.replace(/\?$/u, "").trim();
  const topicNoun = singularizeTopicNoun(displayLabel);

  let firstQuestion: string;
  if (/^what is\s+/i.test(displayLabel)) {
    firstQuestion = displayLabel.endsWith("?") ? displayLabel : `${displayLabel}?`;
  } else if (/^[A-Z]{2,}$/.test(topicNoun) || topicNoun.split(/\s+/).length >= 2) {
    firstQuestion = `What is ${topicNoun}?`;
  } else {
    firstQuestion = `What is ${articleFor(topicNoun)} ${topicNoun}?`;
  }

  return { firstQuestion, topicNoun, displayLabel };
}

const SECONDARY_DEFINITION_PATTERNS = [
  /\baccording to\b/i,
  /\bhead of an?\b/i,
  /\bprevious article\b/i,
  /\bas with other types\b/i,
  /\bassociation of america\b/i,
  /\bnote:\s*if you are\b/i,
  /\bwe also show\b/i,
  /\bthe previous article\b/i,
];

/** Structural / secondary facts that do not answer "What is X?" for fundamentals topics. */
const STRUCTURAL_NOT_DEFINITION_PATTERNS = [
  /\b<head>\b/i,
  /\b<\/?head\b/i,
  /\bhtml head\b/i,
  /\bmain jobs?\b/i,
  /\blists are everywhere\b/i,
  /\bgetting started\b/i,
  /\bthis article\b/i,
  /\bprevious (article|section)\b/i,
  /\bmeta (tag|element|data)\b/i,
  /\bDOCTYPE\b/i,
  /\bopening tag\b/i,
  /\bclosing tag\b/i,
  /\bthere are many other elements\b/i,
  /\bboth are parts of our\b/i,
  /\bcomplete beginners module\b/i,
  /\bemphasis and importance article\b/i,
  /\bwe didn'?t get to\b/i,
  /\btypical html page is structured\b/i,
];

const CORE_DEFINITION_BOOST =
  /\b(markup language|hypertext markup|stylesheet language|cascading style|insurance coverage|index fund|design pattern|artificial intelligence|compound interest)\b/i;

/** Topic noun should be the grammatical subject of a first-answer definition. */
function topicIsSubject(fact: string, noun: string): boolean {
  const n = noun.trim();
  if (n.length < 2) return false;
  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const start = fact.trim().slice(0, 100);
  if (
    new RegExp(`^\\s*${escaped}\\b`, "i").test(start) ||
    new RegExp(`^\\s*(an?|the)\\s+${escaped}\\b`, "i").test(start) ||
    new RegExp(`^\\s*${escaped}\\s+(is|are|refers to|means|helps|enables|allows)\\b`, "i").test(start)
  ) {
    return true;
  }
  // Acronym expansions: "Hypertext Markup Language is…" answers "What is HTML?"
  if (/^[A-Z]{2,5}$/.test(n) && /^(hypertext markup language|cascading style sheets)\b/i.test(start)) {
    return true;
  }
  return false;
}

/** Score how directly a fact answers the reader's first question. */
export function scoreAsFirstAnswer(
  fact: string,
  intent: ReaderIntent,
  keywords: string[]
): number {
  // Existential "There are…" / tutorial asides are not definitions of the topic
  if (/^\s*(there are|there is|we also|both are|note:|one of)\b/i.test(fact)) return -100;
  if (/\bcan be combined\b/i.test(fact)) return -80;
  if (!/\b(is|are|refers to|defined as|means|helps|enables|allows)\b/i.test(fact)) return -100;

  let score = 0;
  const start = fact.trim().slice(0, 90).toLowerCase();
  const noun = intent.topicNoun.toLowerCase();

  if (SECONDARY_DEFINITION_PATTERNS.some((re) => re.test(fact))) score -= 55;
  if (STRUCTURAL_NOT_DEFINITION_PATTERNS.some((re) => re.test(fact))) score -= 70;
  if (/^\s*(it|they|these|as with)\b/i.test(fact)) score -= 30;

  const subjectOk = topicIsSubject(fact, intent.topicNoun);
  if (subjectOk) score += 60;
  else score -= 40; // mentions topic mid-sentence ≠ answers "What is X?"

  for (const kw of keywords) {
    if (kw.length > 3 && start.includes(kw)) score += 20;
  }
  if (noun.length > 3 && start.includes(noun)) score += 25;
  // Prefer "X is a/an …" at the start over "The head of an HTML document is…"
  if (new RegExp(`^\\s*${noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(is|are|refers to)\\b`, "i").test(fact)) {
    score += 50;
  }
  if (/\b(is a|is an|are a|refers to|defined as|means)\b/i.test(fact.slice(0, 110))) {
    score += 40;
  }
  if (CORE_DEFINITION_BOOST.test(fact)) {
    score += 35;
  }
  if (/\bis not\b/i.test(fact.slice(0, 80)) && !/\bis not only\b/i.test(fact)) score -= 40;
  if (/\b(abbreviated|abbreviation|acronym|short for|stands for)\b/i.test(fact)) score -= 55;
  if (/\b(main jobs?|head of|lists are everywhere)\b/i.test(fact)) score -= 35;

  return score;
}

/** Select the fact that best answers the reader's first question — never a secondary fact. */
export function selectPrimaryDefinitionFact(
  notes: BrainNotes,
  displayName: string,
  topicTitle: string,
  options?: { slug?: string; primaryKeyword?: string }
): string | undefined {
  const intent = inferReaderFirstQuestion(displayName, topicTitle);
  const ranked = rankBrainNotes(notes, topicTitle, options);
  const keywords = buildUnderstandKeywords(topicTitle, options);
  const pool = [
    ...new Set([
      ...ranked.definitions,
      ...ranked.allFacts.filter((f) => classifyFactType(f) === "definition"),
    ]),
  ];

  let best: { fact: string; score: number } | undefined;
  for (const fact of pool) {
    const answerScore = scoreAsFirstAnswer(fact, intent, keywords);
    if (answerScore < 40) continue; // must clearly answer "What is X?"
    if (!topicIsSubject(fact, intent.topicNoun) && !CORE_DEFINITION_BOOST.test(fact)) continue;
    const priority = scoreFactPriority(fact, topicTitle, options).priority;
    const total = answerScore + priority * 0.5;
    if (!best || total > best.score) {
      best = { fact, score: total };
    }
  }
  return best?.fact;
}

function isStructuralNotFirstAnswer(fact: string): boolean {
  return (
    SECONDARY_DEFINITION_PATTERNS.some((re) => re.test(fact)) ||
    STRUCTURAL_NOT_DEFINITION_PATTERNS.some((re) => re.test(fact))
  );
}

/** Top facts for intro — primary definition answers the reader's first question. */
export function topIntroFacts(
  notes: BrainNotes,
  topicTitle: string,
  options?: { slug?: string; primaryKeyword?: string; displayName?: string }
): { definition: string | undefined; secondary: string | undefined; application: string | undefined } {
  const ranked = rankBrainNotes(notes, topicTitle, options);
  const displayName = options?.displayName ?? topicTitle;
  const intent = inferReaderFirstQuestion(displayName, topicTitle);
  const keywords = buildUnderstandKeywords(topicTitle, options);

  let definition = selectPrimaryDefinitionFact(notes, displayName, topicTitle, options);
  if (!definition) {
    // Never fall back to a structural/secondary fact for the first-answer slot
    definition = ranked.definitions.find(
      (f) => !isStructuralNotFirstAnswer(f) && scoreAsFirstAnswer(f, intent, keywords) >= 0
    );
  }

  const used = new Set([definition?.toLowerCase()].filter(Boolean) as string[]);
  const secondary =
    ranked.definitions.find(
      (f) => !used.has(f.toLowerCase()) && !isStructuralNotFirstAnswer(f)
    ) ??
    ranked.properties.find((f) => /creational|structural|behavioral|category|type|family/i.test(f)) ??
    ranked.properties.find((f) => !used.has(f.toLowerCase())) ??
    ranked.properties[0];

  if (secondary) used.add(secondary.toLowerCase());
  const application =
    ranked.properties.find((f) => /application|used|benefit|example|reusable/i.test(f) && !used.has(f.toLowerCase())) ??
    ranked.procedures.find((f) => !used.has(f.toLowerCase())) ??
    ranked.properties.find((f) => !used.has(f.toLowerCase())) ??
    ranked.properties[0];

  return { definition, secondary, application };
}

/** Skip generic journey lead when a definition answers the reader's first question. */
export function shouldSkipIntroJourneyLead(
  notes: BrainNotes,
  topicTitle: string,
  options?: { slug?: string; primaryKeyword?: string; displayName?: string }
): boolean {
  const displayName = options?.displayName ?? topicTitle;
  const primary = selectPrimaryDefinitionFact(notes, displayName, topicTitle, options);
  if (primary && !isStructuralNotFirstAnswer(primary)) return true;

  const top = topIntroFacts(notes, topicTitle, options);
  // No clean first-answer in fuel — still skip buzzword soup; explainIntro has a plain fallback
  if (!top.definition || isStructuralNotFirstAnswer(top.definition)) return true;

  const scored = scoreFactPriority(top.definition, topicTitle, options);
  return (
    scored.priority >= 70 &&
    scored.factType === "definition" &&
    /\b(is|are|refers to|defined as|means)\b/i.test(top.definition)
  );
}
