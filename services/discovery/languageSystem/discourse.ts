import type { FactKind } from "./types";
import { acronymFromLabel, pick } from "./lexicon";
import { sectionHook } from "./rhetoric";

const TRANSITIONS = [
  "In addition,",
  "That said,",
  "Practically,",
  "Beyond that,",
  "On balance,",
  "Likewise,",
  "Still,",
  "Meanwhile,",
];

const SECTION_FILLERS: string[] = []; // never pad — dense knowledge only (CEO editorial directive)

function firstWord(s: string): string {
  const m = s.match(/^[("']*(\w+)/);
  return m?.[1]?.toLowerCase() ?? "";
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function startsWithTopic(s: string, topicWords: string[]): boolean {
  const lower = s.toLowerCase();
  return topicWords.some((w) => lower.startsWith(w.toLowerCase()));
}

function mergeShortPair(a: string, b: string): string {
  const aTrim = a.replace(/[.!?]$/, "");
  const bTrim = b.replace(/^[A-Z]/, (c) => c.toLowerCase());
  return `${aTrim}, and ${bTrim}`;
}

/** Rotate short references so the full title is not repeated every sentence. */
export function shortTopicRef(label: string, index: number, seed: number): string {
  const refs: string[] = [];
  const acronym = acronymFromLabel(label);
  if (acronym) refs.push(acronym);

  if (
    /\b(field|science|technology|engineering|intelligence|research|studies|discipline)\b/i.test(
      label
    ) ||
    label.split(/\s+/).length >= 2
  ) {
    refs.push("this field");
  }
  refs.push("the topic", "it");

  if (index === 0) return label;
  return refs[((index - 1 + seed) % refs.length + refs.length) % refs.length];
}

/** Discourse-level polish on a paragraph's sentences. */
export function polishParagraph(sentences: string[], seed = 0): string {
  if (sentences.length === 0) return "";
  if (sentences.length === 1) return sentences[0];

  let out = [...sentences];
  const topicWords = out[0].match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) ?? [];

  const merged: string[] = [];
  for (let i = 0; i < out.length; i++) {
    const cur = out[i];
    const next = out[i + 1];
    if (next && wordCount(cur) < 8 && wordCount(next) < 10 && (seed + i) % 3 === 0) {
      merged.push(mergeShortPair(cur, next));
      i++;
    } else {
      merged.push(cur);
    }
  }
  out = merged;

  const polished: string[] = [];
  let sameStartRun = 0;
  let lastStart = "";

  for (let i = 0; i < out.length; i++) {
    let s = out[i].trim();
    const start = firstWord(s);

    if (start === lastStart) {
      sameStartRun++;
    } else {
      sameStartRun = 1;
      lastStart = start;
    }

    if (sameStartRun > 2 && i > 0) {
      const trans = pick(TRANSITIONS, seed + i);
      s = `${trans} ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
      lastStart = firstWord(s);
      sameStartRun = 1;
    } else if (
      i > 0 &&
      (seed + i) % 4 === 0 &&
      !s.match(/^(In |That |Practically|Meanwhile|Still|Likewise|Beyond|On balance)/)
    ) {
      const trans = pick(TRANSITIONS, seed + i * 2);
      s = `${trans} ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
    }

    if (i > 0 && startsWithTopic(s, topicWords) && (seed + i) % 2 === 1) {
      const trans = pick(["Notably,", "In practice,", "Often,", "Typically,"], seed + i);
      s = `${trans} ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
    }

    polished.push(s);
  }

  return polished.join(" ");
}

/** Section-level polish: hook opening, min word count via approved filler. */
export function polishSection(
  heading: string,
  body: string,
  topicLabel: string,
  seed = 0,
  minWords = 20,
  withHook = false
): string {
  const trimmed = body.trim();
  if (!trimmed) return "";

  let text = trimmed;

  if (withHook) {
    const headingLower = heading.toLowerCase().replace(/\?/g, "");
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const firstLower = (sentences[0] ?? "").toLowerCase();
    const hook = sectionHook(heading, topicLabel, seed);
    if (!firstLower.includes(headingLower.slice(0, Math.min(20, headingLower.length)))) {
      if (!firstLower.startsWith(hook.slice(0, 12).toLowerCase())) {
        text = `${hook} ${text}`;
      }
    } else if (sentences.length > 0) {
      text = `${hook} ${sentences.slice(1).join(" ")}`;
    }
  }

  let wc = wordCount(text);
  let fillerIdx = 0;
  while (wc < minWords && fillerIdx < SECTION_FILLERS.length) {
    text = `${text} ${pick(SECTION_FILLERS, seed + fillerIdx)}`;
    wc = wordCount(text);
    fillerIdx++;
  }

  return text.trim();
}

/** Compose sentences from facts, then apply paragraph polish. */
export function buildParagraph(
  facts: string[],
  kind: FactKind,
  topicLabel: string,
  startIndex: number,
  seed: number,
  realizeFn: (fact: string, kind: FactKind, topicRef: string, index: number, seed: number) => string
): string {
  if (facts.length === 0) return "";
  const sentences = facts.map((fact, i) => {
    const topicRef = shortTopicRef(topicLabel, startIndex + i, seed + i);
    return realizeFn(fact, kind, topicRef, startIndex + i, seed);
  });
  return polishParagraph(sentences, seed);
}
