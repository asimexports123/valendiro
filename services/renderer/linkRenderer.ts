/**
 * Internal Link Renderer
 *
 * Resolves Knowledge Relationships into internal links appended to the Document Tree.
 * Strong relationships get a "See Also" section. Weak ones go into "Related Topics".
 *
 * Pure function. No side effects.
 */

import type { DocumentNode, RelationshipInput, PluginFact, InternalLinkNode } from "./types";

/**
 * Decorate Document Tree with internal links derived from relationships.
 * Returns a new array (does not mutate input).
 */
export function decorateWithLinks(
  tree: DocumentNode[],
  relationships: RelationshipInput[],
  facts: PluginFact[],
  currentSlug: string,
  format: "html" | "markdown" | "json" = "html"
): DocumentNode[] {
  if (relationships.length === 0) return tree;
  // Suppress relationship dump from public markdown output
  if (format === "markdown") return tree;

  // Build a fact ID → statement map
  const factMap = new Map<string, string>();
  for (const f of facts) {
    factMap.set(f.id, f.statement);
  }

  // Group relationships by strength
  const strong: { text: string; targetSlug: string; type: string }[] = [];
  const moderate: { text: string; targetSlug: string; type: string }[] = [];

  for (const rel of relationships) {
    const text = rel.explanation ?? factMap.get(rel.targetId)?.slice(0, 60) ?? "Related topic";
    const entry = { text, targetSlug: currentSlug, type: rel.relationshipType };

    if (rel.strength === "strong") {
      strong.push(entry);
    } else {
      moderate.push(entry);
    }
  }

  const result = [...tree];

  // Add "See Also" for strong relationships (deduplicated)
  const uniqueStrong = deduplicateLinks(strong);
  if (uniqueStrong.length > 0) {
    result.push({
      type: "heading",
      level: 3,
      text: "See Also",
      anchor: "see-also",
    });

    result.push({
      type: "list",
      ordered: false,
      items: uniqueStrong.slice(0, 5).map((link) => ({
        type: "list-item" as const,
        children: [link.text],
      })),
    });
  }

  // Add "Related Topics" for moderate/weak
  const uniqueModerate = deduplicateLinks(moderate);
  if (uniqueModerate.length > 0 && uniqueStrong.length === 0) {
    result.push({
      type: "heading",
      level: 3,
      text: "Related Topics",
      anchor: "related-topics",
    });

    result.push({
      type: "list",
      ordered: false,
      items: uniqueModerate.slice(0, 8).map((link) => ({
        type: "list-item" as const,
        children: [link.text],
      })),
    });
  }

  return result;
}

function deduplicateLinks(links: { text: string; targetSlug: string; type: string }[]): typeof links {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = link.text.slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
