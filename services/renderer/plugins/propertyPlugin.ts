/**
 * Property Plugin — renders property facts as bullet lists
 */

import type { DocumentNode, PluginFact, PluginConfig } from "../types";
import { getSectionHeading, extractSubject } from "../templates";

export function renderPropertySection(facts: PluginFact[], config: PluginConfig): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const subject = extractSubject(config.slug);

  nodes.push({
    type: "heading",
    level: 2,
    text: getSectionHeading("property", subject, config.sectionIndex, config.slug),
    anchor: "properties",
  });

  const limited = config.maxFacts ? facts.slice(0, config.maxFacts) : facts;

  nodes.push({
    type: "list",
    ordered: false,
    items: limited.map((fact) => ({
      type: "list-item" as const,
      children: [fact.statement],
    })),
  });

  return nodes;
}
