/**
 * Brain question — one reader question per paragraph (no LLM).
 * Fully generic: section role + claim relation + claim shape. No topic hacks.
 */

import type { UnderstoodClaim } from "./brainUnderstanding";
import type { FactKind } from "./languageSystem/types";
import { sectionEntryCuriosity } from "./brainTeaching";

function factHints(fact: string): string {
  return fact.toLowerCase();
}

/** Derive the single question this paragraph must answer. */
export function deriveQuestion(
  claim: UnderstoodClaim,
  sectionId: string,
  topicLabel: string,
  paragraphIndex: number
): string {
  const f = factHints(claim.sourceFact || claim.assertion);

  if (paragraphIndex === 0) {
    return sectionEntryCuriosity(sectionId, topicLabel).question;
  }

  if (sectionId === "why" || /\b(because|purpose|helps|enables|solves|matters)\b/i.test(f)) {
    if (/\b(who|people|users|investors|patients|developers|teams)\b/i.test(f)) {
      return `Who needs ${topicLabel}?`;
    }
    return `Why does ${topicLabel} matter here?`;
  }

  if (sectionId === "how" || claim.relation === "procedural") {
    if (/\b(first|step|then|process)\b/i.test(f)) {
      return `What happens next inside ${topicLabel}?`;
    }
    return `How does ${topicLabel} work at this step?`;
  }

  if (sectionId === "practical" || /\b(used in|application|example|such as)\b/i.test(f)) {
    return `Where does ${topicLabel} show up in real situations?`;
  }

  if (sectionId === "mistakes" || claim.relation === "warns") {
    return `What should you avoid with ${topicLabel}?`;
  }

  if (sectionId === "summary") {
    return `What should you remember about ${topicLabel}?`;
  }

  switch (claim.relation) {
    case "defines":
      return paragraphIndex === 0
        ? `What is ${topicLabel}?`
        : `What else defines ${topicLabel} clearly?`;
    case "warns":
      return `What goes wrong with ${topicLabel}?`;
    case "procedural":
      return `How do you work with ${topicLabel}?`;
    case "compares":
      return `How do ${topicLabel} options differ?`;
    case "measures":
      return `How is ${topicLabel} measured?`;
    case "requires":
      return `What does ${topicLabel} depend on?`;
    default:
      return `What should you understand next about ${topicLabel}?`;
  }
}

/** Closing question for a section — answered once after topic paragraphs. */
export function sectionCloseQuestion(sectionId: string, topicLabel: string): string {
  switch (sectionId) {
    case "overview":
      return `Why do these foundations matter for understanding ${topicLabel}?`;
    case "why":
      return `What problem does ${topicLabel} exist to solve?`;
    case "how":
      return `How do these steps fit together?`;
    case "keyConcepts":
      return `How do these concepts connect when you use ${topicLabel}?`;
    case "practical":
      return `What ties these applications together?`;
    case "mistakes":
      return `Why do these pitfalls keep appearing?`;
    case "summary":
      return `What is the main takeaway about ${topicLabel}?`;
    default:
      return `What connects these points about ${topicLabel}?`;
  }
}

/** Short answer to a section-close question (original prose). Prefer empty — teaching arc owns flow. */
export function answerSectionClose(
  sectionId: string,
  topicLabel: string,
  seed: number
): string {
  // Meta “these foundations show…” closers feel like encyclopedia glue — keep minimal
  const answers: Record<string, string[]> = {
    overview: [
      `Keep the definition short enough to reuse: what ${topicLabel} is, and what it is not.`,
    ],
    why: [
      `If you can name the problem ${topicLabel} removes, the rest of the explanation has a reason to exist.`,
    ],
    how: [
      `When you can narrate the mechanism in order, the labels stop feeling arbitrary.`,
    ],
    keyConcepts: [
      `Each concept earns its place only if it prevents a real confusion later.`,
    ],
    practical: [
      `A good application test: can you point to a real decision where ${topicLabel} changes the choice?`,
    ],
    mistakes: [
      `Most setbacks come from skipped assumptions — catch those before the fancy details.`,
    ],
    summary: [
      `If you can explain the definition, one real use, and one limit, you understand enough to go deeper.`,
    ],
  };
  const pool = answers[sectionId] ?? answers.overview;
  return pool[seed % pool.length];
}

export function introQuestions(
  topicLabel: string,
  displayName: string
): Array<{ question: string; slot: "def0" | "def1" | "prop0" }> {
  return [
    { question: `What is ${displayName}?`, slot: "def0" },
    { question: `Why does ${topicLabel} matter?`, slot: "def1" },
    { question: `Where do people encounter ${topicLabel}?`, slot: "prop0" },
  ];
}

export function kindForSlot(slot: "def0" | "def1" | "prop0"): FactKind {
  return slot === "prop0" ? "property" : "definition";
}
