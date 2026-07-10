/**
 * Backward-compatible re-exports — prose craft now lives in languageSystem.
 */
export {
  type FactKind,
  FALLBACK_PHRASES as FALLBACK_KEYWORDS,
  getFallbackPhrases as getFallbackKeywords,
  joinKeywords,
  applySynonyms,
  shortTopicRef,
  polishParagraph,
  polishSection,
  realizeFromSlots as realizeSentence,
} from "./languageSystem";

export type { MeaningSlots } from "./languageSystem";

/** @deprecated Use RealizeSentenceInput via realizeFromSlots directly. */
export interface RealizeSentenceInput {
  kind: import("./languageSystem").FactKind;
  topicRef: string;
  keywords: string[];
  isPlural: boolean;
  numberPhrase?: string;
  seed?: number;
}
