/**
 * CSV Source Adapter - Phase 30.3
 * 
 * Converts CSV source data into canonical Knowledge Package format.
 */

import type { KnowledgePackage, SourceMetadata } from "../renderer/types";
import type { SourceAdapter, AdapterConfig, AdapterResult } from "./baseAdapter";

export class CSVAdapter implements SourceAdapter {
  getSourceType(): string {
    return "csv";
  }

  validateSource(sourceData: any): boolean {
    // Check if source data is a valid CSV structure (array of objects or CSV string)
    if (typeof sourceData === "string") {
      return sourceData.includes(",") || sourceData.includes(";");
    }

    if (Array.isArray(sourceData) && sourceData.length > 0) {
      return typeof sourceData[0] === "object";
    }

    return false;
  }

  async adapt(sourceData: any, config: AdapterConfig): Promise<AdapterResult> {
    try {
      if (!this.validateSource(sourceData)) {
        return {
          success: false,
          knowledgePackage: null,
          error: "Invalid CSV source data",
          warnings: [],
        };
      }

      // Parse CSV data
      const rows = this.parseCSV(sourceData);
      
      if (rows.length === 0) {
        return {
          success: false,
          knowledgePackage: null,
          error: "CSV data is empty",
          warnings: [],
        };
      }

      // Extract metadata from first row if available
      const firstRow = rows[0];
      const slug = firstRow.slug || this.generateSlug(firstRow.title || "untitled");

      // Map CSV rows to structured collections
      const definitions = this.mapDefinitionsFromCSV(rows);
      const concepts = this.mapConceptsFromCSV(rows);
      const procedures = this.mapProceduresFromCSV(rows);
      const warnings = this.mapWarningsFromCSV(rows);
      const bestPractices = this.mapBestPracticesFromCSV(rows);
      const commonMistakes = this.mapCommonMistakesFromCSV(rows);
      const faqs = this.mapFAQsFromCSV(rows);

      // Create source metadata
      const sourceMetadata: SourceMetadata = {
        adapterName: config.adapterName,
        adapterVersion: config.adapterVersion,
        sourceType: "csv",
        retrievedAt: firstRow.retrievedAt || new Date().toISOString(),
        processedAt: new Date().toISOString(),
        validationStatus: "valid",
      };

      // Assemble Knowledge Package
      const knowledgePackage: KnowledgePackage = {
        id: firstRow.id || this.generateId(),
        slug,
        knowledgeHash: this.generateHash(sourceData),
        topicId: firstRow.topicId || null,
        category: firstRow.category || "general",
        intent: this.inferIntent(firstRow.intent, firstRow.category),
        // Structured collections
        definitions,
        concepts,
        procedures,
        examples: [],
        comparisons: [],
        commands: [],
        formulae: [],
        warnings,
        bestPractices,
        commonMistakes,
        faqs,
        references: [],
        // Legacy fields
        facts: this.mapLegacyFactsFromCSV(rows),
        citations: [],
        relationships: [],
        // Metadata
        metadata: {
          sourceCount: 1,
          factCount: definitions.length + concepts.length + procedures.length,
          relationshipCount: 0,
          lastUpdated: firstRow.lastUpdated || new Date().toISOString(),
          lastVerified: null,
          confidence: firstRow.confidence || "high",
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
        error: error.message || "Unknown error adapting CSV source",
        warnings: [],
      };
    }
  }

  private parseCSV(sourceData: any): any[] {
    if (typeof sourceData === "string") {
      // Simple CSV parsing - in production use proper CSV library
      const lines = sourceData.split("\n").filter(line => line.trim());
      if (lines.length < 2) return [];

      const headers = lines[0].split(",").map(h => h.trim());
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || "";
        });
        rows.push(row);
      }

      return rows;
    }

    if (Array.isArray(sourceData)) {
      return sourceData;
    }

    return [];
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

  private mapDefinitionsFromCSV(rows: any[]) {
    return rows
      .filter(row => row.type === "definition" || row.factType === "definition")
      .map((row, idx) => ({
        id: row.id || this.generateId(),
        term: row.term || row.name || `Definition ${idx + 1}`,
        definition: row.definition || row.description || row.statement || "",
        context: row.context,
        confidence: row.confidence || "high",
        sourceId: row.sourceId,
      }));
  }

  private mapConceptsFromCSV(rows: any[]) {
    return rows
      .filter(row => row.type === "concept" || row.factType === "property")
      .map((row, idx) => ({
        id: row.id || this.generateId(),
        name: row.name || row.term || `Concept ${idx + 1}`,
        description: row.description || row.statement || "",
        category: row.category,
        confidence: row.confidence || "high",
        sourceId: row.sourceId,
      }));
  }

  private mapProceduresFromCSV(rows: any[]) {
    return rows
      .filter(row => row.type === "procedure" || row.factType === "procedural")
      .map((row, idx) => ({
        id: row.id || this.generateId(),
        name: row.name || row.title || `Procedure ${idx + 1}`,
        steps: row.steps ? row.steps.split("|") : [row.description || row.statement || ""],
        prerequisites: row.prerequisites ? row.prerequisites.split("|") : [],
        confidence: row.confidence || "high",
        sourceId: row.sourceId,
      }));
  }

  private mapWarningsFromCSV(rows: any[]) {
    return rows
      .filter(row => row.type === "warning" || row.factType === "warning")
      .map((row, idx) => ({
        id: row.id || this.generateId(),
        title: row.title || `Warning ${idx + 1}`,
        description: row.description || row.message || row.statement || "",
        severity: row.severity || "medium",
        sourceId: row.sourceId,
      }));
  }

  private mapBestPracticesFromCSV(rows: any[]) {
    return rows
      .filter(row => row.type === "best-practice")
      .map((row, idx) => ({
        id: row.id || this.generateId(),
        title: row.title || `Best Practice ${idx + 1}`,
        description: row.description || row.statement || "",
        confidence: row.confidence || "high",
        sourceId: row.sourceId,
      }));
  }

  private mapCommonMistakesFromCSV(rows: any[]) {
    return rows
      .filter(row => row.type === "mistake")
      .map((row, idx) => ({
        id: row.id || this.generateId(),
        mistake: row.mistake || row.error || `Mistake ${idx + 1}`,
        correction: row.correction || row.solution || row.statement || "",
        confidence: row.confidence || "high",
        sourceId: row.sourceId,
      }));
  }

  private mapFAQsFromCSV(rows: any[]) {
    return rows
      .filter(row => row.type === "faq")
      .map((row, idx) => ({
        id: row.id || this.generateId(),
        question: row.question || `Question ${idx + 1}`,
        answer: row.answer || row.statement || "",
        confidence: row.confidence || "high",
        sourceId: row.sourceId,
      }));
  }

  private mapLegacyFactsFromCSV(rows: any[]) {
    return rows
      .filter(row => row.statement)
      .map((row, idx) => ({
        id: row.id || this.generateId(),
        statement: row.statement || row.text || "",
        factType: row.factType || row.type || "property",
        confidence: row.confidence || "high",
        scope: row.scope || "general",
        tags: row.tags ? row.tags.split("|") : [],
        domain: row.domain || null,
      }));
  }
}
