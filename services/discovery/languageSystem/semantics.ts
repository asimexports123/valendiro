import type { FactKind } from "./types";
import {
  getFallbackPhrases,
  isValidKeyword,
  isValidKeywordPhrase,
  titleCasePhrase,
} from "./lexicon";

export interface MeaningSlots {
  subject: string;
  predicate: string;
  objects: string[];
  modifiers: string[];
  kind: FactKind;
  isPlural: boolean;
  numberPhrase?: string;
}

export interface ParseFactOptions {
  sourceTexts?: string[];
}

function cleanClaim(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/["']/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\([^)]{0,80}\)/g, "")
    .trim();
}

function topicWordSet(topicTitle: string): Set<string> {
  const words = new Set<string>();
  for (const w of topicTitle.toLowerCase().split(/\W+/)) {
    if (w.length > 2) words.add(w);
  }
  return words;
}

function extractNounPhrases(claim: string): string[] {
  const phrases: string[] = [];
  for (const m of claim.matchAll(/"([^"]{4,50})"/g)) phrases.push(m[1]);
  const listMatch = claim.match(/\b(?:including|such as|like|e\.g\.)\s+([^.]{8,100})/i);
  if (listMatch) {
    for (const part of listMatch[1].split(/,|\band\b/)) {
      const cleaned = part.trim().replace(/^the\s+/i, "");
      if (cleaned.length >= 4) phrases.push(cleaned);
    }
  }
  return phrases;
}

function extractPredicate(cleaned: string): { subject: string; predicate: string; focus: string } {
  const patterns: Array<{ re: RegExp; pred: string }> = [
    { re: /^(.+?)\s+(is|are)\s+(.+)$/i, pred: "is" },
    { re: /^(.+?)\s+(means|refers to|defined as)\s+(.+)$/i, pred: "means" },
    { re: /^(.+?)\s+involves\s+(.+)$/i, pred: "involves" },
    { re: /^(.+?)\s+(includes|contains|covers)\s+(.+)$/i, pred: "includes" },
    { re: /^(.+?)\s+(requires|needs|depends on)\s+(.+)$/i, pred: "requires" },
    { re: /^(.+?)\s+(compared to|versus|vs\.?)\s+(.+)$/i, pred: "compares" },
    { re: /^(.+?)\s+(measures|tracks|reports)\s+(.+)$/i, pred: "measures" },
    { re: /^(.+?)\s+(can|should|must)\s+(.+)$/i, pred: "should" },
    { re: /^(.+?)\s+(often|typically|usually)\s+(.+)$/i, pred: "typically" },
  ];

  for (const { re, pred } of patterns) {
    const m = cleaned.match(re);
    if (m) {
      return { subject: m[1].trim(), predicate: pred, focus: m[m.length - 1].trim() };
    }
  }

  return { subject: "", predicate: "relates", focus: cleaned };
}

function addKeyword(unique: string[], seen: Set<string>, phrase: string): void {
  const key = phrase.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  unique.push(titleCasePhrase(phrase));
}

function extractKeywords(
  claim: string,
  topicTitle: string,
  seed: number,
  kind: FactKind
): string[] {
  const topicWords = topicWordSet(topicTitle);
  const { focus } = extractPredicate(claim);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const phrase of extractNounPhrases(claim)) {
    const cleaned = phrase.trim().replace(/^the\s+/i, "");
    if (isValidKeywordPhrase(cleaned, claim)) {
      addKeyword(unique, seen, cleaned);
      continue;
    }
    const words = cleaned
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => isValidKeyword(w, claim) && !topicWords.has(w));
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (isValidKeywordPhrase(bigram, claim)) addKeyword(unique, seen, bigram);
    }
  }

  const words = cleanClaim(focus)
    .toLowerCase()
    .replace(/[^\w\s%]/g, " ")
    .split(/\s+/)
    .filter((w) => isValidKeyword(w, claim) && !topicWords.has(w));

  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (isValidKeywordPhrase(bigram, claim)) addKeyword(unique, seen, bigram);
  }

  for (const w of words) {
    if (seen.has(w)) continue;
    addKeyword(unique, seen, w);
  }

  if (unique.length === 0) return getFallbackPhrases(kind, seed);

  const bigrams = unique.filter((k) => k.includes(" "));
  const singles = unique.filter((k) => !k.includes(" "));
  const filteredSingles = singles.filter(
    (s) => !bigrams.some((b) => b.toLowerCase().includes(s.toLowerCase()))
  );
  const deduped = [...bigrams, ...filteredSingles];

  const rotated = [...deduped.slice(seed % deduped.length), ...deduped.slice(0, seed % deduped.length)];
  return rotated.slice(0, 4);
}

function extractModifiers(claim: string, topicTitle: string): string[] {
  const topicWords = topicWordSet(topicTitle);
  const modPatterns = [
    /\b(typically|commonly|often|usually|generally|frequently)\b/gi,
    /\b(especially|notably|particularly|significantly)\b/gi,
    /\b(roughly|approximately|about|nearly)\b/gi,
  ];
  const mods = new Set<string>();
  for (const re of modPatterns) {
    for (const m of claim.matchAll(re)) {
      const w = m[1].toLowerCase();
      if (!topicWords.has(w) && !mods.has(w)) mods.add(w);
    }
  }
  return [...mods];
}

/**
 * Parse a raw fact into structured meaning slots.
 * Never returns raw claim text in output fields.
 */
export function parseFactToSlots(
  fact: string,
  topicLabel: string,
  kind: FactKind,
  seed: number,
  _options: ParseFactOptions = {}
): MeaningSlots {
  const cleaned = cleanClaim(fact);
  const { subject, predicate } = extractPredicate(cleaned);
  const numberMatch = cleaned.match(/(\d[\d,.]*\s*(?:%|percent|million|billion|thousand)?)/i);

  const objects = extractKeywords(cleaned, topicLabel, seed, kind);
  const modifiers = extractModifiers(cleaned, topicLabel);

  return {
    subject: subject || topicLabel,
    predicate,
    objects,
    modifiers,
    kind,
    isPlural: /\bare\b/i.test(cleaned),
    numberPhrase: numberMatch?.[1],
  };
}
