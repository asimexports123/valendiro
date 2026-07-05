/**
 * Data Processor - Phase 30.2
 * 
 * Responsibilities:
 * - Schema validation
 * - Normalization
 * - Duplicate detection
 * - Canonical entity resolution
 * - Slug generation
 * - Confidence assignment
 * - Knowledge Package construction
 * 
 * The Data Processor must never:
 * - Generate HTML
 * - Generate Markdown
 * - Generate JSX
 * - Generate page layouts
 * - Generate SEO copy
 * - Perform rendering
 * 
 * Its only output is a valid Knowledge Package.
 */

import type {
  KnowledgePackage,
  StructuredDefinition,
  StructuredConcept,
  StructuredProcedure,
  StructuredExample,
  StructuredComparison,
  StructuredCommand,
  StructuredFormula,
  StructuredWarning,
  StructuredBestPractice,
  StructuredCommonMistake,
  StructuredFAQ,
  StructuredReference,
  SourceMetadata,
} from "../renderer/types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DataProcessorOptions {
  minConfidence?: number;
  allowPlaceholders?: boolean;
  requireMetadata?: boolean;
}

/**
 * Data Processor for Knowledge Package validation and construction
 */
export class DataProcessor {
  private options: DataProcessorOptions;

  constructor(options: DataProcessorOptions = {}) {
    this.options = {
      minConfidence: 0.5,
      allowPlaceholders: false,
      requireMetadata: true,
      ...options,
    };
  }

  /**
   * Validate a Knowledge Package schema
   */
  validateSchema(pkg: KnowledgePackage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!pkg.id) errors.push("Missing required field: id");
    if (!pkg.slug) errors.push("Missing required field: slug");
    if (!pkg.knowledgeHash) errors.push("Missing required field: knowledgeHash");
    if (!pkg.category) errors.push("Missing required field: category");
    if (!pkg.intent) errors.push("Missing required field: intent");

    // Validate intent
    const validIntents = ["inform", "educate", "guide", "decide"];
    if (!validIntents.includes(pkg.intent)) {
      errors.push(`Invalid intent: ${pkg.intent}. Must be one of: ${validIntents.join(", ")}`);
    }

    // Validate slug format
    if (pkg.slug && !/^[a-z0-9-]+$/.test(pkg.slug)) {
      errors.push("Slug must contain only lowercase letters, numbers, and hyphens");
    }

    // Validate metadata
    if (this.options.requireMetadata) {
      if (!pkg.metadata) errors.push("Missing required field: metadata");
      if (!pkg.metadata.sourceMetadata) errors.push("Missing required field: metadata.sourceMetadata");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate required metadata
   */
  validateMetadata(pkg: KnowledgePackage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!pkg.metadata) {
      errors.push("Metadata is required");
      return { valid: false, errors, warnings };
    }

    if (!pkg.metadata.sourceMetadata) {
      errors.push("Source metadata is required");
      return { valid: false, errors, warnings };
    }

    const sm = pkg.metadata.sourceMetadata;
    if (!sm.adapterName) errors.push("Source metadata missing: adapterName");
    if (!sm.adapterVersion) errors.push("Source metadata missing: adapterVersion");
    if (!sm.sourceType) errors.push("Source metadata missing: sourceType");
    if (!sm.retrievedAt) errors.push("Source metadata missing: retrievedAt");
    if (!sm.processedAt) errors.push("Source metadata missing: processedAt");
    if (!sm.validationStatus) errors.push("Source metadata missing: validationStatus");

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate required structured fact collections
   */
  validateStructuredCollections(pkg: KnowledgePackage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // At least one structured collection should be present
    const hasStructuredContent =
      pkg.definitions.length > 0 ||
      pkg.concepts.length > 0 ||
      pkg.procedures.length > 0 ||
      pkg.examples.length > 0 ||
      pkg.comparisons.length > 0 ||
      pkg.commands.length > 0 ||
      pkg.formulae.length > 0 ||
      pkg.warnings.length > 0 ||
      pkg.bestPractices.length > 0 ||
      pkg.commonMistakes.length > 0 ||
      pkg.faqs.length > 0;

    if (!hasStructuredContent && pkg.facts.length === 0) {
      errors.push("Knowledge Package must contain either structured collections or legacy facts");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate slug - canonical, stable, unique
   */
  validateSlug(slug: string, existingSlugs: string[] = []): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Canonical format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.push("Slug must contain only lowercase letters, numbers, and hyphens");
    }

    // Stability check (no version numbers, dates, or temporal markers)
    if (/\d{4}|v\d+|version|temp|draft/i.test(slug)) {
      warnings.push("Slug contains temporal or version markers which may affect stability");
    }

    // Uniqueness check
    if (existingSlugs.includes(slug)) {
      errors.push("Slug already exists in the system");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Entity normalization - resolve aliases to canonical entities
   */
  normalizeEntities(entities: string[]): Map<string, string> {
    const canonicalMap = new Map<string, string>();
    
    // Simple normalization: lowercase and remove common variations
    entities.forEach(entity => {
      const canonical = entity.toLowerCase().trim();
      canonicalMap.set(entity, canonical);
    });

    return canonicalMap;
  }

  /**
   * Duplicate detection
   */
  detectDuplicates(pkg: KnowledgePackage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate definitions
    const definitionTerms = new Set<string>();
    pkg.definitions.forEach(def => {
      if (definitionTerms.has(def.term)) {
        errors.push(`Duplicate definition term: ${def.term}`);
      }
      definitionTerms.add(def.term);
    });

    // Check for duplicate concepts
    const conceptNames = new Set<string>();
    pkg.concepts.forEach(concept => {
      if (conceptNames.has(concept.name)) {
        errors.push(`Duplicate concept name: ${concept.name}`);
      }
      conceptNames.add(concept.name);
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Confidence validation - reject facts below configured threshold
   */
  validateConfidence(pkg: KnowledgePackage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const minConfidence = this.options.minConfidence || 0.5;

    // Check structured collections
    pkg.definitions.forEach(def => {
      const conf = parseFloat(def.confidence) || 0;
      if (conf < minConfidence) {
        errors.push(`Definition "${def.term}" has confidence below threshold: ${conf}`);
      }
    });

    pkg.concepts.forEach(concept => {
      const conf = parseFloat(concept.confidence) || 0;
      if (conf < minConfidence) {
        errors.push(`Concept "${concept.name}" has confidence below threshold: ${conf}`);
      }
    });

    // Check legacy facts
    pkg.facts.forEach(fact => {
      const conf = parseFloat(fact.confidence) || 0;
      if (conf < minConfidence) {
        errors.push(`Fact has confidence below threshold: ${fact.statement.substring(0, 50)}...`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Placeholder detection - reject Knowledge Packages containing placeholders
   */
  detectPlaceholders(pkg: KnowledgePackage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const placeholderPatterns = [
      /type \d+/i,
      /example \d+/i,
      /description \d+/i,
      /todo/i,
      /lorem ipsum/i,
      /to be determined/i,
      /coming soon/i,
      /placeholder/i,
    ];

    // Check structured collections
    const checkText = (text: string, context: string) => {
      placeholderPatterns.forEach(pattern => {
        if (pattern.test(text)) {
          errors.push(`Placeholder detected in ${context}: "${text.substring(0, 50)}..."`);
        }
      });
    };

    pkg.definitions.forEach(def => {
      checkText(def.definition, `definition: ${def.term}`);
    });

    pkg.concepts.forEach(concept => {
      checkText(concept.description, `concept: ${concept.name}`);
    });

    pkg.facts.forEach(fact => {
      checkText(fact.statement, `fact`);
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Idempotency - running multiple times on identical input produces identical output
   */
  ensureIdempotency(pkg: KnowledgePackage): KnowledgePackage {
    // Sort arrays to ensure consistent ordering
    const sortedPkg: KnowledgePackage = {
      ...pkg,
      definitions: [...pkg.definitions].sort((a, b) => a.id.localeCompare(b.id)),
      concepts: [...pkg.concepts].sort((a, b) => a.id.localeCompare(b.id)),
      procedures: [...pkg.procedures].sort((a, b) => a.id.localeCompare(b.id)),
      examples: [...pkg.examples].sort((a, b) => a.id.localeCompare(b.id)),
      comparisons: [...pkg.comparisons].sort((a, b) => a.id.localeCompare(b.id)),
      commands: [...pkg.commands].sort((a, b) => a.id.localeCompare(b.id)),
      formulae: [...pkg.formulae].sort((a, b) => a.id.localeCompare(b.id)),
      warnings: [...pkg.warnings].sort((a, b) => a.id.localeCompare(b.id)),
      bestPractices: [...pkg.bestPractices].sort((a, b) => a.id.localeCompare(b.id)),
      commonMistakes: [...pkg.commonMistakes].sort((a, b) => a.id.localeCompare(b.id)),
      faqs: [...pkg.faqs].sort((a, b) => a.id.localeCompare(b.id)),
      references: [...pkg.references].sort((a, b) => a.id.localeCompare(b.id)),
      facts: [...pkg.facts].sort((a, b) => a.id.localeCompare(b.id)),
      citations: [...pkg.citations].sort((a, b) => a.id.localeCompare(b.id)),
      relationships: [...pkg.relationships].sort((a, b) => a.id.localeCompare(b.id)),
    };

    return sortedPkg;
  }

  /**
   * Process and validate a Knowledge Package
   */
  processPackage(pkg: KnowledgePackage, existingSlugs: string[] = []): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Run all validations
    const schemaResult = this.validateSchema(pkg);
    allErrors.push(...schemaResult.errors);
    allWarnings.push(...schemaResult.warnings);

    const metadataResult = this.validateMetadata(pkg);
    allErrors.push(...metadataResult.errors);
    allWarnings.push(...metadataResult.warnings);

    const collectionsResult = this.validateStructuredCollections(pkg);
    allErrors.push(...collectionsResult.errors);
    allWarnings.push(...collectionsResult.warnings);

    const slugResult = this.validateSlug(pkg.slug, existingSlugs);
    allErrors.push(...slugResult.errors);
    allWarnings.push(...slugResult.warnings);

    const duplicatesResult = this.detectDuplicates(pkg);
    allErrors.push(...duplicatesResult.errors);
    allWarnings.push(...duplicatesResult.warnings);

    const confidenceResult = this.validateConfidence(pkg);
    allErrors.push(...confidenceResult.errors);
    allWarnings.push(...confidenceResult.warnings);

    const placeholdersResult = this.detectPlaceholders(pkg);
    allErrors.push(...placeholdersResult.errors);
    allWarnings.push(...placeholdersResult.warnings);

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}
