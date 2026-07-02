/**
 * Property Plugin — renders property facts as explanatory prose paragraphs
 *
 * Facts are grouped into paragraphs of 2-3, each with a connector phrase
 * that explains significance, then a follow-on explanation sentence that
 * tells the reader *why* the property matters in practice.
 */

import type { DocumentNode, PluginFact, PluginConfig } from "../types";
import { getSectionHeading, extractSubject, selectVariant, hashCode } from "../templates";

// Lead-in connectors that introduce each property in prose
const PROPERTY_CONNECTORS = [
  "One of the defining characteristics is that",
  "A key property to understand is that",
  "Central to how this works is the fact that",
  "Worth understanding clearly is that",
  "An important aspect is that",
  "What makes this particularly notable is that",
  "A fundamental trait is that",
  "Practically speaking,",
  "From a technical standpoint,",
  "In real-world use,",
];

// Follow-on sentences that explain *why* a property matters
const WHY_TEMPLATES = [
  "This matters because it directly affects how you work with the concept in practice.",
  "Understanding this helps avoid common misconceptions when applying the knowledge.",
  "This distinction becomes important when you start working with real examples.",
  "Knowing this upfront saves significant time when encountering it in the wild.",
  "This characteristic shapes most of the practical decisions you will make.",
  "Grasping this early makes the rest of the topic much easier to follow.",
  "This is one of those properties that separates beginners from practitioners.",
  "It is this quality that gives the concept much of its practical value.",
  "These characteristics work together to provide a complete understanding.",
  "This feature is essential for mastering the topic effectively.",
];

// Paragraph bridge phrases that connect two facts in one paragraph
const BRIDGES = [
  "Closely related to this,",
  "Building on that point,",
  "Equally important is the fact that",
  "Alongside this,",
  "This connects directly to another key property:",
  "On the same thread,",
];

function connector(i: number, slug: string): string {
  const seed = hashCode(`${slug}:prop-conn:${i}`);
  return PROPERTY_CONNECTORS[seed % PROPERTY_CONNECTORS.length];
}

function why(i: number, slug: string): string {
  const seed = hashCode(`${slug}:prop-why:${i}`);
  return WHY_TEMPLATES[seed % WHY_TEMPLATES.length];
}

function bridge(i: number, slug: string): string {
  const seed = hashCode(`${slug}:prop-bridge:${i}`);
  return BRIDGES[seed % BRIDGES.length];
}

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

  // Group into paragraphs of 2-3 facts
  const PARA_SIZE = 3;
  for (let i = 0; i < limited.length; i += PARA_SIZE) {
    const group = limited.slice(i, i + PARA_SIZE);
    const sentences: string[] = [];

    group.forEach((fact, j) => {
      const globalIdx = i + j;
      const stmt = fact.statement.replace(/\.$/, ""); // strip trailing period

      if (j === 0) {
        // First fact in paragraph — full connector + statement + why
        sentences.push(`${connector(globalIdx, config.slug)} ${stmt.charAt(0).toLowerCase() + stmt.slice(1)}. ${why(globalIdx, config.slug)}`);
      } else {
        // Subsequent facts in same paragraph — bridge + statement
        const br = bridge(globalIdx, config.slug);
        const lower = stmt.charAt(0).toLowerCase() + stmt.slice(1);
        // Every other subsequent fact also adds a brief why-clause
        if (j % 2 === 0 || group.length === 1) {
          sentences.push(`${br} ${lower}.`);
        } else {
          sentences.push(`${br} ${lower}.`);
        }
      }
    });

    nodes.push({
      type: "paragraph",
      children: [sentences.join(" ")],
    });
  }

  return nodes;
}
