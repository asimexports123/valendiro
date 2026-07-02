/**
 * Measurement Plugin — renders measurement/statistics facts
 */

import type { DocumentNode, PluginFact, PluginConfig } from "../types";
import { getSectionHeading, extractSubject } from "../templates";

export function renderMeasurementSection(facts: PluginFact[], config: PluginConfig): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const subject = extractSubject(config.slug);

  nodes.push({
    type: "heading",
    level: 2,
    text: getSectionHeading("measurement", subject, config.sectionIndex, config.slug),
    anchor: "statistics",
  });

  const limited = config.maxFacts ? facts.slice(0, config.maxFacts) : facts;

  nodes.push({
    type: "list",
    ordered: false,
    items: limited.map((fact) => ({
      type: "list-item" as const,
      children: [{ type: "bold" as const, text: fact.statement }],
    })),
  });

  return nodes;
}
