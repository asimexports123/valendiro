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

function isUsableSentence(s: string): boolean {
  if (s.length < 30 || s.length > 380) return false;
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

function topicRelevant(sentence: string, topicTitle: string): boolean {
  const lower = sentence.toLowerCase();
  const words = topicTitle.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  if (words.length === 0) return true;
  return words.some((w) => lower.includes(w));
}

export function brainUnderstand(fuelTexts: string[], topicTitle: string): BrainNotes {
  const raw: { text: string; type: FactType }[] = [];

  for (const block of fuelTexts) {
    for (const sentence of splitIntoSentences(block)) {
      const cleaned = cleanSentence(sentence);
      if (!isUsableSentence(cleaned)) continue;
      if (!topicRelevant(cleaned, topicTitle) && raw.length > 20) continue;
      raw.push({ text: cleaned, type: classifyFactType(cleaned) });
    }
  }

  const unique = dedupeSentences(raw.map((r) => r.text));
  const byType = (type: FactType) =>
    raw.filter((r) => unique.includes(r.text) && r.type === type).map((r) => r.text);

  return {
    definitions: byType("definition").slice(0, 8),
    properties: byType("property").slice(0, 12),
    procedures: byType("procedural").slice(0, 10),
    warnings: byType("warning").slice(0, 6),
    comparisons: byType("comparison").slice(0, 6),
    measurements: byType("measurement").slice(0, 6),
    allFacts: unique.slice(0, 30),
  };
}

/** Restructure a source claim — never return verbatim. */
export function transformClaim(sentence: string, topicTitle: string): string {
  let s = cleanSentence(sentence);

  const def = s.match(/^(.+?)\s+(is|are|means|refers to|defined as)\s+(.+)$/i);
  if (def) {
    const tail = def[3].replace(/\.$/, "");
    return `${topicTitle} ${def[2].toLowerCase() === "are" ? "are" : "is"} ${lcFirst(tail)}.`;
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

  return `${topicTitle} involves ${lcFirst(s.replace(/\.$/, ""))}.`;
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
