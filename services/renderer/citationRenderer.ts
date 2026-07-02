/**
 * Citation Renderer — Dedicated, Composable
 *
 * Resolves citation references in the Document Tree.
 * Citations are stored internally for verification, quality scoring, and future updates.
 * Sources section is suppressed from public UI to maintain clean reading experience.
 *
 * Pure function. No side effects.
 */

import type { DocumentNode, CitationInput, CitationBlockNode, CitationEntry } from "./types";

/**
 * Decorate a Document Tree with a bibliography section.
 * Returns a new array (does not mutate input).
 * 
 * NOTE: Sources section is suppressed from public UI for better reader experience.
 * Citations are stored internally in rendered_outputs table for verification and quality scoring.
 */
export function decorateWithCitations(
  tree: DocumentNode[],
  citations: CitationInput[],
  format: "html" | "markdown" | "json" = "html"
): DocumentNode[] {
  // Always suppress Sources section from public UI
  // Citations are stored internally for verification, quality scoring, and future updates
  return tree;
}
