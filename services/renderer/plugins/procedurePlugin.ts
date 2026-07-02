/**
 * Procedure Plugin — renders procedural facts as ordered lists
 */

import type { DocumentNode, PluginFact, PluginConfig } from "../types";
import { getSectionHeading, extractSubject } from "../templates";

export function renderProcedureSection(facts: PluginFact[], config: PluginConfig): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const subject = extractSubject(config.slug);

  nodes.push({
    type: "heading",
    level: 2,
    text: getSectionHeading("procedural", subject, config.sectionIndex, config.slug),
    anchor: "how-to",
  });

  const limited = config.maxFacts ? facts.slice(0, config.maxFacts) : facts;

  nodes.push({
    type: "list",
    ordered: true,
    items: limited.map((fact) => ({
      type: "list-item" as const,
      children: [fact.statement],
    })),
  });

  return nodes;
}
