/**
 * Phase 36: MDN Extractor
 * 
 * Extracts structured knowledge from MDN API responses
 * Implements existing IExtractor interface
 */

import type { IExtractor, ExtractorConfig, ExtractorResult, ExtractedKnowledge } from "../connectors/connector";

export class MDNExtractor implements IExtractor {
  readonly sourceType = "mdn";
  readonly contentType = "json";

  extract(data: string | object, config: ExtractorConfig): Promise<ExtractorResult> {
    return new Promise((resolve) => {
      try {
        const jsonData = typeof data === "string" ? JSON.parse(data) : data;
        
        if (!this.validateData(jsonData)) {
          resolve({
            success: false,
            knowledge: null,
            error: "Invalid MDN data format",
            warnings: [],
          });
          return;
        }

        const knowledge = this.extractKnowledge(jsonData);

        resolve({
          success: true,
          knowledge,
          error: null,
          warnings: [],
        });
      } catch (error: any) {
        resolve({
          success: false,
          knowledge: null,
          error: error.message,
          warnings: [],
        });
      }
    });
  }

  validateData(data: string | object): boolean {
    const jsonData = typeof data === "string" ? JSON.parse(data) : data;
    return jsonData && typeof jsonData === "object";
  }

  private extractKnowledge(data: any): ExtractedKnowledge {
    return {
      definitions: this.extractDefinitions(data),
      concepts: this.extractConcepts(data),
      procedures: this.extractProcedures(data),
      examples: this.extractExamples(data),
      comparisons: [],
      commands: [],
      formulae: [],
      warnings: this.extractWarnings(data),
      bestPractices: this.extractBestPractices(data),
      commonMistakes: [],
      faqs: [],
      references: this.extractReferences(data),
      metadata: {
        sourceUrl: data.url || "",
        extractedAt: new Date().toISOString(),
        confidence: 0.9,
      },
    };
  }

  private extractDefinitions(data: any): any[] {
    const definitions: any[] = [];
    
    if (data.title && data.summary) {
      definitions.push({
        id: `def_${Date.now()}`,
        term: data.title,
        definition: data.summary,
        context: data.url || "",
      });
    }

    return definitions;
  }

  private extractConcepts(data: any): any[] {
    const concepts: any[] = [];
    
    if (data.sections) {
      data.sections.forEach((section: any) => {
        if (section.title) {
          concepts.push({
            id: `concept_${Date.now()}_${Math.random()}`,
            name: section.title,
            description: section.content || "",
            relatedConcepts: [],
          });
        }
      });
    }

    return concepts;
  }

  private extractProcedures(data: any): any[] {
    const procedures: any[] = [];
    
    if (data.codeExamples) {
      data.codeExamples.forEach((example: any) => {
        if (example.description) {
          procedures.push({
            id: `proc_${Date.now()}_${Math.random()}`,
            name: example.description,
            steps: [example.code || ""],
            prerequisites: [],
            timeRequired: null,
          });
        }
      });
    }

    return procedures;
  }

  private extractExamples(data: any): any[] {
    const examples: any[] = [];
    
    if (data.codeExamples) {
      data.codeExamples.forEach((example: any) => {
        examples.push({
          id: `ex_${Date.now()}_${Math.random()}`,
          title: example.description || "Example",
          description: example.code || "",
          code: example.code || "",
        });
      });
    }

    return examples;
  }

  private extractWarnings(data: any): any[] {
    const warnings: any[] = [];
    
    if (data.warnings) {
      data.warnings.forEach((warning: any) => {
        warnings.push({
          id: `warn_${Date.now()}_${Math.random()}`,
          title: warning.title || "Warning",
          description: warning.content || "",
          severity: warning.severity || "medium",
        });
      });
    }

    return warnings;
  }

  private extractBestPractices(data: any): any[] {
    const bestPractices: any[] = [];
    
    if (data.bestPractices) {
      data.bestPractices.forEach((bp: any) => {
        bestPractices.push({
          id: `bp_${Date.now()}_${Math.random()}`,
          title: bp.title || "Best Practice",
          description: bp.content || "",
          context: "",
        });
      });
    }

    return bestPractices;
  }

  private extractReferences(data: any): any[] {
    const references: any[] = [];
    
    if (data.url) {
      references.push({
        id: `ref_${Date.now()}`,
        url: data.url,
        title: data.title || "MDN Documentation",
        type: "documentation",
      });
    }

    return references;
  }
}
