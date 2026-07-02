/**
 * Warning Plugin — renders warning facts as callout blocks
 */

import type { DocumentNode, PluginFact, PluginConfig } from "../types";
import { getSectionHeading, extractSubject } from "../templates";

export function renderWarningSection(facts: PluginFact[], config: PluginConfig): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const subject = extractSubject(config.slug);

  nodes.push({
    type: "heading",
    level: 2,
    text: getSectionHeading("warning", subject, config.sectionIndex, config.slug),
    anchor: "warnings",
  });

  const limited = config.maxFacts ? facts.slice(0, config.maxFacts) : facts;

  for (const fact of limited) {
    nodes.push({
      type: "callout",
      variant: "warning",
      title: null,
      children: [
        {
          type: "paragraph",
          children: [fact.statement],
        },
      ],
    });
  }

  return nodes;
}
