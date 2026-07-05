/**
 * JSON Extractor
 * 
 * Extracts structured knowledge from JSON data
 */

import type { IExtractor, ExtractorConfig, ExtractorResult, ExtractedKnowledge } from "../connectors/connector";

export class JsonExtractor implements IExtractor {
  readonly sourceType = "local-json";
  readonly contentType = "json";

  async extract(data: string | object, config: ExtractorConfig): Promise<ExtractorResult> {
    try {
      if (!this.validateData(data)) {
        return {
          success: false,
          knowledge: null,
          error: "Invalid JSON data",
          warnings: [],
        };
      }

      const jsonData = typeof data === "string" ? JSON.parse(data) : data;
      const knowledge = this.extractFromJson(jsonData);

      return {
        success: true,
        knowledge,
        error: null,
        warnings: [],
      };
    } catch (error: any) {
      return {
        success: false,
        knowledge: null,
        error: error.message,
        warnings: [],
      };
    }
  }

  validateData(data: string | object): boolean {
    try {
      if (typeof data === "string") {
        JSON.parse(data);
      }
      return true;
    } catch {
      return false;
    }
  }

  private extractFromJson(data: any): ExtractedKnowledge {
    const knowledge: ExtractedKnowledge = {
      definitions: [],
      concepts: [],
      procedures: [],
      examples: [],
      comparisons: [],
      commands: [],
      formulae: [],
      warnings: [],
      bestPractices: [],
      commonMistakes: [],
      faqs: [],
      references: [],
      metadata: {
        sourceUrl: "",
        extractedAt: new Date().toISOString(),
        confidence: 0.9,
      },
    };

    // Extract definitions
    if (data.definitions && Array.isArray(data.definitions)) {
      knowledge.definitions = data.definitions.map((d: any) => ({
        term: d.term || "",
        definition: d.definition || "",
        context: d.context,
      }));
    }

    // Extract concepts
    if (data.concepts && Array.isArray(data.concepts)) {
      knowledge.concepts = data.concepts.map((c: any) => ({
        name: c.name || "",
        description: c.description || "",
        category: c.category,
      }));
    }

    // Extract procedures
    if (data.procedures && Array.isArray(data.procedures)) {
      knowledge.procedures = data.procedures.map((p: any) => ({
        name: p.name || "",
        steps: Array.isArray(p.steps) ? p.steps : [],
        prerequisites: Array.isArray(p.prerequisites) ? p.prerequisites : [],
      }));
    }

    // Extract examples
    if (data.examples && Array.isArray(data.examples)) {
      knowledge.examples = data.examples.map((e: any) => ({
        title: e.title || "",
        description: e.description || "",
        code: e.code,
        output: e.output,
      }));
    }

    // Extract warnings
    if (data.warnings && Array.isArray(data.warnings)) {
      knowledge.warnings = data.warnings.map((w: any) => ({
        title: w.title || "",
        description: w.description || "",
        severity: w.severity || "medium",
      }));
    }

    // Extract best practices
    if (data.bestPractices && Array.isArray(data.bestPractices)) {
      knowledge.bestPractices = data.bestPractices.map((bp: any) => ({
        title: bp.title || "",
        description: bp.description || "",
      }));
    }

    // Extract common mistakes
    if (data.commonMistakes && Array.isArray(data.commonMistakes)) {
      knowledge.commonMistakes = data.commonMistakes.map((cm: any) => ({
        mistake: cm.mistake || "",
        correction: cm.correction || "",
      }));
    }

    // Extract FAQs
    if (data.faqs && Array.isArray(data.faqs)) {
      knowledge.faqs = data.faqs.map((f: any) => ({
        question: f.question || "",
        answer: f.answer || "",
      }));
    }

    return knowledge;
  }
}
