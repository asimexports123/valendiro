/**
 * Integration Adapter - Knowledge Package to Facts Conversion
 * 
 * Converts canonical Knowledge Package to the expected PluginFact[] format
 * required by the Knowledge Authoring Engine for backward compatibility.
 * 
 * This is an integration layer only - does not modify the Knowledge Package schema.
 */

import type { KnowledgePackage, PluginFact } from "../types";

/**
 * Convert Knowledge Package to PluginFact[] format for Knowledge Authoring Engine
 * This maintains backward compatibility while using the canonical Knowledge Package as the source of truth
 */
export function convertKnowledgePackageToFacts(knowledgePackage: KnowledgePackage): PluginFact[] {
  const facts: PluginFact[] = [];

  // Convert definitions to facts
  knowledgePackage.definitions.forEach(def => {
    facts.push({
      id: def.id,
      statement: `${def.term}: ${def.definition}`,
      factType: "definition",
      confidence: def.confidence,
      scope: "global",
      tags: ["definition", def.term.toLowerCase()],
      domain: knowledgePackage.category,
    });
  });

  // Convert concepts to facts
  knowledgePackage.concepts.forEach(concept => {
    facts.push({
      id: concept.id,
      statement: `${concept.name}: ${concept.description}`,
      factType: "concept",
      confidence: concept.confidence,
      scope: "global",
      tags: ["concept", concept.name.toLowerCase()],
      domain: knowledgePackage.category,
    });
  });

  // Convert procedures to facts
  knowledgePackage.procedures.forEach(procedure => {
    const procedureText = `${procedure.name}: ${procedure.steps.join(" → ")}`;
    facts.push({
      id: procedure.id,
      statement: procedureText,
      factType: "procedure",
      confidence: procedure.confidence,
      scope: "global",
      tags: ["procedure", procedure.name.toLowerCase()],
      domain: knowledgePackage.category,
    });
  });

  // Convert examples to facts
  knowledgePackage.examples.forEach(example => {
    const exampleText = `${example.title}: ${example.description} ${example.code || ""}`;
    facts.push({
      id: example.id,
      statement: exampleText,
      factType: "example",
      confidence: example.confidence,
      scope: "global",
      tags: ["example", example.title.toLowerCase()],
      domain: knowledgePackage.category,
    });
  });

  // Convert warnings to facts
  knowledgePackage.warnings.forEach(warning => {
    facts.push({
      id: warning.id,
      statement: `${warning.title}: ${warning.description}`,
      factType: "warning",
      confidence: "high",
      scope: "global",
      tags: ["warning", warning.title.toLowerCase()],
      domain: knowledgePackage.category,
    });
  });

  // Convert best practices to facts
  knowledgePackage.bestPractices.forEach(practice => {
    facts.push({
      id: practice.id,
      statement: `${practice.title}: ${practice.description}`,
      factType: "best-practice",
      confidence: practice.confidence,
      scope: "global",
      tags: ["best-practice", practice.title.toLowerCase()],
      domain: knowledgePackage.category,
    });
  });

  // Convert common mistakes to facts
  knowledgePackage.commonMistakes.forEach(mistake => {
    const mistakeText = `Common mistake: ${mistake.mistake}. Correction: ${mistake.correction}`;
    facts.push({
      id: mistake.id,
      statement: mistakeText,
      factType: "common-mistake",
      confidence: mistake.confidence,
      scope: "global",
      tags: ["common-mistake"],
      domain: knowledgePackage.category,
    });
  });

  // Convert FAQs to facts
  knowledgePackage.faqs.forEach(faq => {
    facts.push({
      id: faq.id,
      statement: `Q: ${faq.question} A: ${faq.answer}`,
      factType: "faq",
      confidence: faq.confidence,
      scope: "global",
      tags: ["faq"],
      domain: knowledgePackage.category,
    });
  });

  return facts;
}

/**
 * Create AuthoringContext with proper facts array from Knowledge Package
 */
export function createAuthoringContextFromKnowledgePackage(
  knowledgePackage: KnowledgePackage,
  topic: string,
  subject: string,
  category: string,
  intent: "inform" | "educate" | "guide" | "decide",
  complexity: "beginner" | "intermediate" | "advanced"
) {
  const facts = convertKnowledgePackageToFacts(knowledgePackage);

  return {
    topic,
    subject,
    category,
    intent,
    complexity,
    knowledgePackage,
    facts,
  };
}
