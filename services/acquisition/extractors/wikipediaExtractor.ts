/**
 * Wikipedia Extractor
 * 
 * Extracts structured knowledge from Wikipedia API response
 */

import type { IExtractor, ExtractorConfig, ExtractorResult, ExtractedKnowledge } from "../connectors/connector";

export class WikipediaExtractor implements IExtractor {
  readonly sourceType = "wikipedia";
  readonly contentType = "json";

  async extract(data: string | object, config: ExtractorConfig): Promise<ExtractorResult> {
    try {
      if (!this.validateData(data)) {
        return {
          success: false,
          knowledge: null,
          error: "Invalid Wikipedia API response",
          warnings: [],
        };
      }

      const jsonData = typeof data === "string" ? JSON.parse(data) : data;
      const knowledge = this.extractFromWikipedia(jsonData);

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
      const jsonData = typeof data === "string" ? JSON.parse(data) : data;
      return !!(jsonData.query && jsonData.query.pages);
    } catch {
      return false;
    }
  }

  private extractFromWikipedia(data: any): ExtractedKnowledge {
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
        confidence: 0.7, // Wikipedia is authoritative but community-edited
      },
    };

    if (!data.query || !data.query.pages) {
      return knowledge;
    }

    const pages = data.query.pages;
    const page = Object.values(pages)[0] as any;

    if (!page) {
      return knowledge;
    }

    // Extract the main text
    const text = page.extract || "";

    // Extract source URL
    knowledge.metadata.sourceUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title || "")}`;

    // Parse text for definitions (sentences with "is", "are", "refers to")
    knowledge.definitions = this.extractDefinitions(text);

    // Parse text for concepts (capitalized terms, technical terms)
    knowledge.concepts = this.extractConcepts(text);

    // Parse text for procedures (numbered lists, steps)
    knowledge.procedures = this.extractProcedures(text);

    // Parse text for examples (e.g., "For example", "Example:")
    knowledge.examples = this.extractExamples(text);

    // Parse text for warnings (e.g., "Warning", "Caution", "Note")
    knowledge.warnings = this.extractWarnings(text);

    return knowledge;
  }

  private extractDefinitions(text: string): Array<{ term: string; definition: string }> {
    const definitions: Array<{ term: string; definition: string }> = [];
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 200) {
        if (trimmed.match(/\b(is|are|refers to|refers|means|can be defined as)\b/i)) {
          const words = trimmed.split(" ");
          const term = words.slice(0, Math.min(5, words.length)).join(" ");
          definitions.push({
            term: term,
            definition: trimmed,
          });
        }
      }
    }

    return definitions.slice(0, 10); // Limit to 10 definitions
  }

  private extractConcepts(text: string): Array<{ name: string; description: string }> {
    const concepts: Array<{ name: string; description: string }> = [];
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 150) {
        // Find capitalized terms
        const capitalizedTerms = trimmed.match(/\b[A-Z][a-z]+\b/g);
        if (capitalizedTerms && capitalizedTerms.length > 0) {
          concepts.push({
            name: capitalizedTerms[0],
            description: trimmed,
          });
        }
      }
    }

    return concepts.slice(0, 10); // Limit to 10 concepts
  }

  private extractProcedures(text: string): Array<{ name: string; steps: string[] }> {
    const procedures: Array<{ name: string; steps: string[] }> = [];
    
    // Look for numbered lists or step indicators
    const lines = text.split("\n");
    let currentSteps: string[] = [];
    let inProcedure = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for numbered list items
      if (trimmed.match(/^\d+\./) || trimmed.match(/^\d+\)/) || trimmed.match(/^Step \d+/i)) {
        inProcedure = true;
        currentSteps.push(trimmed.replace(/^\d+[\.\)]?\s*/, "").replace(/^Step \d+:\s*/i, ""));
      } else if (inProcedure && trimmed.length > 0) {
        currentSteps.push(trimmed);
      } else if (inProcedure && trimmed.length === 0) {
        // End of procedure
        if (currentSteps.length > 1) {
          procedures.push({
            name: `Procedure ${procedures.length + 1}`,
            steps: currentSteps,
          });
        }
        currentSteps = [];
        inProcedure = false;
      }
    }

    // Add last procedure if exists
    if (currentSteps.length > 1) {
      procedures.push({
        name: `Procedure ${procedures.length + 1}`,
        steps: currentSteps,
      });
    }

    return procedures.slice(0, 5); // Limit to 5 procedures
  }

  private extractExamples(text: string): Array<{ title: string; description: string }> {
    const examples: Array<{ title: string; description: string }> = [];
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.match(/for example|example:|e\.g\./i)) {
        examples.push({
          title: `Example ${examples.length + 1}`,
          description: trimmed,
        });
      }
    }

    return examples.slice(0, 5); // Limit to 5 examples
  }

  private extractWarnings(text: string): Array<{ title: string; description: string; severity: "low" | "medium" | "high" }> {
    const warnings: Array<{ title: string; description: string; severity: "low" | "medium" | "high" }> = [];
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.match(/warning|caution|danger|note|important/i)) {
        let severity: "low" | "medium" | "high" = "medium";
        if (trimmed.match(/danger/i)) severity = "high";
        if (trimmed.match(/note/i)) severity = "low";

        warnings.push({
          title: `Warning ${warnings.length + 1}`,
          description: trimmed,
          severity,
        });
      }
    }

    return warnings.slice(0, 5); // Limit to 5 warnings
  }
}
