/**
 * Composition grammar + editorial compression pass (no LLM).
 *
 * Repairs broken phrasing and deletes filler that does not teach, explain,
 * connect, or illustrate. Not a new engine — final pass before publish.
 */

import { acronymFromLabel } from "./languageSystem/lexicon";
import { isEditorialFillerSentence } from "./brainDiscourseVariety";

export interface EditorialPassStats {
  sentencesBefore: number;
  sentencesAfter: number;
  sentencesRemoved: number;
  fillerRemoved: number;
}

let lastPassStats: EditorialPassStats = {
  sentencesBefore: 0,
  sentencesAfter: 0,
  sentencesRemoved: 0,
  fillerRemoved: 0,
};

export function getLastEditorialPassStats(): EditorialPassStats {
  return { ...lastPassStats };
}

function capitalizeSentence(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function fixDuplicateWords(text: string): string {
  return text.replace(/\b(\w+)\s+\1\b/gi, "$1");
}

function fixAcronyms(text: string, topicLabel: string): string {
  let out = text;
  out = out.replace(/\baI\b/g, "AI");
  const acronym = acronymFromLabel(topicLabel);
  if (acronym) {
    const re = new RegExp(`\\b${acronym.charAt(0)}${acronym.slice(1).toLowerCase()}\\b`, "g");
    out = out.replace(re, acronym);
    out = out.replace(
      /\bhI\b/gi,
      topicLabel.split(/\s+/)[0]?.toLowerCase() === "health" ? "Health insurance" : acronym
    );
  }
  // Prefer short noun for "X Fundamentals is a …"
  const shortLabel = topicLabel
    .replace(/\s+fundamentals$/i, "")
    .replace(/\s+explained$/i, "")
    .trim();
  if (shortLabel && shortLabel.toLowerCase() !== topicLabel.toLowerCase()) {
    const esc = topicLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(
      new RegExp(`\\b${esc}\\s+is\\s+(a|an)\\b`, "gi"),
      `${shortLabel} is $1`
    );
  }
  return out;
}

/** Insert missing copula in common broken patterns from paraphrase. */
function fixMissingVerbs(sentence: string): string {
  let out = sentence;

  out = out.replace(/\bdescribes\s+is\b/gi, "is");
  out = out.replace(/\bnot\s+is\s+(a|an)\b/gi, "is not $1");
  out = out.replace(/\bis\s+not\s+is\b/gi, "is not");
  out = out.replace(/\bof\s+is\s+(a|an)\b/gi, "of $1");
  out = out.replace(/\brisk of is\b/gi, "risk of");

  out = out.replace(
    /\b([A-Z][a-z]+(?:\s+[a-z]+){0,3})\s+(capability|ability|capacity|power)\s+of\b/,
    (full, subject, noun) => {
      if (/\b(is|are|was|were)\b/i.test(subject)) return full;
      return `${subject} is the ${noun} of`;
    }
  );

  out = out.replace(/\bof\s+is\s+(a|an|the)\b/gi, "of $1");
  out = out.replace(/\bmakes\s+is\s+the\b/gi, "makes the");
  out = out.replace(/\brisk of is\b/gi, "risk of");
  out = out.replace(/\bis uses\b/gi, "uses");
  out = out.replace(/\baspect of is\b/gi, "aspect of");
  out = out.replace(/\bthis field is\s+([a-z][a-z\s-]{2,40}?)\s+can\b/gi, "$1 can");
  out = out.replace(/\b([A-Z][a-z]+(?:\s+[a-z]+)?)\s+is\s+\1\s+can\b/gi, "$1 can");
  if (/^this field is\b/i.test(out) && /\bcan\b/i.test(out) && !/\b(is a|is an|are a|means)\b/i.test(out)) {
    return "";
  }

  out = out.replace(
    /^([^.!?]{8,}?)\s+(typical|common|standard|frequent|widely|generally)\s+/i,
    (full, subject, adj) => {
      if (/\b(is|are|was|were|has|have)\b/i.test(subject)) return full;
      const verb = /\b(patterns|funds|solutions|types|elements)\b/i.test(subject) ? "are" : "is";
      return `${subject.trim()} ${verb} ${adj} `;
    }
  );

  out = out.replace(
    /\b((?:An?|The)\s+[a-z][a-z\s-]{2,40}?)\s+((?:a|an|the)\s+[a-z])/i,
    (full, subject, predicate) => {
      if (/\b(is|are|was|were)\b/i.test(subject)) return full;
      // Never rewrite prepositional tails: "block of the Web" ≠ missing copula
      if (/\b(of|for|in|to|from|with|on|by)\s*$/i.test(subject.trim())) return full;
      return `${subject.trim()} is ${predicate}`;
    }
  );

  out = out.replace(
    /\b([a-z][a-z\s]{2,30}?)\s+(a|an)\s+(pooled|mutual|passive|form of|kind of|type of)\b/i,
    (full, subject, article, next) => {
      if (/\b(is|are)\b/i.test(subject)) return full;
      return `${subject.trim()} is ${article} ${next}`;
    }
  );

  out = out.replace(
    /\b(design patterns?|index funds?)\s+(typical|common|a|an)\b/gi,
    (full, subject, next) => {
      if (/\b(is|are)\b/i.test(full)) return full;
      const verb = /patterns?|funds?/i.test(subject) ? "are" : "is";
      return `${subject} ${verb} ${next}`;
    }
  );

  // "Index Funds is a" → "An index fund is a" style fix for plural label + singular verb
  out = out.replace(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is\s+(a|an)\b/g, (full, subject, article) => {
    if (/\bfunds$/i.test(subject) && !/\bfund$/i.test(subject)) {
      return `An ${subject.replace(/s$/i, "").toLowerCase()} is ${article}`;
    }
    if (/\bpatterns$/i.test(subject)) {
      return `A ${subject.replace(/s$/i, "").toLowerCase()} is ${article}`;
    }
    return full;
  });

  return out;
}

function teachesOrExplains(sentence: string): boolean {
  const t = sentence.trim();
  if (t.length < 18) return false;
  if (isEditorialFillerSentence(t)) return false;
  return true;
}

function fixIncompleteSentences(sentence: string): string {
  let out = sentence.trim();
  if (/\bso that it can\.?$/i.test(out)) {
    out = out.replace(/\bso that it can\.?$/i, "so that it can track its target.");
  }
  if (/\baccording to the\b[^.]{0,80}\.?$/i.test(out) && out.split(/\s+/).length < 12) {
    return "";
  }
  if (out.length > 20 && !/[.!?]$/.test(out)) {
    out = `${out}.`;
  }
  return out;
}

function repairSentence(sentence: string, topicLabel: string): { text: string; wasFiller: boolean } {
  let out = sentence.trim();
  if (!out) return { text: "", wasFiller: true };
  if (isEditorialFillerSentence(out)) return { text: "", wasFiller: true };

  out = fixDuplicateWords(out);
  out = fixAcronyms(out, topicLabel);
  out = fixMissingVerbs(out);
  out = fixIncompleteSentences(out);
  if (!out || isEditorialFillerSentence(out) || !teachesOrExplains(out)) {
    return { text: "", wasFiller: true };
  }
  return { text: capitalizeSentence(out), wasFiller: false };
}

function repairParagraph(paragraph: string, topicLabel: string): string {
  if (paragraph.startsWith("## ") || paragraph.startsWith("# ")) return paragraph;
  if (paragraph.startsWith("**Where to start?**") || paragraph.startsWith("**What is the first")) {
    // Drop meta CTA padding — not knowledge
    if (/this guide|from this guide/i.test(paragraph)) return "";
    return paragraph;
  }

  // Italic-only title lines (*Topic*) add no knowledge
  if (/^\*[^*]+\*$/.test(paragraph.trim())) return "";

  const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
  const repaired: string[] = [];
  for (const s of sentences) {
    const { text, wasFiller } = repairSentence(s, topicLabel);
    if (wasFiller) {
      lastPassStats.fillerRemoved++;
      continue;
    }
    if (text.length > 15) repaired.push(text);
  }

  // Drop paragraphs that are only one weak leftover after compression
  if (repaired.length === 0) return "";
  return repaired.join(" ");
}

/**
 * Grammar repair + editorial compression over composed markdown.
 * Deletes filler; keeps dense knowledge. Quality > word count.
 */
export function repairCompositionGrammar(
  markdown: string,
  topicLabel: string,
  _displayName = topicLabel
): string {
  const blocks = markdown.split(/\n{2,}/);
  let before = 0;
  let after = 0;
  lastPassStats = { sentencesBefore: 0, sentencesAfter: 0, sentencesRemoved: 0, fillerRemoved: 0 };

  const repaired = blocks.map((block) => {
    if (block.startsWith("#") && !block.includes("\n")) return block;
    const sentences = block.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
    before += sentences.length;
    const out = repairParagraph(block, topicLabel);
    if (out) {
      after += out.split(/(?<=[.!?])\s+/).filter(Boolean).length;
    }
    return out;
  });

  lastPassStats.sentencesBefore = before;
  lastPassStats.sentencesAfter = after;
  lastPassStats.sentencesRemoved = Math.max(0, before - after);

  return repaired.filter((b) => b && b.trim().length > 0).join("\n\n");
}
