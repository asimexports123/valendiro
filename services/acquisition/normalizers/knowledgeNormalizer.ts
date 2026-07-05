/**
 * Knowledge Normalizer
 * 
 * Produces canonical Knowledge Packages from extracted knowledge
 */

import type { INormalizer, NormalizerConfig, NormalizerResult, ExtractedKnowledge } from "../connectors/connector";
import type { KnowledgePackage } from "../../renderer/types";

export class KnowledgeNormalizer implements INormalizer {
  async normalize(knowledge: ExtractedKnowledge, config: NormalizerConfig): Promise<NormalizerResult> {
    try {
      if (!this.validateKnowledge(knowledge)) {
        return {
          success: false,
          knowledgePackage: null,
          error: "Invalid extracted knowledge",
          warnings: [],
        };
      }

      const knowledgePackage = this.buildKnowledgePackage(knowledge, config);

      return {
        success: true,
        knowledgePackage,
        error: null,
        warnings: this.generateWarnings(knowledge),
      };
    } catch (error: any) {
      return {
        success: false,
        knowledgePackage: null,
        error: error.message,
        warnings: [],
      };
    }
  }

  validateKnowledge(knowledge: ExtractedKnowledge): boolean {
    return !!(knowledge && knowledge.metadata);
  }

  private buildKnowledgePackage(knowledge: ExtractedKnowledge, config: NormalizerConfig): KnowledgePackage {
    const knowledgeHash = this.generateHash(knowledge);

    return {
      id: `kp_${config.topicSlug}`,
      slug: config.topicSlug,
      knowledgeHash,
      topicId: null,
      category: config.category,
      intent: config.intent,
      // Structured collections from extracted knowledge
      definitions: knowledge.definitions.map((d, idx) => ({
        id: `def_${idx}`,
        term: d.term,
        definition: d.definition,
        context: d.context,
        confidence: String(knowledge.metadata.confidence),
      })),
      concepts: knowledge.concepts.map((c, idx) => ({
        id: `concept_${idx}`,
        name: c.name,
        description: c.description,
        category: c.category,
        confidence: String(knowledge.metadata.confidence),
      })),
      procedures: knowledge.procedures.map((p, idx) => ({
        id: `proc_${idx}`,
        name: p.name,
        steps: p.steps,
        prerequisites: p.prerequisites,
        confidence: String(knowledge.metadata.confidence),
      })),
      examples: knowledge.examples.map((e, idx) => ({
        id: `example_${idx}`,
        title: e.title,
        description: e.description,
        code: e.code,
        output: e.output,
        confidence: String(knowledge.metadata.confidence),
      })),
      comparisons: knowledge.comparisons.map((c, idx) => ({
        id: `comp_${idx}`,
        items: c.items.map(item => ({ name: item, attributes: {} })),
        criteria: c.criteria,
        confidence: String(knowledge.metadata.confidence),
      })),
      commands: knowledge.commands.map((cmd, idx) => ({
        id: `cmd_${idx}`,
        command: cmd.command,
        description: cmd.description,
        parameters: cmd.parameters ? cmd.parameters.reduce((acc, p) => ({ ...acc, [p]: "" }), {} as Record<string, string>) : undefined,
        confidence: String(knowledge.metadata.confidence),
      })),
      formulae: knowledge.formulae.map((f, idx) => ({
        id: `formula_${idx}`,
        name: f.name,
        formula: f.formula,
        description: f.description,
        variables: f.variables ? f.variables.reduce((acc, v) => ({ ...acc, [v]: "" }), {} as Record<string, string>) : undefined,
        confidence: String(knowledge.metadata.confidence),
      })),
      warnings: knowledge.warnings.map((w, idx) => ({
        id: `warn_${idx}`,
        title: w.title,
        description: w.description,
        severity: w.severity,
      })),
      bestPractices: knowledge.bestPractices.map((bp, idx) => ({
        id: `bp_${idx}`,
        title: bp.title,
        description: bp.description,
        confidence: String(knowledge.metadata.confidence),
      })),
      commonMistakes: knowledge.commonMistakes.map((cm, idx) => ({
        id: `mistake_${idx}`,
        mistake: cm.mistake,
        correction: cm.correction,
        confidence: String(knowledge.metadata.confidence),
      })),
      faqs: knowledge.faqs.map((f, idx) => ({
        id: `faq_${idx}`,
        question: f.question,
        answer: f.answer,
        confidence: String(knowledge.metadata.confidence),
      })),
      references: knowledge.references.map((r, idx) => ({
        id: `ref_${idx}`,
        url: r.url,
        title: r.title,
        author: r.author,
        year: undefined,
      })),
      // Legacy facts (empty for new acquisitions)
      facts: [],
      citations: [],
      relationships: [],
      // Metadata
      metadata: {
        sourceCount: 1,
        factCount: knowledge.definitions.length + knowledge.concepts.length + knowledge.procedures.length,
        relationshipCount: 0,
        lastUpdated: new Date().toISOString(),
        lastVerified: null,
        confidence: knowledge.metadata.confidence >= 0.8 ? "high" : knowledge.metadata.confidence >= 0.5 ? "medium" : "low",
        sourceMetadata: {
          adapterName: "knowledge-connector",
          adapterVersion: "1.0.0",
          sourceType: "wikipedia" as any,
          retrievedAt: knowledge.metadata.extractedAt,
          processedAt: new Date().toISOString(),
          validationStatus: "valid",
        },
      },
    };
  }

  private generateHash(knowledge: ExtractedKnowledge): string {
    const data = JSON.stringify({
      definitions: knowledge.definitions,
      concepts: knowledge.concepts,
      procedures: knowledge.procedures,
      examples: knowledge.examples,
    });
    return Buffer.from(data).toString("base64").substring(0, 64);
  }

  private generateWarnings(knowledge: ExtractedKnowledge): string[] {
    const warnings: string[] = [];

    if (knowledge.definitions.length === 0) {
      warnings.push("No definitions extracted");
    }
    if (knowledge.concepts.length === 0) {
      warnings.push("No concepts extracted");
    }
    if (knowledge.procedures.length === 0) {
      warnings.push("No procedures extracted");
    }
    if (knowledge.examples.length === 0) {
      warnings.push("No examples extracted");
    }
    if (knowledge.metadata.confidence < 0.7) {
      warnings.push("Low confidence score");
    }

    return warnings;
  }
}
