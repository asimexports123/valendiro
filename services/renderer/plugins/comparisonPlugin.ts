/**
 * Comparison Plugin — renders comparison facts as a table or prose
 */

import type { DocumentNode, PluginFact, PluginConfig } from "../types";
import { renderSentence, getSectionHeading, extractSubject } from "../templates";

export function renderComparisonSection(facts: PluginFact[], config: PluginConfig): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const subject = extractSubject(config.slug);

  nodes.push({
    type: "heading",
    level: 2,
    text: getSectionHeading("comparison", subject, config.sectionIndex, config.slug),
    anchor: "comparisons",
  });

  const limited = config.maxFacts ? facts.slice(0, config.maxFacts) : facts;

  // Render as prose paragraphs
  const sentences = limited.map((fact, i) =>
    renderSentence(fact.statement, "comparison", config.style, i, config.slug)
  );

  nodes.push({
    type: "paragraph",
    children: [sentences.join(" ")],
  });

  return nodes;
}
