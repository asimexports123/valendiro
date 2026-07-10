export type { FactKind } from "./types";
export type { MeaningSlots } from "./semantics";
export type { SentencePlan } from "./grammar";
export type { ArticleSectionPlan } from "./rhetoric";

export {
  STOP_WORDS,
  SYNONYMS,
  FALLBACK_PHRASES,
  acronymFromLabel,
  isValidKeyword,
  pickSynonym,
  getFallbackPhrases,
  applySynonyms,
  joinKeywords,
} from "./lexicon";

export { parseFactToSlots } from "./semantics";
export type { ParseFactOptions } from "./semantics";

export { planSentence, realizePlan, realizeFromSlots, TEMPLATE_SETS } from "./grammar";

export {
  shortTopicRef,
  polishParagraph,
  polishSection,
  buildParagraph,
} from "./discourse";

export { planArticleSections, sectionHook } from "./rhetoric";
