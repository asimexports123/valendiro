/**
 * Citation Renderer — Dedicated, Composable
 *
 * Resolves citation references in the Document Tree and appends a bibliography block.
 * Operates on the tree after the main renderer has produced it.
 *
 * Pure function. No side effects.
 */

import type { DocumentNode, CitationInput, CitationBlockNode, CitationEntry } from "./types";

/**
 * Decorate a Document Tree with a bibliography section.
 * Returns a new array (does not mutate input).
 */
export function decorateWithCitations(
  tree: DocumentNode[],
  citations: CitationInput[]
): DocumentNode[] {
  if (citations.length === 0) return tree;

  // Build citation entries
  const entries: CitationEntry[] = citations.map((cit, index) => ({
    index: index + 1,
    sourceName: cit.sourceName,
    sourceUrl: cit.sourceUrl,
    authority: cit.sourceAuthority,
    retrievedAt: cit.retrievedAt,
  }));

  // Create the bibliography block
  const bibliographyHeading: DocumentNode = {
    type: "heading",
    level: 2,
    text: "Sources",
    anchor: "sources",
  };

  const citationBlock: CitationBlockNode = {
    type: "citation-block",
    entries,
  };

  // Append divider + bibliography at the end
  return [
    ...tree,
    { type: "divider" },
    bibliographyHeading,
    citationBlock,
  ];
}
