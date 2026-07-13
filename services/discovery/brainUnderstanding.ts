/**
 * Brain understanding — parse facts into structured claims (no LLM).
 *
 * Preserves full predicate phrases instead of decomposing into keyword arrays.
 */

import type { BrainNotes } from "./catalogBrainUtils";
import type { FactKind } from "./languageSystem/types";

export type ClaimRelation =
  | "defines"
  | "describes"
  | "requires"
  | "warns"
  | "compares"
  | "measures"
  | "procedural";

export interface UnderstoodClaim {
  sourceFact: string;
  relation: ClaimRelation;
  subject: string;
  assertion: string;
  elaboration?: string;
}

function cleanFact(s: string): string {
  return s
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .replace(/["']/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\([^)]{0,80}\)/g, "")
    .replace(
      /^(goals|planning and decision-making|knowledge representation and knowledge engineering)\s+/i,
      ""
    )
    .trim();
}

function lcFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function topicWordSet(topicLabel: string): Set<string> {
  const words = new Set<string>();
  for (const w of topicLabel.toLowerCase().split(/\W+/)) {
    if (w.length > 2) words.add(w);
  }
  return words;
}

function stripSectionHeading(text: string): string {
  return text
    .replace(/^(Goals|Planning and decision-making|Knowledge representation[^.]*?)\s+/i, "")
    .replace(/\[d\]/gi, "")
    .trim();
}

function subjectRelatesToTopic(subject: string, topicLabel: string): boolean {
  const topicWords = topicWordSet(topicLabel);
  const subjectWords = subject.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (subjectWords.length === 0) return false;
  const hits = subjectWords.filter((w) => topicWords.has(w)).length;
  return hits >= 1 || /^(ai|it|they|these|this)\b/i.test(subject);
}

function stripTopicPrefix(text: string, topicLabel: string): string {
  const topicWords = topicLabel.split(/\s+/).filter((w) => w.length > 2);
  let out = text.trim();
  for (const w of topicWords) {
    const re = new RegExp(`^${w}\\s+`, "i");
    out = out.replace(re, "");
  }
  return out.replace(/^the\s+/i, "").trim();
}

function assertionFromFullFact(cleaned: string, topicLabel: string): string {
  let out = cleaned.replace(/\.$/, "");
  out = stripTopicPrefix(out, topicLabel);
  out = out.replace(
    new RegExp(`^${topicLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(is|are|means|refers to)\\s+`, "i"),
    ""
  );
  return simplifyAssertion(stripSectionHeading(out), topicLabel);
}

function simplifyAssertion(assertion: string, topicLabel: string, maxWords = 28): string {
  let out = assertion
    .replace(/\.$/, "")
    .replace(/\s+/g, " ")
    .replace(/^that\s+/i, "")
    .replace(/^which\s+/i, "")
    .trim();

  out = stripTopicPrefix(out, topicLabel);
  out = stripSectionHeading(out);

  const words = out.split(/\s+/).filter(Boolean);
  if (words.length > maxWords) {
    out = words.slice(0, maxWords).join(" ");
    const lastComma = out.lastIndexOf(",");
    if (lastComma > out.length * 0.5) out = out.slice(0, lastComma);
  }

  return out.replace(/[,;:]\s*$/, "").trim();
}

function splitElaboration(focus: string): { assertion: string; elaboration?: string } {
  const clauseSplit = focus.match(/^(.+?),\s+(which|who|where|when|while|because|although|though|and)\s+(.+)$/i);
  if (clauseSplit && clauseSplit[1].split(/\s+/).length >= 4) {
    return {
      assertion: clauseSplit[1].trim(),
      elaboration: `${clauseSplit[2]} ${clauseSplit[3]}`.trim(),
    };
  }
  return { assertion: focus };
}

function extractFromFact(cleaned: string): {
  subject: string;
  predicate: string;
  focus: string;
} {
  const lead = cleaned.split(/(?<=[.!?])\s+/)[0]?.trim() ?? cleaned.trim();
  const target = lead.length >= 24 ? lead : cleaned;
  // Normalize title-style fragments where a subject is followed by a capitalized verb,
  // e.g. "Factory method Define an interface..." -> "Factory method define an interface..."
  const normalized = target.replace(
    /^([A-Z][^\\s]{0,60})\\s+([A-Z][a-z]{2,30})\\s+/,
    (_m, subj, verb) => `${subj} ${verb.charAt(0).toLowerCase()}${verb.slice(1)} `
  );
  // If normalized looks like "Subject Rest" with no verb, convert to a copular assertion:
  let normalized2 = normalized;
  const hasVerb = /\\b(is|are|refers to|defined as|means|involves|includes|contains|requires|compares|measures|can|should|must|avoid|never|to |how to|step )\\b/i;
  if (!hasVerb.test(normalized2)) {
    const m2 = normalized2.match(/^([A-Z][\\w\\s\\-]{1,60})\\s+(.{6,200})$/);
    if (m2) {
      const subj = m2[1].trim();
      const rest = m2[2].trim();
      if (/^[A-Z]/.test(rest)) {
        normalized2 = `${subj} is ${rest.charAt(0).toLowerCase()}${rest.slice(1)}`;
      }
    }
  }
  const patterns: Array<{ re: RegExp; pred: string }> = [
    // Title-style fragments where subject is followed by a capitalized verb without punctuation,
    // e.g. "Factory method Define an interface..." -> treat as definition-like
    { re: /^(.+?)\s+(Define|Defines|Provide|Provides|Allow|Allows|Ensure|Ensures|Return|Returns)\s+(.+)$/i, pred: "means" },
    // Title-style warnings e.g. "Object pool Avoid expensive acquisition..."
    { re: /^(.+?)\s+(Avoid|Avoids|Never)\s+(.+)$/i, pred: "warns" },
    { re: /^(.+?)\s+describes\s+(.+)$/i, pred: "describes" },
    { re: /^(.+?)\s+(is|are)\s+(.+)$/i, pred: "is" },
    { re: /^(.+?)\s+(means|refers to|defined as)\s+(.+)$/i, pred: "means" },
    { re: /^(.+?)\s+involves\s+(.+)$/i, pred: "involves" },
    { re: /^(.+?)\s+(includes|contains|covers)\s+(.+)$/i, pred: "includes" },
    { re: /^(.+?)\s+(requires|needs|depends on)\s+(.+)$/i, pred: "requires" },
    { re: /^(.+?)\s+(compared to|versus|vs\.?|unlike|whereas)\s+(.+)$/i, pred: "compares" },
    { re: /^(.+?)\s+(measures|tracks|reports)\s+(.+)$/i, pred: "measures" },
    { re: /^(.+?)\s+(can|should|must)\s+(.+)$/i, pred: "can" },
    { re: /^(.+?)\s+(often|typically|usually)\s+(.+)$/i, pred: "typically" },
    { re: /^(never|don't|do not|avoid|warning|caution):?\s+(.+)$/i, pred: "warns" },
    { re: /^(to |how to|first |step \d)/i, pred: "procedural" },
  ];

  for (const { re, pred } of patterns) {
    const m = normalized2.match(re) || normalized.match(re) || target.match(re);
    if (m) {
      if (pred === "warns") {
        return { subject: "", predicate: pred, focus: m[2]?.trim() ?? target };
      }
      if (pred === "procedural") {
        return {
          subject: "",
          predicate: pred,
          focus: target.replace(/^(to |how to)\s*/i, "").trim(),
        };
      }
      return { subject: m[1].trim(), predicate: pred, focus: m[m.length - 1].trim() };
    }
  }

  return { subject: "", predicate: "describes", focus: target };
}

function kindToRelation(kind: FactKind, predicate: string): ClaimRelation {
  if (kind === "definition" || predicate === "is" || predicate === "means") return "defines";
  if (kind === "warning" || predicate === "warns") return "warns";
  if (kind === "procedure" || predicate === "procedural") return "procedural";
  if (kind === "comparison" || predicate === "compares") return "compares";
  if (kind === "measurement" || predicate === "measures") return "measures";
  if (predicate === "requires") return "requires";
  return "describes";
}

function buildAssertion(
  predicate: string,
  focus: string,
  relation: ClaimRelation,
  topicLabel: string
): { assertion: string; elaboration?: string } {
  const { assertion: rawFocus, elaboration } = splitElaboration(focus);
  let assertion = simplifyAssertion(rawFocus, topicLabel);

  if (relation === "defines") {
    if (predicate === "means" || predicate === "is") {
      assertion = simplifyAssertion(rawFocus, topicLabel);
    } else {
      assertion = simplifyAssertion(focus, topicLabel);
    }
  } else if (relation === "warns") {
    assertion = simplifyAssertion(
      focus.replace(/^(never|don't|do not|avoid|warning:?|caution:?)\s*/i, ""),
      topicLabel
    );
  } else if (relation === "procedural") {
    assertion = simplifyAssertion(
      focus.replace(/^(to |how to|first |step \d+:?\s*)/i, ""),
      topicLabel
    );
  } else if (relation === "compares") {
    assertion = simplifyAssertion(focus, topicLabel);
  } else if (relation === "measures") {
    const numMatch = focus.match(/^(\d[\d,.]*\s*(?:%|percent|million|billion|thousand)?)\s*(.*)$/i);
    if (numMatch) {
      assertion = numMatch[2]
        ? simplifyAssertion(`${numMatch[1]} ${numMatch[2]}`, topicLabel)
        : numMatch[1];
    }
  } else if (predicate === "requires") {
    assertion = simplifyAssertion(focus, topicLabel);
  } else if (predicate === "typically" || predicate === "can") {
    assertion = simplifyAssertion(`${predicate === "can" ? "can" : "typically"} ${rawFocus}`, topicLabel);
  }

  if (!assertion || assertion.split(/\s+/).length < 3) {
    assertion = simplifyAssertion(focus, topicLabel, 24);
  }

  assertion = assertion.replace(/\bit is\b/i, "is").replace(/^it\s+/i, "");

  const cleanElab = elaboration
    ? simplifyAssertion(lcFirst(elaboration), topicLabel, 16)
    : undefined;

  return { assertion, elaboration: cleanElab };
}

/** Parse one fact into a structured claim with a readable assertion phrase. */
export function understandFact(
  fact: string,
  topicLabel: string,
  kind: FactKind
): UnderstoodClaim {
  const cleaned = cleanFact(fact);
  const { subject, predicate, focus } = extractFromFact(cleaned);
  let relation = kindToRelation(kind, predicate);
  let { assertion, elaboration } = buildAssertion(predicate, focus, relation, topicLabel);

  let resolvedSubject = topicLabel;
  if (subject && subjectRelatesToTopic(subject, topicLabel)) {
    resolvedSubject = subject;
  } else if (subject && !subjectRelatesToTopic(subject, topicLabel)) {
    relation = kind === "definition" ? "defines" : "describes";
    assertion = assertionFromFullFact(cleaned, topicLabel);
    elaboration = undefined;
  }

  if (/^(insufficient|used in|allow|includes?|involves?|high-profile|since the)/i.test(assertion)) {
    if (relation === "defines" && !/^capability\b/i.test(assertion)) {
      relation = "describes";
    }
  }

  if (kind === "warning" && relation !== "warns") {
    relation = "warns";
  }

  return {
    sourceFact: fact,
    relation,
    subject: resolvedSubject,
    assertion,
    elaboration,
  };
}

function factsForKind(notes: BrainNotes, kind: FactKind): string[] {
  switch (kind) {
    case "definition":
      return notes.definitions.length > 0 ? notes.definitions : notes.allFacts;
    case "property":
      return notes.properties;
    case "procedure":
      return notes.procedures.length > 0 ? notes.procedures : notes.properties.slice(0, 6);
    case "warning":
      return notes.warnings.length > 0
        ? notes.warnings
        : [...notes.comparisons.slice(0, 2), ...notes.properties.slice(6, 10)].filter(Boolean);
    case "comparison":
      return notes.comparisons;
    case "measurement":
      return notes.measurements;
    default:
      return [];
  }
}

/** Understand all facts in brain notes, tagged by kind. */
export function understandNotes(
  notes: BrainNotes,
  topicLabel: string
): Array<UnderstoodClaim & { kind: FactKind }> {
  const kinds: FactKind[] = [
    "definition",
    "property",
    "procedure",
    "warning",
    "comparison",
    "measurement",
  ];
  const out: Array<UnderstoodClaim & { kind: FactKind }> = [];

  for (const kind of kinds) {
    for (const fact of factsForKind(notes, kind)) {
      out.push({ ...understandFact(fact, topicLabel, kind), kind });
    }
  }

  return out;
}
