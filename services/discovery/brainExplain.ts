/**
 * Brain explain — discourse composition (no LLM).
 *
 * Opening is its own editorial component: What → Why → Where → optional bridge.
 */

import type { BrainNotes } from "./catalogBrainUtils";
import { acronymFromLabel } from "./languageSystem/lexicon";
import { understandFact } from "./brainUnderstanding";
import type { UnderstoodClaim } from "./brainUnderstanding";
import type { ParagraphThesis } from "./brainReasoning";
import {
  composeDiscourseParagraph,
  composeSectionDiscourse,
} from "./brainDiscourse";
import type { FactKind } from "./languageSystem/types";
import {
  inferReaderFirstQuestion,
  selectPrimaryDefinitionFact,
  topIntroFacts,
} from "./brainReaderIntent";
import { voiceForThesis } from "./brainNarration";

const OPENING_BANNED =
  /^(this field|this topic|this guide|this piece|the sections|hold onto|one concrete case|everything below|keep that idea|if .+ buzzword)/i;

const OPENING_BANNED_ANYWHERE =
  /\b(this field|this topic|this guide|the sections below|the sections ahead|hold onto|buzzword soup|journey|paragraphs below|orient someone)\b/i;

function topicRef(label: string, index: number, seed: number): string {
  const refs: string[] = [label];
  const acronym = acronymFromLabel(label);
  if (acronym) refs.push(acronym);
  refs.push("it");
  if (index === 0) return label;
  return refs[((index - 1 + seed) % (refs.length - 1)) + 1] ?? label;
}

function kindForClaim(claim: UnderstoodClaim): FactKind {
  if (claim.relation === "defines") return "definition";
  if (claim.relation === "procedural") return "procedure";
  if (claim.relation === "warns") return "warning";
  if (claim.relation === "comparison") return "comparison";
  if (claim.relation === "measures") return "measurement";
  return "property";
}

function articleFor(noun: string): string {
  return /^[aeiou]/i.test(noun.trim()) ? "an" : "a";
}

function capitalize(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function trimPredicate(raw: string, max = 120): string {
  let p = raw
    .replace(/\[\d+[a-z]?\]/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\bdescribes\s+is\b/gi, "")
    .replace(/\bof\s+is\s+(a|an)\b/gi, "of $1")
    .trim();
  const cut = p.split(/(?<=[,;])\s+(?:which|who|where|when|while|although)\b/i)[0] ?? p;
  p = cut.split(/[.!?]/)[0]?.trim() ?? cut;
  if (p.length > max) {
    p = p.slice(0, max).replace(/\s+\S*$/, "").trim();
  }
  return p.replace(/[,:;]+$/, "").trim();
}

/**
 * Sentence 1 — direct “What is X?” using topic noun as subject (never “This field…”).
 * Accepts is/are/means and definitional verbs (helps/enables) when noun is subject.
 */
export function composeWhatIsSentence(fact: string, topicNoun: string): string | null {
  const cleaned = fact.replace(/\[\d+[a-z]?\]/gi, "").replace(/\s+/g, " ").trim();
  const m = cleaned.match(
    /\b(is|are|refers to|defined as|means|helps|enables|allows|lets)\s+(.+)$/i
  );
  if (!m) return null;

  let predicate = trimPredicate(m[2]);
  if (predicate.length < 12) return null;
  // Prefer positive “What is X?” — “is not …” is a caveat, not a definition
  if (/^not\b/i.test(predicate) && !/^not only\b/i.test(predicate)) return null;
  if (/\b(abbreviated|abbreviation|acronym|short for)\b/i.test(predicate)) return null;
  // Weak definition: only names a nickname / GoF-style aside
  if (/^frequently\s+(abbreviated|called|known)\b/i.test(predicate)) return null;
  // Drop empty “such as / including” tails left by fuel truncation
  predicate = predicate
    .replace(/,?\s*(?:such as|including|e\.g\.|for example)\s*$/i, "")
    .replace(/\bdescribes\s+is\b/gi, "")
    .replace(/\bof\s+is\s+(a|an|the)\b/gi, "of $1")
    .replace(/\bis\s+is\b/gi, "is")
    .replace(/\bmakes\s+is\s+the\b/gi, "makes the")
    .trim();
  if (predicate.length < 12) return null;
  if (/\b(such as|including|e\.g\.)\s*\.?$/i.test(predicate)) return null;
  if (/\b(and|or|the|a|an|to|of|for)\s*\.?$/i.test(predicate)) return null;

  const noun = topicNoun.trim();
  const acronym = /^[A-Z]{2,6}$/.test(noun);
  const pluralish = /s$/i.test(noun) && !/ss$/i.test(noun) && !acronym;
  const verbRaw = m[1].toLowerCase();
  const definitionalVerb = /^(helps|enables|allows|lets)$/i.test(verbRaw);
  const countableTail =
    /\b(pattern|fund|system|method|model|framework|protocol|language|element)$/i.test(noun);

  let subject: string;
  if (acronym) {
    subject = noun;
  } else if (pluralish) {
    subject = noun;
  } else if (definitionalVerb || !countableTail) {
    // “Health insurance helps…” / “Artificial Intelligence enables…”
    subject = noun;
  } else {
    subject = `${articleFor(noun)} ${noun}`;
  }

  const verb = pluralish && !acronym ? "are" : "is";
  const link = definitionalVerb
    ? verbRaw
    : /^(refers to|defined as|means)$/i.test(verbRaw)
      ? "is"
      : verb;

  let sentence = `${capitalize(subject)} ${link} ${predicate}`;
  if (!/[.!?]$/.test(sentence)) sentence += ".";
  if (OPENING_BANNED.test(sentence) || OPENING_BANNED_ANYWHERE.test(sentence)) return null;
  if (!/\b(is|are|helps|enables|allows|lets)\b/i.test(sentence)) return null;
  return sentence;
}

function composeWhySentence(fact: string | undefined, topicNoun: string): string {
  const finalize = (s: string): string | null => {
    const t = s.trim();
    if (t.length < 28) return null;
    if (/\b(and|or|the|a|an|to|of|for|with|in)\s*\.?$/i.test(t)) return null;
    if (/\b(such as|including|concerned with|focused on)\s*\.?$/i.test(t)) return null;
    return t.endsWith(".") ? t : `${t}.`;
  };

  if (fact) {
    const cleaned = fact.replace(/\[\d+[a-z]?\]/gi, "").replace(/\s+/g, " ").trim();
    const help = cleaned.match(/\b((?:helps|enables|allows|lets)\s+[^.]{10,110})/i);
    if (help?.[1] && !OPENING_BANNED_ANYWHERE.test(help[1])) {
      const clause = help[1].trim().replace(/\bdescribes\s+is\b/gi, "is");
      const built = finalize(`It matters because ${topicNoun} ${clause}`);
      if (built) return built;
    }
    const usedTo = cleaned.match(/\b(?:is|are)\s+(?:used|designed)\s+(?:to|for)\s+([^.]{12,100})/i);
    if (usedTo?.[1] && !OPENING_BANNED_ANYWHERE.test(usedTo[1])) {
      const built = finalize(
        `It matters because ${topicNoun} is used to ${trimPredicate(usedTo[1], 80)}`
      );
      if (built) return built;
    }
    if (/\b(benefit|important|matters|risk|cost|decision|protect|invest|build|learn)/i.test(cleaned)) {
      const bit = trimPredicate(cleaned, 90);
      if (bit.length > 24 && !OPENING_BANNED_ANYWHERE.test(bit) && !/\b(this field|this topic)\b/i.test(bit)) {
        const built = finalize(`It matters because ${bit.charAt(0).toLowerCase()}${bit.slice(1)}`);
        if (built) return built;
      }
    }
  }
  return `It matters because knowing what it is—and is not—changes real decisions.`;
}

function composeWhereSentence(fact: string | undefined): string {
  if (fact) {
    const m = fact.match(
      /(?:such as|including|e\.g\.|for example|used in|used for|appears in|shows up in|found in)\s+(.+?)(?:\.|;|$)/i
    );
    if (m?.[1]) {
      const items = trimPredicate(m[1], 90);
      if (items.length > 8 && !OPENING_BANNED_ANYWHERE.test(items)) {
        return `You encounter it in real products and situations—${items}.`;
      }
    }
    if (/\b(browser|website|app|hospital|clinic|portfolio|market|codebase|software|premium|doctor)\b/i.test(fact)) {
      const bit = trimPredicate(fact, 85);
      if (bit.length > 20 && !OPENING_BANNED_ANYWHERE.test(bit)) {
        return `You encounter it where people already work and decide—${bit.charAt(0).toLowerCase()}${bit.slice(1)}.`;
      }
    }
  }
  return `You encounter it in everyday products, tools, and decisions—often before the formal name sticks.`;
}

function composeBridgeSentence(topicNoun: string): string {
  return `With that frame, the rest of ${topicNoun} becomes easier to apply.`;
}

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (/^(ai|ml|ux|ui|api|sql|iot|kpi|roi|etf|401k|rsa)$/i.test(lower)) return word.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function summarizePracticalText(text: string): string {
  // Strip wiki/source artifacts before summarizing
  const cleaned = text
    .replace(/\[edit\]/gi, "")
    .replace(/\[\d+[a-z]?\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const first = cleaned.split(/(?<=[.!?])\s+/)[0]?.trim() ?? cleaned;
  const words = first.split(/\s+/).filter(Boolean);
  if (words.length <= 26) return first;
  return `${words.slice(0, 26).join(" ").replace(/[.,;:]+$/, "")}...`;
}

/**
 * Classify a practical fact into a human-readable scenario label.
 * Returns one of the approved scenario title templates.
 */
function classifyScenarioTitle(fact: string, seed: number): string {
  const lower = fact.toLowerCase();

  // Who benefits — people/roles performing an action
  if (/\b(investor|developer|student|patient|business|company|professional|team|anyone|person|people|user|owner|manager|beginner|learner|practitioner)\b/i.test(fact)) {
    return "Who Benefits";
  }
  // When to use — conditional/situational signal
  if (/\b(when|if you|whenever|in (situations?|cases?) (where|when|in which)|circumstance|scenario)\b/i.test(lower)) {
    return "When to Use";
  }
  // Typical workflow — step/process/procedure language
  if (/\b(step|first|then|next|finally|process|workflow|procedure|how to|start by|begin by|follow|sequence)\b/i.test(lower)) {
    return "Typical Workflow";
  }
  // Everyday example — common/daily/regular use
  if (/\b(everyday|daily|common|regular|typical|often|frequently|most people|widely|at home|ordinary)\b/i.test(lower)) {
    return "Everyday Example";
  }
  // Real-world example — explicit example language
  if (/\b(for example|for instance|such as|like|including|real.world|in practice|in real life)\b/i.test(lower)) {
    return "Real-World Example";
  }
  // Common scenario — application domain
  if (/\b(applied|application|deploy|implement|use case|scenario|context|setting|environment)\b/i.test(lower)) {
    return "Common Scenario";
  }
  // Fallback round-robin from approved set so adjacent cards stay varied
  const fallbacks = ["Common Use Case", "Real-World Example", "Everyday Example", "Common Scenario"];
  return fallbacks[seed % fallbacks.length];
}

function practicalTitleFromClaim(claim: UnderstoodClaim, topicLabel: void, seed: number): string {
  void topicLabel;
  const source = `${claim.assertion} ${claim.elaboration ?? ""} ${claim.sourceFact}`.replace(/\s+/g, " ").trim();
  return classifyScenarioTitle(source, seed);
}

/**
 * Derive a one-sentence situational body from a practical claim.
 * Prefers the full assertion sentence; falls back to the source fact.
 * Never dumps a raw comma-list — rejects facts that are taxonomy-only.
 */
function deriveCardBody(claim: UnderstoodClaim): string | null {
  const assertion = claim.assertion?.trim();
  const elaboration = claim.elaboration?.trim();
  const sourceFact = claim.sourceFact?.trim();

  // Reject taxonomy/list fragments — no verb means no situational value
  const isList = (s: string) =>
    /^[^.!?]{0,40}(,\s*[a-z][^,]{1,30}){4,}\.?\s*$/i.test(s) ||
    /^(small,|large,|basic,|type [a-z],)/i.test(s);

  // Build candidate from assertion or source
  const candidates = [
    assertion && !isList(assertion) ? assertion : null,
    elaboration && !isList(elaboration) ? elaboration : null,
    sourceFact && !isList(sourceFact) ? sourceFact : null,
  ].filter((s): s is string => Boolean(s) && s.length > 30);

  if (candidates.length === 0) return null;

  // Pick the best — prefer one with a verb and decent length
  const withVerb = candidates.find((s) =>
    /\b(is|are|helps|enables|allows|uses|makes|provides|reduces|works|gives)\b/i.test(s)
  );
  const best = withVerb ?? candidates[0];
  return summarizePracticalText(best);
}

export function composePracticalApplicationCard(
  thesis: ParagraphThesis,
  topicLabel: string,
  seed: number
): { title: string; summary: string } | null {
  const claim = thesis.claims[0];
  if (!claim) return null;
  const summary = deriveCardBody(claim);
  if (!summary) return null;
  const title = practicalTitleFromClaim(claim, topicLabel as unknown as void, seed);
  if (!title) return null;
  return { title, summary };
}

export interface OpeningQualityReport {
  openingQuality: number;
  definitionQuality: number;
  readerHook: number;
  humanEditorialScore: number;
  pass: boolean;
  reasons: string[];
  opening: string;
}

/** Score the opening paragraph — publish requires humanEditorialScore >= 95. */
export function scoreOpeningQuality(opening: string, topicNoun: string): OpeningQualityReport {
  const reasons: string[] = [];
  const text = opening.replace(/\*\*/g, "").trim();
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);

  let definitionQuality = 0;
  let readerHook = 0;
  let openingQuality = 0;

  const first = sentences[0] ?? "";
  const noun = topicNoun.trim();
  const nounRe = new RegExp(noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  if (OPENING_BANNED.test(first) || OPENING_BANNED_ANYWHERE.test(first)) {
    reasons.push("banned opener phrasing");
    definitionQuality = 0;
  } else if (
    nounRe.test(first.slice(0, 60)) &&
    /\b(is|are|helps|enables|allows|lets)\b/i.test(first) &&
    !/\bfundamentals is\b/i.test(first) &&
    !/^this\s/i.test(first)
  ) {
    definitionQuality = 100;
  } else if (/\b(is|are|helps|enables)\b/i.test(first) && nounRe.test(first)) {
    definitionQuality = 70;
    reasons.push("definition present but subject weak");
  } else {
    reasons.push("first sentence does not answer What is X?");
  }

  if (sentences.length >= 2 && !OPENING_BANNED_ANYWHERE.test(sentences[1])) {
    readerHook += 40;
  } else {
    reasons.push("missing why-it-matters sentence");
  }
  if (sentences.length >= 3 && !OPENING_BANNED_ANYWHERE.test(sentences[2])) {
    readerHook += 40;
  } else {
    reasons.push("missing where-you-encounter-it sentence");
  }
  if (sentences.length >= 2 && sentences.length <= 4) readerHook += 20;
  readerHook = Math.min(100, readerHook);

  openingQuality = Math.round(definitionQuality * 0.55 + readerHook * 0.45);
  if (/\b(such as|including)\s*\.?\s*$/i.test(first) || /\b(and|or|the|a|an)\s*\.?\s*$/i.test(first)) {
    definitionQuality = Math.min(definitionQuality, 40);
    reasons.push("truncated definition predicate");
  }
  if (OPENING_BANNED_ANYWHERE.test(text)) {
    openingQuality = Math.min(openingQuality, 60);
    reasons.push("meta/journey language in opening");
  }
  if (/\bdescribes\s+is\b|\bof\s+is\s+(a|an|the)\b|\bmakes\s+is\s+the\b|\bthis field\b/i.test(text)) {
    openingQuality = Math.min(openingQuality, 40);
    definitionQuality = Math.min(definitionQuality, 40);
    reasons.push("broken grammar in opening");
  }

  const humanEditorialScore = Math.round(
    definitionQuality * 0.5 + readerHook * 0.3 + openingQuality * 0.2
  );
  const pass = humanEditorialScore >= 95 && definitionQuality >= 95;

  return {
    openingQuality,
    definitionQuality,
    readerHook,
    humanEditorialScore,
    pass,
    reasons,
    opening: text,
  };
}

/**
 * Opening Composer — What is X? → why → where → optional bridge.
 * Generic only; no topic-specific templates.
 */
export function composeArticleOpening(
  notes: BrainNotes,
  topicLabel: string,
  displayName: string,
  slug = "",
  includeBridge = false
): { markdown: string; quality: OpeningQualityReport } | null {
  const intent = inferReaderFirstQuestion(displayName, topicLabel);
  const top = topIntroFacts(notes, topicLabel, {
    slug,
    primaryKeyword: topicLabel,
    displayName,
  });
  const primary =
    selectPrimaryDefinitionFact(notes, displayName, topicLabel, { slug }) ?? top.definition;
  if (!primary) return null;

  // Try primary first, then other definition-shaped facts if scoring fails
  const rankedDefs = [
    primary,
    ...notes.definitions.filter((d) => d !== primary),
    ...(notes.allFacts ?? []).filter(
      (f) => f !== primary && /\b(is|are|refers to|defined as|means)\b/i.test(f)
    ),
  ].slice(0, 12);

  let bestPass: { markdown: string; quality: OpeningQualityReport } | null = null;

  for (const fact of rankedDefs) {
    const what = composeWhatIsSentence(fact, intent.topicNoun);
    if (!what) continue;

    const why = composeWhySentence(top.secondary ?? top.application, intent.topicNoun);
    const where = composeWhereSentence(top.application ?? top.secondary);
    const parts = [what, why, where];
    if (includeBridge) parts.push(composeBridgeSentence(intent.topicNoun));

    const markdown = parts.join(" ");
    const quality = scoreOpeningQuality(markdown, intent.topicNoun);
    if (quality.pass) {
      bestPass = { markdown, quality };
      break;
    }
  }

  // Never publish a sub-95 opening
  return bestPass;
}

/** @deprecated — use composeArticleOpening */
export function explainIntro(
  notes: BrainNotes,
  topicLabel: string,
  displayName: string,
  seed = 0,
  slug = ""
): string {
  void seed;
  const composed = composeArticleOpening(notes, topicLabel, displayName, slug, false);
  return composed?.markdown ?? "";
}

/** One paragraph: one central idea, optionally developed with a related follow-on claim. */
export function explainParagraph(
  thesis: ParagraphThesis,
  topicLabel: string,
  seed: number
): string {
  if (thesis.claims.length === 0) return "";
  const claim = thesis.claims[0];
  const followOn = thesis.claims[1];
  const ref = topicRef(topicLabel, seed, seed);
  const sectionId = thesis.sectionId ?? "overview";
  const voice = voiceForThesis(thesis, sectionId, seed);
  return (
    composeDiscourseParagraph(
      claim,
      ref,
      kindForClaim(claim),
      seed,
      voice,
      sectionId,
      false,
      followOn
    ) ?? ""
  );
}

/** Section closer as coherent discourse. */
export function explainSectionClose(
  sectionId: string,
  topicLabel: string,
  seed: number
): string {
  return composeSectionDiscourse(sectionId, topicLabel, seed);
}

/** Single claim for numbered lists (if used). */
export function explainClaim(
  claim: UnderstoodClaim,
  topicRefStr: string,
  _question: string,
  index: number,
  seed = 0
): string {
  return (
    composeDiscourseParagraph(claim, topicRefStr, kindForClaim(claim), seed + index) ?? ""
  );
}
