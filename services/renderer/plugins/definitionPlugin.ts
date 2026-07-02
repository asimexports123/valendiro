/**
 * Definition Plugin — renders definition facts as introductory paragraphs
 */

import type { DocumentNode, PluginFact, PluginConfig } from "../types";
import { renderSentence, getSectionHeading, extractSubject } from "../templates";

export function renderDefinitionSection(facts: PluginFact[], config: PluginConfig): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const subject = extractSubject(config.slug);

  nodes.push({
    type: "heading",
    level: 2,
    text: getSectionHeading("definition", subject, config.sectionIndex, config.slug),
    anchor: "definition",
  });

  const limited = config.maxFacts ? facts.slice(0, config.maxFacts) : facts;

  // Group into paragraphs of 2-3 sentences
  let currentChildren: (string)[] = [];

  for (let i = 0; i < limited.length; i++) {
    const sentence = renderSentence(limited[i].statement, "definition", config.style, i, config.slug);
    currentChildren.push(sentence);

    if (currentChildren.length >= 3 || i === limited.length - 1) {
      nodes.push({
        type: "paragraph",
        children: [currentChildren.join(" ")],
      });
      currentChildren = [];
    }
  }

  return nodes;
}
