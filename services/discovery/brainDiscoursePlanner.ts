/**
 * Generic discourse planner — reasons from claim meaning, never topic names (no LLM).
 *
 * Reading journey (sections adapt automatically):
 * definition → why it matters → core ideas → how it works → examples →
 * applications → benefits → limitations → mistakes → summary
 */

import type { UnderstoodClaim, ClaimRelation } from "./brainUnderstanding";
import type { FactKind } from "./languageSystem/types";
import type { NarrationVoice } from "./brainNarration";
import { discourseLead, surfaceParaphrase } from "./brainParaphrase";
import { variedSupportForStage } from "./brainDiscourseVariety";

export type JourneyStage =
  | "definition"
  | "why_it_matters"
  | "core_ideas"
  | "how_it_works"
  | "examples"
  | "applications"
  | "benefits"
  | "limitations"
  | "mistakes"
  | "summary";

export interface PlannedDiscourse {
  centralIdea: string;
  stage: JourneyStage;
  lead: string;
  support: string;
  voice: NarrationVoice;
}

function clean(s: string): string {
  return s
    .replace(/\[\d+\]/g, "")
    .replace(/\[[a-z]\]/gi, "")
    .replace(/\[edit\]/gi, "")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/\btakeaway:\s*/gi, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function trimAssertion(text: string, max = 150): string {
  let t = clean(text);
  if (t.length <= max) return t.replace(/\.$/, "");
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > 50 ? cut.slice(0, sp) : cut).trim();
}

function listItems(text: string, max = 4): string[] {
  return text
    .split(/,|\band\b/)
    .map((p) => p.trim().replace(/^the\s+/i, ""))
    .filter((p) => p.length > 2 && p.length < 50)
    .slice(0, max);
}

function joinNatural(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** Infer journey stage from claim meaning and section role — not topic slug. */
export function inferJourneyStage(
  claim: UnderstoodClaim,
  kind: FactKind,
  sectionId: string
): JourneyStage {
  if (sectionId === "summary") return "summary";
  if (sectionId === "mistakes" || claim.relation === "warns") return "mistakes";
  if (sectionId === "why") return "why_it_matters";
  if (sectionId === "how") return "how_it_works";
  if (sectionId === "practical") return "applications";
  if (sectionId === "overview") return "definition";

  const a = (claim.assertion || claim.sourceFact).toLowerCase();

  if (claim.relation === "defines" || kind === "definition") {
    return sectionId === "overview" ? "definition" : "core_ideas";
  }
  if (claim.relation === "procedural" || kind === "procedure") return "how_it_works";
  if (claim.relation === "compares" || kind === "comparison") return "benefits";
  if (claim.relation === "measures" || kind === "measurement") return "benefits";

  if (/\b(risk|limit|drawback|challenge|difficult|problem|pitfall|caution|harm)\b/.test(a)) {
    return sectionId === "mistakes" ? "mistakes" : "limitations";
  }
  if (/\b(include|such as|for example|e\.g\.|used in|used for|application|everyday)\b/.test(a)) {
    return "applications";
  }
  if (/\b(benefit|advantage|value|gain|improve|efficien|cost.saving)\b/.test(a)) {
    return "benefits";
  }
  if (/\b(important|matter|significant|reason|because|why)\b/.test(a)) {
    return "why_it_matters";
  }
  if (/\b(step|process|method|work|mechanism|how|procedure|algorithm)\b/.test(a)) {
    return "how_it_works";
  }
  if (sectionId === "practical") return "applications";
  if (sectionId === "keyConcepts") return "core_ideas";
  if (sectionId === "overview") return "core_ideas";
  return "core_ideas";
}

/** Central idea label from meaning — never topic-specific regex. */
export function deriveCentralIdea(
  claim: UnderstoodClaim,
  sectionId: string,
  topicLabel: string
): string {
  const stage = inferJourneyStage(claim, relationToKind(claim.relation), sectionId);
  const labels: Record<JourneyStage, string> = {
    definition: `what ${topicLabel} is`,
    why_it_matters: `why ${topicLabel} matters`,
    core_ideas: `a core idea in ${topicLabel}`,
    how_it_works: `how ${topicLabel} works`,
    examples: `a concrete example`,
    applications: `where ${topicLabel} shows up`,
    benefits: `a benefit of ${topicLabel}`,
    limitations: `a limitation to know`,
    mistakes: `a common mistake`,
    summary: `essential takeaway`,
  };
  const base = labels[stage];
  const assertKey = claim.assertion
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 72);
  return assertKey.length >= 12 ? `${base} — ${assertKey}` : base;
}

function relationToKind(relation: ClaimRelation): FactKind {
  if (relation === "defines") return "definition";
  if (relation === "procedural") return "procedure";
  if (relation === "warns") return "warning";
  if (relation === "compares") return "comparison";
  if (relation === "measures") return "measurement";
  return "property";
}

function sentenceFromClaim(claim: UnderstoodClaim, topicRef: string, seed = 0, isFirstAnswer = false): string {
  let raw = trimAssertion(claim.assertion || claim.sourceFact);
  // Strip accidental relation verbs glued onto assertions ("describes is a…")
  raw = raw.replace(/^(describes|defines)\s+(is|are|a|an|the)\b/i, "$2");
  if (raw.length < 20 || /^retrieved \d{4}/i.test(raw) || /ssrn \d+/i.test(raw)) {
    raw = trimAssertion(claim.sourceFact.replace(/^[^.]{0,30}((?:is|are|was|were|has|have|means|refers)\b)/i, (m) => m));
  }
  if (raw.length < 15) return `${topicRef} is best understood through one clear definition and one concrete use.`;
  let sentence: string;
  if (/^[A-Z][^.]{10,}\b(is|are|was|were|has|have|includes?|means|refers)\b/i.test(raw)) {
    sentence = discourseLead(raw, seed, isFirstAnswer);
  } else if (/^(is|are|was|were|has|have|includes?|involves?|means|refers)\b/i.test(raw)) {
    sentence = discourseLead(`${topicRef} ${raw.charAt(0).toLowerCase()}${raw.slice(1)}`, seed, isFirstAnswer);
  } else if (
    /^(capability|ability|capacity|power|a|an|the|typical|common|standard|reusable|pooled|form of|kind of)\b/i.test(
      raw
    )
  ) {
    // Noun-phrase predicate after subject was stripped — restore copula
    sentence = discourseLead(`${topicRef} is ${raw.charAt(0).toLowerCase()}${raw.slice(1)}`, seed, isFirstAnswer);
  } else {
    const subj =
      claim.subject && !/^(it|they|this|these)$/i.test(claim.subject)
        ? claim.subject
        : topicRef;
    const joined = raw.toLowerCase().startsWith(subj.toLowerCase())
      ? raw
      : `${subj} ${raw.charAt(0).toLowerCase()}${raw.slice(1)}`;
    // Avoid "X typical solutions" / "X capability of" without a verb
    if (!/\b(is|are|was|were|has|have|includes?|means|refers)\b/i.test(joined.slice(0, 80))) {
      sentence = discourseLead(
        `${subj} is ${raw.charAt(0).toLowerCase()}${raw.slice(1)}`,
        seed,
        isFirstAnswer
      );
    } else {
      sentence = discourseLead(joined, seed, isFirstAnswer);
    }
  }
  // Final guard against "X describes is …"
  sentence = sentence.replace(/\bdescribes\s+is\b/gi, "is").replace(/\bnot\s+is\s+(a|an)\b/gi, "is not $1");
  return surfaceParaphrase(sentence, seed + 1);
}

function examplesFromAssertion(assertion: string): string | null {
  const m = assertion.match(/(?:such as|including|includes?|e\.g\.)\s+(.+?)(?:\.|;|$)/i);
  if (!m) return null;
  const items = joinNatural(listItems(m[1], 3));
  if (!items) return null;
  return `For example, ${items}.`;
}

function supportForStage(
  stage: JourneyStage,
  topicRef: string,
  claim: UnderstoodClaim,
  seed = 0,
  followOn?: UnderstoodClaim
): string {
  // Prefer a related follow-on claim as teaching support (continuous explanation)
  if (followOn) {
    const follow = teachingFollowOn(claim, followOn, seed);
    if (follow) return follow;
  }

  const fromFact = examplesFromAssertion(claim.assertion || claim.sourceFact);
  if (fromFact) return fromFact;

  if (claim.elaboration && claim.elaboration.length > 24) {
    const extra = trimAssertion(claim.elaboration, 120);
    if (extra.length > 20) {
      return `${extra.charAt(0).toUpperCase()}${extra.slice(1)}.`.replace(/\.\.$/, ".");
    }
  }

  // Last resort: only use stock support when it still teaches; prefer empty over filler
  const support = variedSupportForStage(stage, topicRef, seed);
  if (!support || /related ideas sit beside|neighboring concepts become|building block you will reuse/i.test(support)) {
    return "";
  }
  return support;
}

/** Turn a second related claim into the next beat of the same explanation. */
function teachingFollowOn(
  lead: UnderstoodClaim,
  follow: UnderstoodClaim,
  seed: number
): string | null {
  const raw = trimAssertion(follow.assertion || follow.sourceFact, 130);
  if (raw.length < 18) return null;
  // Avoid restating the lead almost verbatim
  const leadKey = (lead.assertion || "").toLowerCase().slice(0, 60);
  if (raw.toLowerCase().startsWith(leadKey.slice(0, 40))) return null;

  const starters = [
    "That means ",
    "In other words, ",
    "So ",
    "Because of that, ",
    "From there, ",
    "Practically, ",
  ];
  const starter = starters[Math.abs(seed) % starters.length];
  let body = raw.replace(/^[A-Z]/, (c) => c.toLowerCase());
  // Drop leading subject repeat if same as lead subject
  const subj = (lead.subject || "").trim();
  if (subj.length > 2) {
    body = body.replace(new RegExp(`^(the\\s+)?${subj.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(is|are|can|will|helps|enables)\\s+`, "i"), "");
  }
  if (body.length < 16) body = raw;
  const sentence = `${starter}${body}`.replace(/\s+/g, " ").trim();
  return sentence.endsWith(".") ? sentence : `${sentence}.`;
}

function voiceForStageFixed(stage: JourneyStage): NarrationVoice {
  if (stage === "applications" || stage === "examples") return "example";
  if (stage === "limitations" || stage === "mistakes") return "warn";
  if (stage === "benefits") return "compare";
  if (stage === "summary") return "conclude";
  if (stage === "why_it_matters") return "question";
  return "explain";
}

/** Plan discourse from claim meaning — the only discourse path (no topic templates). */
export function planDiscourseFromMeaning(
  claim: UnderstoodClaim,
  topicRef: string,
  kind: FactKind,
  sectionId: string,
  seed = 0,
  isFirstAnswer = false,
  followOn?: UnderstoodClaim
): PlannedDiscourse {
  const stage = inferJourneyStage(claim, kind, sectionId);
  return {
    centralIdea: deriveCentralIdea(claim, sectionId, topicRef),
    stage,
    lead: sentenceFromClaim(claim, topicRef, seed, isFirstAnswer),
    support: supportForStage(stage, topicRef, claim, seed, followOn),
    voice: voiceForStageFixed(stage),
  };
}

/** Section-level journey glue — domain neutral, no meta about "paragraphs below". */
export function planSectionBridge(
  sectionId: string,
  topicLabel: string
): { lead: string; support: string; voice: NarrationVoice } {
  const bridges: Record<string, { lead: string; support: string }> = {
    overview: {
      lead: `${topicLabel} is clearer when you separate definition, purpose, and use.`,
      support: `Start with what it is, then why it exists, then where it shows up in practice.`,
    },
    why: {
      lead: `The reason ${topicLabel} exists is usually a concrete problem people already feel.`,
      support: `Name the pain first; the mechanism makes more sense afterward.`,
    },
    how: {
      lead: `${topicLabel} becomes usable once you can follow the mechanism one idea at a time.`,
      support: `Each step should answer what happens next—not introduce a new glossary dump.`,
    },
    keyConcepts: {
      lead: `These ideas interlock in practice—none of them lives in isolation.`,
      support: `Each piece builds on the previous one so nothing feels unexplained.`,
    },
    practical: {
      lead: `Applied ${topicLabel} is less about memorizing terms and more about matching ideas to real situations.`,
      support: `Connect each concept to a choice you might actually face.`,
    },
    mistakes: {
      lead: `Most setbacks trace back to skipped assumptions, not missing brilliance.`,
      support: `Recognizing these patterns early keeps projects cheaper and easier to explain.`,
    },
    summary: {
      lead: `If you remember one thing about ${topicLabel}, keep sight of the problem it solves—not the jargon around it.`,
      support: `Name one example from your experience, the core idea behind it, and one limitation worth watching.`,
    },
  };
  const b = bridges[sectionId] ?? bridges.overview;
  return {
    ...b,
    voice: sectionId === "summary" ? "conclude" : "explain",
  };
}
