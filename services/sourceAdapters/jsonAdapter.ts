/**
 * JSON Source Adapter - Phase 30.3
 * 
 * Converts JSON source data into canonical Knowledge Package format.
 */

import type {
  KnowledgePackage,
  SourceMetadata,
} from "../renderer/types";
import type {
  SourceAdapter,
  AdapterConfig,
  AdapterResult,
} from "./baseAdapter";

export class JSONAdapter implements SourceAdapter {
  getSourceType(): string {
    return "json";
  }

  validateSource(sourceData: any): boolean {
    // Check if source data is a valid JSON object or array
    if (typeof sourceData !== "object" || sourceData === null) {
      return false;
    }

    // Must have at least a title, slug, or content field
    const hasRequiredFields =
      sourceData.title ||
      sourceData.slug ||
      sourceData.content ||
      sourceData.definitions ||
      sourceData.concepts;

    return hasRequiredFields;
  }

  async adapt(sourceData: any, config: AdapterConfig): Promise<AdapterResult> {
    try {
      if (!this.validateSource(sourceData)) {
        return {
          success: false,
          knowledgePackage: null,
          error: "Invalid JSON source data",
          warnings: [],
        };
      }

      // Generate slug if not provided
      const slug = sourceData.slug || this.generateSlug(sourceData.title || "untitled");

      // Map JSON fields to structured collections
      const definitions = this.mapDefinitions(sourceData.definitions || []);
      const concepts = this.mapConcepts(sourceData.concepts || []);
      const procedures = this.mapProcedures(sourceData.procedures || []);
      const examples = this.mapExamples(sourceData.examples || []);
      const comparisons = this.mapComparisons(sourceData.comparisons || []);
      const commands = this.mapCommands(sourceData.commands || []);
      const formulae = this.mapFormulae(sourceData.formulae || []);
      const warnings = this.mapWarnings(sourceData.warnings || []);
      const bestPractices = this.mapBestPractices(sourceData.bestPractices || []);
      const commonMistakes = this.mapCommonMistakes(sourceData.commonMistakes || []);
      const faqs = this.mapFAQs(sourceData.faqs || []);
      const references = this.mapReferences(sourceData.references || []);

      // Create source metadata
      const sourceMetadata: SourceMetadata = {
        adapterName: config.adapterName,
        adapterVersion: config.adapterVersion,
        sourceType: "json",
        retrievedAt: sourceData.retrievedAt || new Date().toISOString(),
        processedAt: new Date().toISOString(),
        validationStatus: "valid",
      };

      // Assemble Knowledge Package
      const knowledgePackage: KnowledgePackage = {
        id: sourceData.id || this.generateId(),
        slug,
        knowledgeHash: this.generateHash(sourceData),
        topicId: sourceData.topicId || null,
        category: sourceData.category || "general",
        intent: this.inferIntent(sourceData.intent, sourceData.category),
        // Structured collections
        definitions,
        concepts,
        procedures,
        examples,
        comparisons,
        commands,
        formulae,
        warnings,
        bestPractices,
        commonMistakes,
        faqs,
        references,
        // Legacy fields for backward compatibility
        facts: this.mapLegacyFacts(sourceData.facts || []),
        citations: this.mapCitations(sourceData.citations || []),
        relationships: this.mapRelationships(sourceData.relationships || []),
        // Metadata
        metadata: {
          sourceCount: sourceData.sourceCount || 1,
          factCount: definitions.length + concepts.length + procedures.length,
          relationshipCount: sourceData.relationships?.length || 0,
          lastUpdated: sourceData.lastUpdated || new Date().toISOString(),
          lastVerified: sourceData.lastVerified || null,
          confidence: sourceData.confidence || "high",
          sourceMetadata,
        },
      };

      return {
        success: true,
        knowledgePackage,
        error: null,
        warnings: [],
      };
    } catch (error: any) {
      return {
        success: false,
        knowledgePackage: null,
        error: error.message || "Unknown error adapting JSON source",
        warnings: [],
      };
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  private generateId(): string {
    return `kp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHash(data: any): string {
    // Simple hash generation - in production use proper hashing
    return Buffer.from(JSON.stringify(data)).toString("base64").substring(0, 64);
  }

  private inferIntent(intent?: string, category?: string): "inform" | "educate" | "guide" | "decide" {
    if (intent && ["inform", "educate", "guide", "decide"].includes(intent)) {
      return intent as any;
    }

    if (category === "technology") return "educate";
    if (category === "travel") return "guide";
    if (category === "finance") return "decide";
    if (category === "health") return "educate";
    if (category === "business") return "inform";

    return "inform";
  }

  private mapDefinitions(definitions: any[]) {
    return definitions.map((def, idx) => ({
      id: def.id || this.generateId(),
      term: def.term || def.name || `Definition ${idx + 1}`,
      definition: def.definition || def.description || "",
      context: def.context,
      confidence: def.confidence || "high",
      sourceId: def.sourceId,
    }));
  }

  private mapConcepts(concepts: any[]) {
    return concepts.map((concept, idx) => ({
      id: concept.id || this.generateId(),
      name: concept.name || concept.term || `Concept ${idx + 1}`,
      description: concept.description || "",
      category: concept.category,
      confidence: concept.confidence || "high",
      sourceId: concept.sourceId,
    }));
  }

  private mapProcedures(procedures: any[]) {
    return procedures.map((proc, idx) => ({
      id: proc.id || this.generateId(),
      name: proc.name || proc.title || `Procedure ${idx + 1}`,
      steps: proc.steps || [proc.description || ""],
      prerequisites: proc.prerequisites || [],
      confidence: proc.confidence || "high",
      sourceId: proc.sourceId,
    }));
  }

  private mapExamples(examples: any[]) {
    return examples.map((ex, idx) => ({
      id: ex.id || this.generateId(),
      title: ex.title || `Example ${idx + 1}`,
      description: ex.description || "",
      code: ex.code,
      output: ex.output,
      confidence: ex.confidence || "high",
      sourceId: ex.sourceId,
    }));
  }

  private mapComparisons(comparisons: any[]) {
    return comparisons.map((comp, idx) => ({
      id: comp.id || this.generateId(),
      items: comp.items || [],
      criteria: comp.criteria || [],
      confidence: comp.confidence || "high",
      sourceId: comp.sourceId,
    }));
  }

  private mapCommands(commands: any[]) {
    return commands.map((cmd, idx) => ({
      id: cmd.id || this.generateId(),
      command: cmd.command || "",
      description: cmd.description || "",
      parameters: cmd.parameters || {},
      confidence: cmd.confidence || "high",
      sourceId: cmd.sourceId,
    }));
  }

  private mapFormulae(formulae: any[]) {
    return formulae.map((formula, idx) => ({
      id: formula.id || this.generateId(),
      name: formula.name || `Formula ${idx + 1}`,
      formula: formula.formula || "",
      description: formula.description || "",
      variables: formula.variables || {},
      confidence: formula.confidence || "high",
      sourceId: formula.sourceId,
    }));
  }

  private mapWarnings(warnings: any[]) {
    return warnings.map((warn, idx) => ({
      id: warn.id || this.generateId(),
      title: warn.title || `Warning ${idx + 1}`,
      description: warn.description || warn.message || "",
      severity: warn.severity || "medium",
      sourceId: warn.sourceId,
    }));
  }

  private mapBestPractices(bestPractices: any[]) {
    return bestPractices.map((bp, idx) => ({
      id: bp.id || this.generateId(),
      title: bp.title || `Best Practice ${idx + 1}`,
      description: bp.description || "",
      confidence: bp.confidence || "high",
      sourceId: bp.sourceId,
    }));
  }

  private mapCommonMistakes(mistakes: any[]) {
    return mistakes.map((mistake, idx) => ({
      id: mistake.id || this.generateId(),
      mistake: mistake.mistake || mistake.error || `Mistake ${idx + 1}`,
      correction: mistake.correction || mistake.solution || "",
      confidence: mistake.confidence || "high",
      sourceId: mistake.sourceId,
    }));
  }

  private mapFAQs(faqs: any[]) {
    return faqs.map((faq, idx) => ({
      id: faq.id || this.generateId(),
      question: faq.question || `Question ${idx + 1}`,
      answer: faq.answer || "",
      confidence: faq.confidence || "high",
      sourceId: faq.sourceId,
    }));
  }

  private mapReferences(references: any[]) {
    return references.map((ref, idx) => ({
      id: ref.id || this.generateId(),
      title: ref.title || `Reference ${idx + 1}`,
      url: ref.url,
      author: ref.author,
      year: ref.year,
    }));
  }

  private mapLegacyFacts(facts: any[]) {
    return facts.map((fact, idx) => ({
      id: fact.id || this.generateId(),
      statement: fact.statement || fact.text || "",
      factType: fact.factType || fact.type || "property",
      confidence: fact.confidence || "high",
      scope: fact.scope || "general",
      tags: fact.tags || [],
      domain: fact.domain || null,
    }));
  }

  private mapCitations(citations: any[]) {
    return citations.map((cit, idx) => ({
      id: cit.id || this.generateId(),
      sourceName: cit.sourceName || cit.name || `Source ${idx + 1}`,
      sourceUrl: cit.sourceUrl || cit.url || null,
      adapterName: cit.adapterName || "json",
      sourceAuthority: cit.sourceAuthority || cit.authority || "unknown",
      retrievedAt: cit.retrievedAt || new Date().toISOString(),
    }));
  }

  private mapRelationships(relationships: any[]) {
    return relationships.map((rel, idx) => ({
      id: rel.id || this.generateId(),
      sourceId: rel.sourceId,
      targetId: rel.targetId,
      relationshipType: rel.relationshipType || rel.type || "related",
      strength: rel.strength || "moderate",
      explanation: rel.explanation || null,
      bidirectional: rel.bidirectional || false,
    }));
  }
}
