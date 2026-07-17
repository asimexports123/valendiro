/**
 * Shared brain utilities — understand fuel and transform claims (no LLM).
 */

import {
  splitIntoSentences,
  classifyFactType,
} from "@/services/knowledge/factExtractor";
import type { FactType } from "@/lib/types";

export interface BrainNotes {
  definitions: string[];
  properties: string[];
  procedures: string[];
  warnings: string[];
  comparisons: string[];
  measurements: string[];
  allFacts: string[];
}

const STOP_FRAGMENTS = [
  /click here/i,
  /subscribe/i,
  /cookie/i,
  /advertisement/i,
  /sign up/i,
  /all rights reserved/i,
  /read more/i,
  /learn more/i,
];

export function categoryKey(slug: string | null): string {
  if (!slug) return "general";
  const s = slug.toLowerCase();
  if (/financ|invest|money|stock|market|bank|tax|insur/.test(s)) return "finance";
  if (/tech|software|program|develop|code|data|cloud|devops|web|api/.test(s)) return "technology";
  if (/business|manage|market|startup|sales|leadership/.test(s)) return "business";
  if (/health|medical|wellness|fitness|nutrition/.test(s)) return "health";
  if (/learn|education|study|course|school/.test(s)) return "education";
  if (/travel|trip|hotel|flight|tour/.test(s)) return "travel";
  if (/home|garden|diy|repair/.test(s)) return "home";
  return "general";
}

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function lcFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function cleanSentence(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/["']/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\([^)]{0,80}\)/g, "")
    .trim();
}

function isUsableSentence(s: string, minLen = 28): boolean {
  if (s.length < minLen || s.length > 520) return false;
  if (STOP_FRAGMENTS.some((p) => p.test(s))) return false;
  if (/^https?:\/\//i.test(s)) return false;
  return true;
}

function dedupeSentences(sentences: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sentences) {
    const key = normalizeKey(s);
    if (key.length < 24 || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export function buildUnderstandKeywords(
  topicTitle: string,
  options?: { slug?: string; primaryKeyword?: string }
): string[] {
  const keys = new Set<string>();
  if (options?.primaryKeyword) {
    for (const w of options.primaryKeyword.toLowerCase().split(/\W+/)) {
      if (w.length > 2) keys.add(w);
    }
  }
  if (options?.slug) {
    for (const w of options.slug.split("-")) {
      if (w.length > 2) keys.add(w);
    }
  }
  for (const w of topicTitle.toLowerCase().split(/\W+/)) {
    if (w.length > 3) keys.add(w);
  }
  return [...keys];
}

function topicRelevant(sentence: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const lower = sentence.toLowerCase();
  return keywords.some((w) => lower.includes(w));
}

/** Prefer topic-head copular sentences when competing for limited definition slots. */
function scoreDefinitionCandidate(fact: string, keywords: string[]): number {
  const start = fact.trim().slice(0, 100).toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (kw.length > 3 && start.includes(kw)) score += 18;
  }
  if (/\b(is a|is an|are a|is exercise|refers to|defined as|means)\b/i.test(fact.slice(0, 110))) {
    score += 28;
  }
  if (/\b(also known as|also called)\b/i.test(fact)) score += 22;
  if (/\b(primarily|typically|usually|often|mainly|widely available|tracking many)\b/i.test(start)) {
    score -= 32;
  }
  if (/^(a gym|an example|pictured|shown above|this image)\b/i.test(start)) score -= 70;
  return score;
}

export function isTopicHeadDefinition(sentence: string, keywords: string[]): boolean {
  if (!/\b(is a|is an|are a|is exercise|refers to|defined as|means)\b/i.test(sentence)) return false;
  const start = sentence.toLowerCase().slice(0, 100);
  return keywords.some((kw) => kw.length > 3 && start.includes(kw));
}

function collectDefinitions(
  raw: { text: string; type: FactType }[],
  unique: string[],
  keywords: string[],
  limit: number
): string[] {
  const definitionLike = new Set<string>();
  for (const r of raw) {
    if (!unique.includes(r.text)) continue;
    if (r.type === "definition") definitionLike.add(r.text);
    else if (
      r.type === "property" &&
      isTopicHeadDefinition(r.text, keywords) &&
      /\b(is a|is an|are a|is exercise|refers to|defined as|means)\b/i.test(r.text)
    ) {
      definitionLike.add(r.text);
    }
  }
  return [...definitionLike]
    .sort((a, b) => scoreDefinitionCandidate(b, keywords) - scoreDefinitionCandidate(a, keywords))
    .slice(0, limit);
}

export function brainUnderstand(
  fuelTexts: string[],
  topicTitle: string,
  options?: { slug?: string; primaryKeyword?: string; relaxed?: boolean }
): BrainNotes {
  const keywords = buildUnderstandKeywords(topicTitle, options);
  const relaxed = options?.relaxed ?? false;
  const minLen = relaxed ? 20 : 28;
  const raw: { text: string; type: FactType }[] = [];

  for (const block of fuelTexts) {
    const paragraphs = block.split(/\n{2,}/).filter((p) => p.trim().length > 40);
    const segments =
      paragraphs.length > 1
        ? paragraphs.flatMap((p) => splitIntoSentences(p))
        : splitIntoSentences(block);

    for (const sentence of segments) {
      const cleaned = cleanSentence(sentence);
      if (!isUsableSentence(cleaned, minLen)) continue;
      if (
        raw.length > 0 &&
        /^(rather|instead|however|but|otherwise|moreover|furthermore|also|yet|indeed|in fact)\b/i.test(cleaned)
      ) {
        continue;
      }
      if (!relaxed && !topicRelevant(cleaned, keywords) && raw.length > 20 && !isTopicHeadDefinition(cleaned, keywords)) continue;
      raw.push({ text: cleaned, type: classifyFactType(cleaned) });
    }
  }

  const minKeyLen = relaxed ? 16 : 24;
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const r of raw) {
    const key = normalizeKey(r.text);
    if (key.length < minKeyLen || seen.has(key)) continue;
    seen.add(key);
    unique.push(r.text);
  }
  const byType = (type: FactType) =>
    raw.filter((r) => unique.includes(r.text) && r.type === type).map((r) => r.text);

  const limits = relaxed
    ? { def: 14, prop: 20, proc: 16, warn: 12, comp: 12, meas: 12, all: 50 }
    : { def: 8, prop: 12, proc: 10, warn: 6, comp: 6, meas: 6, all: 30 };

  return {
    definitions: collectDefinitions(raw, unique, keywords, limits.def),
    properties: byType("property").slice(0, limits.prop),
    procedures: byType("procedural").slice(0, limits.proc),
    warnings: byType("warning").slice(0, limits.warn),
    comparisons: byType("comparison").slice(0, limits.comp),
    measurements: byType("measurement").slice(0, limits.meas),
    allFacts: unique.slice(0, limits.all),
  };
}

export function paraphraseForOriginality(text: string, seed: number): string {
  const swaps: Array<[RegExp, string[]]> = [
    [/capability of computational systems/gi, ["use of computer systems", "capacity of software-based systems", "ability of computational systems", "power of automated systems"]],
    [/typically associated with/gi, ["commonly linked to", "usually connected to", "often tied to", "frequently related to"]],
    [/perform tasks/gi, ["handle work", "carry out tasks", "execute tasks", "complete work"]],
    [/such as/gi, ["including", "especially", "notably", "like"]],
    [/human intelligence/gi, ["human-level thinking", "human cognitive ability", "human reasoning", "human judgment"]],
    [/problem-solving/gi, ["solving problems", "problem solving", "analytical work", "working through problems"]],
    [/\bdecision-making\b(?!\s+agent)/gi, ["making decisions", "decision making", "choosing actions", "action selection"]],
    [/widely available/gi, ["broadly accessible", "widely accessible", "commonly available", "easily reached"]],
    [/broken down into/gi, ["divided into", "split into", "separated into", "organized into"]],
    [/insufficient for solving/gi, ["poor at solving", "struggle with solving", "ineffective for solving", "weak at solving"]],
    [/combinatorial explosion/gi, ["combinatorial blow-up", "exponential search growth", "combinatorial growth", "search-space explosion"]],
    [/content-based indexing/gi, ["semantic indexing", "content indexing", "indexed content retrieval", "indexed search"]],
    [/knowledge representation/gi, ["representing knowledge", "encoded knowledge", "structured knowledge", "formal knowledge encoding"]],
    [/large language model/gi, ["LLM", "large-scale language model", "language model", "text model"]],
    [/fast, intuitive judgments/gi, ["quick intuitive judgment", "rapid intuitive reasoning", "fast intuitive reasoning", "intuitive snap judgments"]],
    [/advanced web search engines/gi, ["modern search engines", "sophisticated search tools", "next-generation search", "powerful search platforms"]],
    [/autonomous vehicles/gi, ["self-driving cars", "driverless vehicles", "autonomous transport", "automated vehicles"]],
    [/generative AI/gi, ["generative models", "generative systems", "creative AI tools", "generative machine learning"]],
    [/artificial intelligence/gi, ["AI", "machine intelligence", "computational intelligence", "automated reasoning systems"]],
    [/researchers/gi, ["scientists", "specialists", "experts", "investigators"]],
    [/involves/gi, ["encompasses", "covers", "includes", "spans"]],
    [/among the best-known applications/gi, ["notable applications", "prominent uses", "well-known applications", "leading applications"]],
  ];

  let out = text;
  for (let i = 0; i < swaps.length; i++) {
    const [re, alts] = swaps[(seed + i) % swaps.length];
    out = out.replace(re, alts[(seed + i * 3) % alts.length]);
  }
  return out;
}

function stripCitations(s: string): string {
  return s.replace(/\[\d+\]/g, "").replace(/\[[a-z]\]/gi, "").replace(/\s+/g, " ").trim();
}

function stripSectionLead(s: string): string {
  return s
    .replace(
      /^(goals|planning and decision-making|knowledge representation and knowledge engineering)\s+/i,
      ""
    )
    .trim();
}

function shortenTail(tail: string, maxWords = 16): string {
  let t = tail.replace(/\.$/, "");
  const suchAs = t.match(/^(.+?),\s*such as\s+(.+)$/i);
  if (suchAs) {
    const items = suchAs[2].split(/,\s*(?:and\s+)?/);
    if (items.length > 2) {
      t = `${suchAs[1]}, including ${items.slice(0, 2).join(" and ")}`;
    }
  }
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > maxWords) {
    t = words.slice(0, maxWords).join(" ");
    const cut = t.lastIndexOf(",");
    if (cut > t.length * 0.55) t = t.slice(0, cut);
  }
  return t.trim();
}

function firstSentence(s: string): string {
  const parts = s.split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts[0] ?? s;
}

/** Restructure a source claim into one readable sentence — never keyword lists. */
function transformClaimCore(sentence: string, topicTitle: string): string {
  let s = firstSentence(stripSectionLead(stripCitations(cleanSentence(sentence))));

  const includeApps = s.match(/^(.+?) applications of .+? include\s+(.+)$/i);
  if (includeApps) {
    return `Among the best-known applications of ${topicTitle} are ${lcFirst(includeApps[2].replace(/\.$/, ""))}.`;
  }

  if (/^since the \d{4}s?,/i.test(s)) {
    return `${lcFirst(s.charAt(0).toUpperCase() + s.slice(1).replace(/\.$/, ""))} — a shift that reshaped how people use ${topicTitle}.`;
  }

  if (/^many of these algorithms/i.test(s)) {
    const tail = s.replace(/^many of these algorithms\s+/i, "");
    return `Many AI algorithms ${lcFirst(tail.replace(/\.$/, ""))}.`;
  }

  if (/^humans solve most of their problems using/i.test(s)) {
    const m = s.match(/^humans solve most of their problems using (.+)$/i);
    if (m) {
      return `Human problem-solving often relies on ${lcFirst(m[1].replace(/\.$/, ""))} for everyday problems, which researchers compare against machine reasoning.`;
    }
  }

  if (/^these consist of/i.test(s)) {
    let tail = s.replace(/^these consist of\s+/i, "").replace(/\.$/, "");
    tail = tail.replace(/\s+that researchers expect an intelligent system to display$/i, "");
    return `Researchers expect intelligent systems to display ${lcFirst(tail)}.`;
  }

  if (/^the traits described below/i.test(s)) {
    const tail = s.replace(/^the traits described below have received\s+/i, "").replace(/\.$/, "");
    return `The most studied traits in ${topicTitle} research have received ${lcFirst(tail)}.`;
  }

  if (/^in addition to/i.test(s)) {
    return `Beyond core capability, ${lcFirst(s.replace(/\.$/, ""))}.`;
  }

  if (/^even humans rarely/i.test(s)) {
    return `${lcFirst(s.replace(/\.$/, ""))} when tackling complex problems in ${topicTitle}.`;
  }

  if (/^an agent is/i.test(s)) {
    const tail = s.replace(/^an agent is\s+/i, "").replace(/\.$/, "");
    return `In AI, an agent is ${lcFirst(tail)}.`;
  }

  if (/^reasoning models/i.test(s)) {
    return `${lcFirst(s.charAt(0).toUpperCase() + s.slice(1).replace(/\.$/, ""))}.`;
  }

  if (/^a rational agent/i.test(s)) {
    return `${s.charAt(0).toUpperCase()}${s.slice(1).replace(/\.$/, "")} — a standard model for decision-making in ${topicTitle}.`;
  }

  const usedIn = s.match(/^(.+?)\s+(are|is)\s+used in\s+(.+)$/i);
  if (usedIn) {
    const uses = usedIn[3].replace(/\.$/, "").replace(/,\s*and other areas\.?$/i, "");
    return `${usedIn[1]} ${usedIn[2]} used in ${lcFirst(uses)}, which shows how ${topicTitle} connects to real-world tasks.`;
  }

  const allowPrograms = s.match(/^(.+?)\s+allow\s+(.+?)\s+to\s+(.+)$/i);
  if (allowPrograms) {
    return `${allowPrograms[1]} allow ${allowPrograms[2]} to ${lcFirst(allowPrograms[3].replace(/\.$/, ""))}.`;
  }

  const def = s.match(/^(.+?)\s+(is|are|means|refers to|defined as)\s+(.+)$/i);
  if (def) {
    const subject = def[1].trim();
    const tail = def[3].replace(/\.$/, "");
    const topicLower = topicTitle.toLowerCase();
    const subjectLower = subject.toLowerCase();
    if (subjectLower === topicLower || subjectLower.includes("artificial intelligence")) {
      return `${topicTitle} ${def[2].toLowerCase() === "are" ? "are" : "is"} ${lcFirst(shortenTail(tail))}.`;
    }
    return `${subject} ${def[2]} ${lcFirst(shortenTail(tail))} — a detail that matters for ${topicTitle}.`;
  }

  const brokenDown = s.match(/^the general problem of (.+?) has been broken down into (.+)$/i);
  if (brokenDown) {
    return `The general problem of ${brokenDown[1]} is often broken down into ${lcFirst(brokenDown[2].replace(/\.$/, ""))}.`;
  }

  if (/^(never|don't|do not|avoid|warning|caution)/i.test(s)) {
    return `A common mistake with ${topicTitle} is ${lcFirst(s.replace(/^(never|don't|do not|avoid|warning:?|caution:?)\s*/i, ""))}`;
  }

  if (/^(to |how to|first |step \d)/i.test(s)) {
    return `A reliable approach for ${topicTitle} is to ${lcFirst(s.replace(/^(to |how to)\s*/i, ""))}`;
  }

  if (/compared to|versus|vs\.|unlike|whereas/i.test(s)) {
    return `When comparing options around ${topicTitle}, ${lcFirst(s)}`;
  }

  if (/^\d[\d,.]*\s*(%|percent|million|billion|thousand)/i.test(s)) {
    return `A useful benchmark for ${topicTitle}: ${lcFirst(s)}`;
  }

  if (/^(the |a |an |many |most |some |several |researchers |formal |reasoning )/i.test(s)) {
    const body = s.replace(/\.$/, "");
    return `${body.charAt(0).toUpperCase()}${body.slice(1)} — relevant context for ${topicTitle}.`;
  }

  return `${topicTitle} involves ${lcFirst(s.replace(/\.$/, ""))}.`;
}

export function transformClaim(sentence: string, topicTitle: string, seed = 0): string {
  let result = transformClaimCore(sentence, topicTitle);
  const rounds = 3 + (seed % 10);
  for (let r = 0; r < rounds; r++) {
    result = paraphraseForOriginality(result, seed + r * 11);
  }
  return result;
}

export function notesFactCount(notes: BrainNotes): number {
  return (
    notes.definitions.length +
    notes.properties.length +
    notes.procedures.length +
    notes.warnings.length +
    notes.comparisons.length +
    notes.measurements.length
  );
}
