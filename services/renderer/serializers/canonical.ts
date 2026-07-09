/**
 * Canonical Projection Format — single reader-facing contract.
 *
 * Knowledge Package → Projection Engine → markdown (this module)
 * → Publication → topic_translations.content → MarkdownContent
 *
 * document_tree retains full composition structure for diagnostics;
 * rendered_outputs.content and topic_translations.content use this serializer only.
 */

import type { DocumentNode, OutputFormat } from "../types";
import { serializeToMarkdown } from "./markdown";

/** The only format published to topic pages. */
export const CANONICAL_OUTPUT_FORMAT: OutputFormat = "markdown";

const READER_EXCLUDED_TYPES = new Set([
  "metadata",
  "missing-knowledge",
  "commercial-placeholder",
]);

/** Nodes excluded from reader-facing serialization. */
export function prepareReaderTree(tree: DocumentNode[]): DocumentNode[] {
  return tree.filter((node) => {
    if (READER_EXCLUDED_TYPES.has(node.type)) return false;
    // Topic page hero already renders H1 from topic_translations.title
    if (node.type === "heading" && node.level === 1) return false;
    return true;
  });
}

/** Serialize document tree to canonical markdown for storage and publication. */
export function serializeCanonicalProjection(tree: DocumentNode[]): string {
  return serializeToMarkdown(prepareReaderTree(tree)).trim();
}

/** Reject leaked internal or HTML artifacts in published content. */
export function validateCanonicalContent(content: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!content || content.trim().length === 0) issues.push("empty content");
  if (/<!--[\s\S]*?-->/.test(content)) issues.push("HTML comment metadata leak");
  if (/<!DOCTYPE/i.test(content)) issues.push("HTML document leak");
  if (/<article[\s>]/i.test(content)) issues.push("HTML article wrapper leak");
  if (/^\s*<h[1-6]/im.test(content)) issues.push("raw HTML heading leak");
  return { valid: issues.length === 0, issues };
}
