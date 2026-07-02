/**
 * FAQ Renderer
 *
 * Produces a Document Tree as Question → Answer pairs.
 * Each fact becomes a question derived from its type + a direct answer.
 *
 * Pure function. No side effects. Deterministic.
 */

import type {
  DocumentNode,
  PluginFact,
  RendererConfig,
  RenderDecision,
  CitationInput,
  RelationshipInput,
  RenderStrategy,
} from "../types";
import { extractSubject, selectVariant, hashCode } from "../templates";

export const FAQ_VERSION = "1.0.0";

export const faqStrategy: RenderStrategy = {
  name: "faq",
  version: FAQ_VERSION,
  render: renderFAQ,
};

// Question generators per fact type
const QUESTION_TEMPLATES: Record<string, string[]> = {
  definition: [
    "What is {subject}?",
    "How is {subject} defined?",
    "What does {subject} refer to?",
  ],
  property: [
    "What are the key features of {subject}?",
    "What does {subject} offer?",
    "What are the characteristics of {subject}?",
  ],
  historical: [
    "What is the history of {subject}?",
    "When was {subject} created?",
    "What is the background of {subject}?",
  ],
  procedural: [
    "How do you use {subject}?",
    "What are the steps for {subject}?",
    "How to get started with {subject}?",
  ],
  warning: [
    "What should you avoid with {subject}?",
    "What are common mistakes with {subject}?",
    "What are the pitfalls of {subject}?",
  ],
  comparison: [
    "How does {subject} compare?",
    "What makes {subject} different?",
  ],
  measurement: [
    "What are the key statistics for {subject}?",
    "What are the numbers behind {subject}?",
  ],
  causal: [
    "What does {subject} cause?",
    "What are the effects of {subject}?",
  ],
  rule: [
    "What are the rules for {subject}?",
    "What are the best practices for {subject}?",
  ],
};

function generateQuestion(factType: string, subject: string, index: number, slug: string): string {
  const templates = QUESTION_TEMPLATES[factType] ?? [`What about ${subject}?`];
  return selectVariant(templates, index, slug).replace("{subject}", subject);
}

export function renderFAQ(
  facts: PluginFact[],
  citations: CitationInput[],
  relationships: RelationshipInput[],
  config: RendererConfig,
  decision: RenderDecision
): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const subject = extractSubject(config.slug);

  // Title
  nodes.push({
    type: "heading",
    level: 1,
    text: `${subject}: Frequently Asked Questions`,
    anchor: "title",
  });

  // Intro
  nodes.push({
    type: "paragraph",
    children: [`Here are the most common questions about ${subject}, answered with verified knowledge.`],
  });

  // Group facts by type, then generate Q&A per group
  const factsByType: Record<string, PluginFact[]> = {};
  for (const fact of facts) {
    if (!factsByType[fact.factType]) factsByType[fact.factType] = [];
    factsByType[fact.factType].push(fact);
  }

  // Order by block priority
  const orderedTypes = decision.blockOrder
    .filter((bp) => factsByType[bp.sectionType] && factsByType[bp.sectionType].length > 0)
    .sort((a, b) => a.priority - b.priority)
    .map((bp) => bp.sectionType);

  // Add any types not in block order
  for (const ft of Object.keys(factsByType)) {
    if (!orderedTypes.includes(ft)) orderedTypes.push(ft);
  }

  let questionIndex = 0;
  for (const factType of orderedTypes) {
    const typeFacts = factsByType[factType];
    if (!typeFacts || typeFacts.length === 0) continue;

    // Question heading
    const question = generateQuestion(factType, subject, questionIndex, config.slug);
    nodes.push({
      type: "heading",
      level: 2,
      text: question,
      anchor: `faq-${questionIndex}`,
    });

    // Answer: combine facts into a paragraph or list
    if (typeFacts.length <= 2) {
      // Short answer as paragraph
      nodes.push({
        type: "paragraph",
        children: [typeFacts.map((f) => f.statement).join(". ") + "."],
      });
    } else {
      // Longer answer as list
      nodes.push({
        type: "list",
        ordered: false,
        items: typeFacts.map((f) => ({
          type: "list-item" as const,
          children: [f.statement],
        })),
      });
    }

    questionIndex++;
  }

  return nodes;
}
