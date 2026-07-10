/**
 * Semantic knowledge ranking — score facts by reader value before composition (no LLM).
 *
 * Composition consumes highest-value knowledge, not highest-frequency extraction order.
 */

import type { BrainNotes } from "./catalogBrainUtils";
import { buildUnderstandKeywords } from "./catalogBrainUtils";
import { classifyFactType } from "@/services/knowledge/factExtractor";
import type { FactType } from "@/lib/types";
import type { FactKind } from "./languageSystem/types";

export interface RankedFact {
  fact: string;
  priority: number;
  factType: FactType;
  signals: string[];
}

const MIN_COMPOSE_PRIORITY = 30;

const NOISE_PATTERNS: Array<{ pattern: RegExp; penalty: number; label: string }> = [
  { pattern: /please help update|retrieved \d{4}|ssrn \d+|citation needed/i, penalty: 85, label: "editorial" },
  { pattern: /\[edit\]/i, penalty: 80, label: "wiki_edit" },
  { pattern: /brought to you by|friendly video course|patterns for ai interfaces/i, penalty: 90, label: "promo" },
  { pattern: /\b(user experience|ux and design|seamless integration|mental models?)\b/i, penalty: 82, label: "ux_noise" },
  { pattern: /what they need are|users don't need more tools/i, penalty: 80, label: "ux_opinion" },
  { pattern: /module \d|chapter \d|lesson \d|unit \d|course outline|syllabus|learning objective/i, penalty: 78, label: "course_navigation" },
  { pattern: /table of contents|click here|read more|learn more|sign up|subscribe/i, penalty: 75, label: "navigation" },
  { pattern: /you should have a basic work environment|getting started with the web|takeaway:/i, penalty: 72, label: "tutorial_instruction" },
  { pattern: /background leads into|the following properties explain/i, penalty: 70, label: "doc_wording" },
  { pattern: /this article (explains|looks|continues|shows)|the previous article|we also show/i, penalty: 68, label: "article_meta" },
  { pattern: /lists are everywhere in life|there are many other elements in html for defining/i, penalty: 55, label: "tangential" },
  { pattern: /\b(head of an?\s+html|html\s+<head>|<head>\s+of|the head of an?\s+html document)\b/i, penalty: 70, label: "structural_detail" },
  { pattern: /\b(main jobs? of|opening tag|closing tag|doctype declaration)\b/i, penalty: 55, label: "structural_detail" },
  { pattern: /\bnote:\s*if you are working on a computer\b/i, penalty: 75, label: "tutorial_aside" },
  { pattern: /^[-*•]\s+/i, penalty: 40, label: "list_fragment" },
];

const VALUE_PATTERNS: Array<{ pattern: RegExp; boost: number; label: string }> = [
  { pattern: /\b(reusable|recurring problem|fundamental|core concept|essential idea)\b/i, boost: 28, label: "core_concept" },
  { pattern: /\b(markup language|hypertext markup|style sheet language|cascading style sheets)\b/i, boost: 30, label: "core_definition" },
  { pattern: /\b(is|are|refers to|defined as|means|consists of)\b/i, boost: 22, label: "definition_form" },
  { pattern: /\b(benefit|advantage|maintainability|flexibility|reuse|scalability)\b/i, boost: 20, label: "benefits" },
  { pattern: /\b(creational|structural|behavioral|factory|singleton|observer|strategy|decorator|adapter|facade)\b/i, boost: 18, label: "key_examples" },
  { pattern: /\b(trade.?off|limitation|drawback|caveat|downside)\b/i, boost: 12, label: "tradeoffs" },
  { pattern: /\b(how to|step|process|method|workflow|implement|apply|practice)\b/i, boost: 15, label: "practical" },
  { pattern: /\b(application|used in|used for|everyday|real.world|example)\b/i, boost: 14, label: "applications" },
  { pattern: /\b(avoid|mistake|pitfall|common error|do not|never)\b/i, boost: 12, label: "mistakes" },
  { pattern: /\b(compare|versus|vs\.|unlike|contrast)\b/i, boost: 10, label: "comparison" },
];

const HISTORY_PATTERNS: Array<{ pattern: RegExp; penalty: number }> = [
  { pattern: /\b(invented|originated|first introduced|pioneered|born in|early history|timeline)\b/i, penalty: 55 },
  { pattern: /\b(in \d{4}|since \d{4}|during the \d{4}s)\b/i, penalty: 45 },
  { pattern: /\b(qualidex|bogle|malkiel|samuelson)\b/i, penalty: 50 },
];

function factTypeToKind(type: FactType): FactKind {
  switch (type) {
    case "definition":
      return "definition";
    case "procedural":
      return "procedure";
    case "warning":
      return "warning";
    case "comparison":
      return "comparison";
    case "measurement":
      return "measurement";
    default:
      return "property";
  }
}

function topicKeywordHits(fact: string, keywords: string[]): number {
  const lower = fact.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (kw.length > 2 && lower.includes(kw)) hits++;
  }
  return hits;
}

/** Score one fact for composition priority (0–100). */
export function scoreFactPriority(
  fact: string,
  topicTitle: string,
  options?: { slug?: string; primaryKeyword?: string }
): RankedFact {
  const keywords = buildUnderstandKeywords(topicTitle, options);
  const factType = classifyFactType(fact);
  const signals: string[] = [];
  let score = 45;

  switch (factType) {
    case "definition":
      score = 78;
      signals.push("type:definition");
      break;
    case "procedural":
      score = 58;
      signals.push("type:procedural");
      break;
    case "warning":
      score = 52;
      signals.push("type:warning");
      break;
    case "comparison":
      score = 50;
      signals.push("type:comparison");
      break;
    case "measurement":
      score = 38;
      signals.push("type:measurement");
      break;
    default:
      score = 48;
      signals.push("type:property");
  }

  const hits = topicKeywordHits(fact, keywords);
  if (hits >= 2) {
    score += 22;
    signals.push("topic:strong_match");
  } else if (hits === 1) {
    score += 14;
    signals.push("topic:match");
  } else if (keywords.length > 0) {
    score -= 22;
    signals.push("topic:weak");
  }

  const factStart = fact.trim().toLowerCase().slice(0, 48);
  for (const kw of keywords) {
    if (kw.length > 4 && factStart.startsWith(kw)) {
      score += 24;
      signals.push("topic:opens_fact");
      break;
    }
  }

  for (const { pattern, boost, label } of VALUE_PATTERNS) {
    if (pattern.test(fact)) {
      score += boost;
      signals.push(`value:${label}`);
    }
  }

  if (factType === "definition" && hits >= 1 && /\b(is|are|refers to|defined as|means)\b/i.test(fact)) {
    score += 22;
    signals.push("reader:first_question");
  }

  if (
    factType === "definition" &&
    hits >= 1 &&
    /\b(typical solutions|recurring problem|reusable|commonly occurring)\b/i.test(fact)
  ) {
    score += 12;
    signals.push("reader:core_definition");
  }

  if (/\b(evergreen|fundamental|generally|typically|in general|at its core)\b/i.test(fact)) {
    score += 8;
    signals.push("evergreen");
  }

  if (/\b(beginner|introduction|overview|basics|fundamentals|getting started)\b/i.test(fact)) {
    score += 6;
    signals.push("beginner_value");
  }

  for (const { pattern, penalty, label } of NOISE_PATTERNS) {
    if (pattern.test(fact)) {
      score -= penalty;
      signals.push(`noise:${label}`);
    }
  }

  for (const { pattern, penalty } of HISTORY_PATTERNS) {
    if (pattern.test(fact)) {
      score -= penalty;
      signals.push("noise:historical");
    }
  }

  if (/\b(advanced|edge case|implementation detail|internals|under the hood)\b/i.test(fact)) {
    score -= 20;
    signals.push("noise:advanced");
  }

  if (fact.length > 280) {
    score -= 10;
    signals.push("noise:verbose");
  }

  if (fact.length < 40) {
    score -= 15;
    signals.push("noise:fragment");
  }

  if (/\b(main advantage|key benefit|primary benefit|widely available|tracking many)\b/i.test(fact)) {
    if (!/\b(is a|is an|are a|refers to|defined as)\b/i.test(fact.slice(0, 80))) {
      score -= 14;
      signals.push("noise:benefit_not_definition");
    }
  }

  if (/^\s*(it|they|these|this|an index fund|a health insurance)\b/i.test(fact)) {
    score -= 6;
    signals.push("noise:pronoun_lead");
  }

  const priority = Math.max(0, Math.min(100, Math.round(score)));
  return { fact, priority, factType, signals };
}

function definitionSortBoost(fact: string, keywords: string[] = []): number {
  let boost = 0;
  if (/\b(is a|is an|are a|refers to|defined as|means)\b/i.test(fact)) boost += 12;
  if (/\b(main advantage|widely available|tracking many|difficult to outperform)\b/i.test(fact)) {
    boost -= 8;
  }
  if (/^\s*(it|they|these|this)\b/i.test(fact)) boost -= 4;
  const start = fact.trim().toLowerCase().slice(0, 48);
  for (const kw of keywords) {
    if (kw.length > 4 && start.startsWith(kw)) boost += 18;
  }
  return boost;
}

function sortByPriority(
  facts: string[],
  ranked: Map<string, RankedFact>,
  keywords: string[] = []
): string[] {
  return [...facts].sort((a, b) => {
    const pa = ranked.get(a)?.priority ?? 0;
    const pb = ranked.get(b)?.priority ?? 0;
    if (pb !== pa) return pb - pa;
    return definitionSortBoost(b, keywords) - definitionSortBoost(a, keywords);
  });
}

/** Rank and filter BrainNotes — highest-value facts first, noise removed. */
export function rankBrainNotes(
  notes: BrainNotes,
  topicTitle: string,
  options?: { slug?: string; primaryKeyword?: string }
): BrainNotes {
  const allUnique = [
    ...notes.definitions,
    ...notes.properties,
    ...notes.procedures,
    ...notes.warnings,
    ...notes.comparisons,
    ...notes.measurements,
  ];
  const keywords = buildUnderstandKeywords(topicTitle, options);
  const seen = new Set<string>();
  const rankedMap = new Map<string, RankedFact>();

  for (const fact of allUnique) {
    const key = fact.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    rankedMap.set(fact, scoreFactPriority(fact, topicTitle, options));
  }

  const keep = (facts: string[]) =>
    sortByPriority(facts, rankedMap, keywords).filter(
      (f) => (rankedMap.get(f)?.priority ?? 0) >= MIN_COMPOSE_PRIORITY
    );

  const definitions = keep(notes.definitions);
  const properties = keep(notes.properties);
  const procedures = keep(notes.procedures);
  const warnings = keep(notes.warnings);
  const comparisons = keep(notes.comparisons);
  const measurements = keep(notes.measurements);
  const allFacts = sortByPriority(
    [...new Set([...definitions, ...properties, ...procedures, ...warnings, ...comparisons, ...measurements, ...notes.allFacts])],
    rankedMap,
    keywords
  ).filter((f) => (rankedMap.get(f)?.priority ?? 0) >= MIN_COMPOSE_PRIORITY);

  return {
    definitions,
    properties,
    procedures,
    warnings,
    comparisons,
    measurements,
    allFacts,
  };
}

export function rankFactsForDebug(
  notes: BrainNotes,
  topicTitle: string,
  options?: { slug?: string; primaryKeyword?: string },
  limit = 15
): RankedFact[] {
  const all = collectUniqueFacts(notes);
  const seen = new Set<string>();
  const ranked: RankedFact[] = [];
  for (const fact of all) {
    const key = fact.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ranked.push(scoreFactPriority(fact, topicTitle, options));
  }
  return ranked.sort((a, b) => b.priority - a.priority).slice(0, limit);
}

function collectUniqueFacts(notes: BrainNotes): string[] {
  return [
    ...notes.definitions,
    ...notes.properties,
    ...notes.procedures,
    ...notes.warnings,
    ...notes.comparisons,
    ...notes.measurements,
  ];
}

export interface SemanticRankingAudit {
  extractedCount: number;
  keptCount: number;
  discardedCount: number;
  topSelected: RankedFact[];
  topDiscarded: RankedFact[];
}

/** Audit semantic ranking: selected vs discarded facts for CEO reporting. */
export function auditSemanticRanking(
  rawNotes: BrainNotes,
  topicTitle: string,
  options?: { slug?: string; primaryKeyword?: string },
  limit = 10
): SemanticRankingAudit {
  const all = collectUniqueFacts(rawNotes);
  const seen = new Set<string>();
  const ranked: RankedFact[] = [];
  for (const fact of all) {
    const key = fact.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    ranked.push(scoreFactPriority(fact, topicTitle, options));
  }
  ranked.sort((a, b) => b.priority - a.priority);
  const kept = ranked.filter((r) => r.priority >= MIN_COMPOSE_PRIORITY);
  const discarded = ranked.filter((r) => r.priority < MIN_COMPOSE_PRIORITY);
  return {
    extractedCount: ranked.length,
    keptCount: kept.length,
    discardedCount: discarded.length,
    topSelected: kept.slice(0, limit),
    topDiscarded: discarded.slice(0, limit),
  };
}

export { factTypeToKind, MIN_COMPOSE_PRIORITY };
