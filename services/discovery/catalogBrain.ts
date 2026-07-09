/**
 * Valendiro Catalog Brain — standalone engine entry (no legacy renderer/composer).
 */

import type { CatalogTopicTarget } from "./catalogHierarchy";
import { runBrainEngine } from "./catalogBrainEngine";
import { transformClaim, type BrainNotes } from "./catalogBrainUtils";

export type { BrainNotes } from "./catalogBrainUtils";
export { brainUnderstand, transformClaim } from "./catalogBrainUtils";
export { planBrainArticle, writeBrainArticle, runBrainEngine } from "./catalogBrainEngine";

export function brainParaphrase(sentence: string, topicTitle: string, _index: number): string {
  return transformClaim(sentence, topicTitle);
}

/** Pipeline entry — fuel in, quality article out (or null). */
export function runCatalogBrain(
  target: CatalogTopicTarget,
  fuelTexts: string[]
): {
  markdown: string;
  notes: BrainNotes;
  quality: NonNullable<ReturnType<typeof runBrainEngine>>["quality"];
  sectionsWritten: number;
} | null {
  const result = runBrainEngine(target, fuelTexts);
  if (!result) return null;

  return {
    markdown: result.markdown,
    notes: result.notes,
    quality: result.quality,
    sectionsWritten: result.sectionsWritten,
  };
}
