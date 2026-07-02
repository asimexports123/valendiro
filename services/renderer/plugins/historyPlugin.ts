/**
 * History Plugin — renders historical facts as chronological paragraphs
 */

import type { DocumentNode, PluginFact, PluginConfig } from "../types";
import { renderSentence, getSectionHeading, extractSubject } from "../templates";

export function renderHistorySection(facts: PluginFact[], config: PluginConfig): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const subject = extractSubject(config.slug);

  nodes.push({
    type: "heading",
    level: 2,
    text: getSectionHeading("historical", subject, config.sectionIndex, config.slug),
    anchor: "history",
  });

  const limited = config.maxFacts ? facts.slice(0, config.maxFacts) : facts;

  // Historical facts as a flowing paragraph
  const sentences = limited.map((fact, i) =>
    renderSentence(fact.statement, "historical", config.style, i, config.slug)
  );

  nodes.push({
    type: "paragraph",
    children: [sentences.join(" ")],
  });

  return nodes;
}
