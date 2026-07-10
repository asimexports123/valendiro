/**
 * Brain teaching — reason from the reader's next curiosity (no LLM).
 *
 * Not a new engine: replaces “next highest fact” with “what is the reader
 * wondering right now?” when ordering and composing body paragraphs.
 */

import type { ParagraphThesis } from "./brainReasoning";
import type { UnderstoodClaim } from "./brainUnderstanding";

export type CuriosityKind =
  | "what"
  | "why"
  | "how"
  | "parts"
  | "where"
  | "risk"
  | "compare"
  | "remember";

export interface ReaderCuriosity {
  kind: CuriosityKind;
  question: string;
}

/** Default curiosity the reader holds when entering a section. */
export function sectionEntryCuriosity(sectionId: string, topicLabel: string): ReaderCuriosity {
  switch (sectionId) {
    case "overview":
      return { kind: "what", question: `What is ${topicLabel}, in plain terms?` };
    case "why":
      return { kind: "why", question: `Why does ${topicLabel} exist at all?` };
    case "how":
      return { kind: "how", question: `How does ${topicLabel} actually work?` };
    case "keyConcepts":
      return { kind: "parts", question: `What pieces do I need before I can use ${topicLabel}?` };
    case "practical":
      return { kind: "where", question: `Where will I encounter ${topicLabel} in real life?` };
    case "mistakes":
      return { kind: "risk", question: `What do beginners get wrong about ${topicLabel}?` };
    case "summary":
      return { kind: "remember", question: `What should I keep about ${topicLabel}?` };
    default:
      return { kind: "what", question: `What should I understand next about ${topicLabel}?` };
  }
}

function claimText(c: UnderstoodClaim): string {
  return `${c.assertion || ""} ${c.sourceFact || ""} ${c.object || ""}`.toLowerCase();
}

/**
 * Prefer claims at/above this score when ranking.
 * Hard reject only when score is actively negative (wrong for the live question).
 * Claims already bucketed into a section must still teach — emptying a section
 * with good fuel is chipak-by-omission, not teaching.
 */
export const MIN_CURIOSITY_SCORE = 18;
/** Below this, the claim fights the reader's question — do not speak it. */
export const REJECT_CURIOSITY_SCORE = 0;

/** Score how well a claim answers a live reader curiosity (generic). */
export function scoreAnswersCuriosity(claim: UnderstoodClaim, curiosity: ReaderCuriosity): number {
  const t = claimText(claim);
  let score = 0;

  switch (curiosity.kind) {
    case "what":
      if (claim.relation === "defines") score += 50;
      if (/\b(is a|is an|are a|means|refers to|defined as)\b/i.test(t)) score += 30;
      if (/\b(such as|including|for example)\b/i.test(t)) score += 10;
      if (!/\b(is|are|means|refers)\b/i.test(t)) score -= 25;
      if (/\b(other|besides|also used|additionally|previous article)\b/i.test(t)) score -= 35;
      break;
    case "why":
      if (/\b(because|purpose|exists|solves|helps|enables|allows|matters|need|reason|benefit|designed to|protect|risk|cost)\b/i.test(t))
        score += 55;
      if (claim.relation === "defines" && /\b(helps|enables|allows)\b/i.test(t)) score += 20;
      break;
    case "how":
      if (claim.relation === "procedural") score += 45;
      if (/\b(works|process|mechanism|step|through|by |consists|composed|operates|first |then )\b/i.test(t))
        score += 40;
      break;
    case "parts":
      if (claim.relation === "defines" || claim.relation === "compares") score += 20;
      if (/\b(type|kind|category|component|part|element|concept|includes|consists)\b/i.test(t)) score += 35;
      if (/\b(is a|is an)\b/i.test(t)) score += 15;
      break;
    case "where":
      if (/\b(used in|used for|application|in practice|product|software|business|everyday|real.?world|example|such as)\b/i.test(t))
        score += 50;
      if (claim.relation === "procedural") score += 15;
      break;
    case "risk":
      if (claim.relation === "warns") score += 55;
      if (/\b(avoid|mistake|never|don't|risk|harm|fail|wrong|misunderstand|overlook)\b/i.test(t)) score += 40;
      break;
    case "compare":
      if (claim.relation === "compares") score += 50;
      if (/\b(unlike|versus|compared|rather than|instead of|difference)\b/i.test(t)) score += 35;
      break;
    case "remember":
      if (claim.relation === "defines") score += 25;
      if (/\b(essential|core|key|remember|main|overall)\b/i.test(t)) score += 20;
      score += 10;
      break;
  }

  // Penalize history/aside dumps when the reader asked for definition, motivation, or mechanism
  if (
    (curiosity.kind === "what" || curiosity.kind === "why" || curiosity.kind === "how") &&
    /\b(paper|proposal|according to|retrieved|ssrn|previous article|turing)\b/i.test(t)
  ) {
    score -= 45;
  }
  // Penalize jargon lists when the reader still needs why
  if (curiosity.kind === "why" && /\b(such as|including)\b/i.test(t) && !/\b(helps|solves|because|purpose)\b/i.test(t)) {
    score -= 25;
  }

  return score;
}

/**
 * After this paragraph is understood, what is the reader most likely wondering?
 * Generic — driven by section role + what was just taught, not topic templates.
 */
export function curiosityAfterThesis(
  thesis: ParagraphThesis,
  sectionId: string,
  topicLabel: string,
  index: number
): ReaderCuriosity {
  const claim = thesis.claims[0];
  const t = claim ? claimText(claim) : thesis.mainIdea.toLowerCase();

  if (sectionId === "overview") {
    if (index === 0) return { kind: "why", question: `Why should I care that ${topicLabel} is defined that way?` };
    if (/\b(is a|is an|means)\b/i.test(t))
      return { kind: "how", question: `How does ${topicLabel} do that in practice?` };
    return { kind: "where", question: `Where does this show up outside the definition?` };
  }
  if (sectionId === "why") {
    if (index === 0) return { kind: "how", question: `If that is why it exists, how does it work?` };
    return { kind: "where", question: `Who actually runs into this problem?` };
  }
  if (sectionId === "how") {
    if (index === 0) return { kind: "parts", question: `What are the moving pieces inside that mechanism?` };
    return { kind: "where", question: `Where do I see this mechanism in tools I already use?` };
  }
  if (sectionId === "keyConcepts") {
    return { kind: "parts", question: `What related idea do I need next to avoid confusion?` };
  }
  if (sectionId === "practical") {
    return { kind: "risk", question: `What goes wrong when people apply this carelessly?` };
  }
  if (sectionId === "mistakes") {
    return { kind: "remember", question: `What should I keep so I do not repeat that mistake?` };
  }
  return { kind: "remember", question: `What is the simplest way to remember this?` };
}

/**
 * Order theses so each step answers the curiosity left by the previous step.
 * Claims that cannot answer the live question are dropped — never least-bad filler.
 */
export function orderThesesForTeaching(
  theses: ParagraphThesis[],
  sectionId: string,
  topicLabel: string
): ParagraphThesis[] {
  if (theses.length === 0) return [];

  const entry = sectionEntryCuriosity(sectionId, topicLabel);
  if (theses.length === 1) {
    const claim = theses[0].claims[0];
    if (!claim) return [];
    // Only drop if the claim actively fights the section question
    if (scoreAnswersCuriosity(claim, entry) < REJECT_CURIOSITY_SCORE) return [];
    return [...theses];
  }

  const remaining = [...theses];
  const ordered: ParagraphThesis[] = [];
  let curiosity = entry;

  while (remaining.length > 0) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    let bestPreferredIdx = -1;
    let bestPreferredScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const claim = remaining[i].claims[0];
      if (!claim) continue;
      const s = scoreAnswersCuriosity(claim, curiosity);
      if (s < REJECT_CURIOSITY_SCORE) continue;
      const adjusted = s - i * 0.25;
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestIdx = i;
      }
      if (s >= MIN_CURIOSITY_SCORE && adjusted > bestPreferredScore) {
        bestPreferredScore = adjusted;
        bestPreferredIdx = i;
      }
    }
    // Prefer strong answers; if none left, take best non-hostile claim once, then stop
    const pickIdx = bestPreferredIdx >= 0 ? bestPreferredIdx : bestIdx;
    if (pickIdx < 0) break;
    const next = remaining.splice(pickIdx, 1)[0];
    ordered.push(next);
    if (bestPreferredIdx < 0) {
      // Weak leftover — keep one best answer for the section, do not dump the rest
      break;
    }
    curiosity = curiosityAfterThesis(next, sectionId, topicLabel, ordered.length - 1);
  }

  // Section already received theses from reasoning — never leave it empty if a usable claim exists
  if (ordered.length === 0) {
    const fallback = [...theses]
      .filter((t) => t.claims[0] && scoreAnswersCuriosity(t.claims[0]!, entry) >= REJECT_CURIOSITY_SCORE)
      .sort(
        (a, b) =>
          scoreAnswersCuriosity(b.claims[0]!, entry) - scoreAnswersCuriosity(a.claims[0]!, entry)
      )[0];
    if (fallback) return [fallback];
  }

  return ordered;
}

/**
 * Curiosity hook — short motivation before the answer when the paragraph
 * is not the section's first definition beat.
 */
export function curiosityHookFor(
  curiosity: ReaderCuriosity,
  topicLabel: string,
  seed: number
): string | null {
  // Short, plain — avoid “writing system” voice
  const hooks: Record<CuriosityKind, string[]> = {
    what: [],
    why: [
      `So why does ${topicLabel} exist?`,
      `The name is less important than the problem ${topicLabel} is meant to solve.`,
    ],
    how: [
      `Knowing why is not enough — how does ${topicLabel} work?`,
      `Next: what actually happens when ${topicLabel} is used.`,
    ],
    parts: [
      `One more piece helps before this becomes usable.`,
    ],
    where: [
      `Where does this show up outside the textbook definition?`,
    ],
    risk: [
      `What usually goes wrong for beginners?`,
    ],
    compare: [],
    remember: [],
  };
  const pool = hooks[curiosity.kind];
  if (!pool.length) return null;
  return pool[Math.abs(seed) % pool.length];
}

/** Soft forward seed — only when the prior paragraph earned it. */
export function forwardCuriositySeed(curiosity: ReaderCuriosity): string | null {
  switch (curiosity.kind) {
    case "why":
      return `That leaves a fair question: why does this matter in real decisions?`;
    case "how":
      return `The fair follow-up is how it produces that result.`;
    case "parts":
      return `Next comes the piece beginners usually lack.`;
    case "where":
      return `Look for where this already appears in tools people use.`;
    case "risk":
      return `Then ask what usually breaks first.`;
    default:
      return null;
  }
}

/**
 * Compose a teaching paragraph: optional curiosity → answer → optional forward seed.
 * Forward seed only if the answer actually served the entry curiosity.
 */
export function wrapTeachingParagraph(
  answerProse: string,
  opts: {
    entryCuriosity: ReaderCuriosity;
    exitCuriosity: ReaderCuriosity;
    index: number;
    seed: number;
    topicLabel: string;
    sectionId: string;
    answeredScore?: number;
  }
): string {
  const parts: string[] = [];
  const answeredWell = (opts.answeredScore ?? MIN_CURIOSITY_SCORE) >= MIN_CURIOSITY_SCORE;

  if (
    answeredWell &&
    opts.index === 0 &&
    (opts.sectionId === "why" ||
      opts.sectionId === "how" ||
      opts.sectionId === "practical" ||
      opts.sectionId === "mistakes")
  ) {
    const hook = curiosityHookFor(opts.entryCuriosity, opts.topicLabel, opts.seed);
    if (hook) parts.push(hook);
  }

  parts.push(answerProse.trim());

  if (
    answeredWell &&
    opts.index === 0 &&
    (opts.sectionId === "why" || opts.sectionId === "overview")
  ) {
    const seedLine = forwardCuriositySeed(opts.exitCuriosity);
    if (seedLine && !answerProse.includes(seedLine.slice(0, 18))) {
      const existing = `${parts.join(" ")}`.split(/(?<=[.!?])\s+/).length;
      if (existing < 4) parts.push(seedLine);
    }
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}
