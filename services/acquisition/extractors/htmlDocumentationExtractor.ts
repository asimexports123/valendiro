/**
 * Production Source Integration Roadmap - Phase A
 * HTML Documentation Extractor
 * 
 * Generic extractor for HTML documentation from official sources
 * Implements existing IExtractor interface
 */

import type { IExtractor, ExtractorConfig, ExtractorResult, ExtractedKnowledge } from "../connectors/connector";

export class HTMLDocumentationExtractor implements IExtractor {
  readonly sourceType = "html";
  readonly contentType = "html";

  extract(data: string | object, config: ExtractorConfig): Promise<ExtractorResult> {
    return new Promise((resolve) => {
      try {
        const html = typeof data === "string" ? data : JSON.stringify(data);
        
        if (!this.validateData(html)) {
          resolve({
            success: false,
            knowledge: null,
            error: "Invalid HTML data",
            warnings: [],
          });
          return;
        }

        const knowledge = this.extractKnowledge(html, config);

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
    const html = typeof data === "string" ? data : JSON.stringify(data);
    return !!html && html.length > 0;
  }

  private extractKnowledge(html: string, config: ExtractorConfig): ExtractedKnowledge {
    const sourceUrl = (config as any).sourceUrl || "";
    
    return {
      definitions: this.extractDefinitions(html, sourceUrl),
      concepts: this.extractConcepts(html, sourceUrl),
      procedures: this.extractProcedures(html, sourceUrl),
      examples: this.extractExamples(html, sourceUrl),
      comparisons: [],
      commands: [],
      formulae: [],
      warnings: this.extractWarnings(html, sourceUrl),
      bestPractices: this.extractBestPractices(html, sourceUrl),
      commonMistakes: [],
      faqs: [],
      references: this.extractReferences(html, sourceUrl),
      metadata: {
        sourceUrl,
        extractedAt: new Date().toISOString(),
        confidence: 0.8,
      },
    };
  }

  private extractDefinitions(html: string, sourceUrl: string): any[] {
    const definitions: any[] = [];
    
    // Extract definitions from HTML headings and paragraphs
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const descriptionMatch = html.match(/<p[^>]*>(.*?)<\/p>/i);
    
    if (titleMatch && descriptionMatch) {
      definitions.push({
        id: `def_${Date.now()}`,
        term: this.stripHTML(titleMatch[1]),
        definition: this.stripHTML(descriptionMatch[1]),
        context: sourceUrl,
      });
    }

    return definitions;
  }

  private extractConcepts(html: string, sourceUrl: string): any[] {
    const concepts: any[] = [];
    
    // Extract concepts from h2, h3 headings
    const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
    let match;
    let index = 0;
    
    while ((match = headingRegex.exec(html)) !== null && index < 10) {
      const name = this.stripHTML(match[1]);
      if (name.length > 0) {
        concepts.push({
          id: `concept_${Date.now()}_${index}`,
          name,
          description: "",
          relatedConcepts: [],
        });
        index++;
      }
    }

    return concepts;
  }

  private extractProcedures(html: string, sourceUrl: string): any[] {
    const procedures: any[] = [];
    
    // Extract procedures from code blocks or lists
    const codeRegex = /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
    let match;
    let index = 0;
    
    while ((match = codeRegex.exec(html)) !== null && index < 5) {
      const code = this.stripHTML(match[1]);
      if (code.length > 0) {
        procedures.push({
          id: `proc_${Date.now()}_${index}`,
          name: `Procedure ${index + 1}`,
          steps: [code],
          prerequisites: [],
          timeRequired: null,
        });
        index++;
      }
    }

    return procedures;
  }

  private extractExamples(html: string, sourceUrl: string): any[] {
    const examples: any[] = [];
    
    const codeRegex = /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
    let match;
    let index = 0;
    
    while ((match = codeRegex.exec(html)) !== null && index < 5) {
      const code = this.stripHTML(match[1]);
      if (code.length > 0) {
        examples.push({
          id: `ex_${Date.now()}_${index}`,
          title: `Example ${index + 1}`,
          description: code,
          code,
        });
        index++;
      }
    }

    return examples;
  }

  private extractWarnings(html: string, sourceUrl: string): any[] {
    const warnings: any[] = [];
    
    // Extract warnings from warning boxes or emphasized text
    const warningRegex = /<div[^>]*class="[^"]*warning[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let match;
    let index = 0;
    
    while ((match = warningRegex.exec(html)) !== null && index < 3) {
      const content = this.stripHTML(match[1]);
      if (content.length > 0) {
        warnings.push({
          id: `warn_${Date.now()}_${index}`,
          title: "Warning",
          description: content,
          severity: "medium",
        });
        index++;
      }
    }

    return warnings;
  }

  private extractBestPractices(html: string, sourceUrl: string): any[] {
    const bestPractices: any[] = [];
    
    // Extract best practices from tips or notes
    const tipRegex = /<div[^>]*class="[^"]*tip[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let match;
    let index = 0;
    
    while ((match = tipRegex.exec(html)) !== null && index < 3) {
      const content = this.stripHTML(match[1]);
      if (content.length > 0) {
        bestPractices.push({
          id: `bp_${Date.now()}_${index}`,
          title: "Best Practice",
          description: content,
          context: sourceUrl,
        });
        index++;
      }
    }

    return bestPractices;
  }

  private extractReferences(html: string, sourceUrl: string): any[] {
    const references: any[] = [];
    
    if (sourceUrl) {
      references.push({
        id: `ref_${Date.now()}`,
        url: sourceUrl,
        title: "Official Documentation",
        type: "documentation",
      });
    }

    return references;
  }

  private stripHTML(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}
