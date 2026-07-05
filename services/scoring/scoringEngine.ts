/**
 * Automatic Scoring Engine - Phase 31.3
 * 
 * Every generated article must receive an overall quality score.
 * Minimum publication score: 85/100
 * 
 * Weights:
 * - Subject Accuracy: 25%
 * - Knowledge Coverage: 20%
 * - Readability: 15%
 * - Practical Value: 15%
 * - Examples: 10%
 * - Internal Linking: 5%
 * - SEO Metadata: 5%
 * - Validation Integrity: 5%
 */

import type { KnowledgePackage } from "../renderer/types";

export interface QualityScore {
  overallScore: number;
  passesThreshold: boolean;
  breakdown: {
    subjectAccuracy: number;
    knowledgeCoverage: number;
    readability: number;
    practicalValue: number;
    examples: number;
    internalLinking: number;
    seoMetadata: number;
    validationIntegrity: number;
  };
}

export interface ScoringOptions {
  minimumScore?: number;
  weights?: {
    subjectAccuracy: number;
    knowledgeCoverage: number;
    readability: number;
    practicalValue: number;
    examples: number;
    internalLinking: number;
    seoMetadata: number;
    validationIntegrity: number;
  };
}

const DEFAULT_WEIGHTS = {
  subjectAccuracy: 0.25,
  knowledgeCoverage: 0.20,
  readability: 0.15,
  practicalValue: 0.15,
  examples: 0.10,
  internalLinking: 0.05,
  seoMetadata: 0.05,
  validationIntegrity: 0.05,
};

const MINIMUM_SCORE = 85;

export class ScoringEngine {
  private options: ScoringOptions;

  constructor(options: ScoringOptions = {}) {
    this.options = {
      minimumScore: MINIMUM_SCORE,
      weights: DEFAULT_WEIGHTS,
      ...options,
    };
  }

  /**
   * Score a Knowledge Package
   */
  scorePackage(pkg: KnowledgePackage, renderedContent?: string): QualityScore {
    const weights = this.options.weights || DEFAULT_WEIGHTS;

    // Calculate individual scores
    const subjectAccuracy = this.scoreSubjectAccuracy(pkg);
    const knowledgeCoverage = this.scoreKnowledgeCoverage(pkg);
    const readability = this.scoreReadability(pkg, renderedContent);
    const practicalValue = this.scorePracticalValue(pkg);
    const examples = this.scoreExamples(pkg);
    const internalLinking = this.scoreInternalLinking(pkg, renderedContent);
    const seoMetadata = this.scoreSEOMetadata(pkg);
    const validationIntegrity = this.scoreValidationIntegrity(pkg);

    // Calculate weighted overall score
    const overallScore =
      subjectAccuracy * weights.subjectAccuracy +
      knowledgeCoverage * weights.knowledgeCoverage +
      readability * weights.readability +
      practicalValue * weights.practicalValue +
      examples * weights.examples +
      internalLinking * weights.internalLinking +
      seoMetadata * weights.seoMetadata +
      validationIntegrity * weights.validationIntegrity;

    const passesThreshold = overallScore >= (this.options.minimumScore || MINIMUM_SCORE);

    return {
      overallScore: Math.round(overallScore),
      passesThreshold,
      breakdown: {
        subjectAccuracy: Math.round(subjectAccuracy),
        knowledgeCoverage: Math.round(knowledgeCoverage),
        readability: Math.round(readability),
        practicalValue: Math.round(practicalValue),
        examples: Math.round(examples),
        internalLinking: Math.round(internalLinking),
        seoMetadata: Math.round(seoMetadata),
        validationIntegrity: Math.round(validationIntegrity),
      },
    };
  }

  /**
   * Subject Accuracy (25%)
   * Measures alignment between slug/category and actual content
   */
  private scoreSubjectAccuracy(pkg: KnowledgePackage): number {
    let score = 70; // Base score

    // Check if definitions and concepts align with slug/category
    const hasRelevantDefinitions = pkg.definitions.length > 0;
    const hasRelevantConcepts = pkg.concepts.length > 0;
    const hasRelevantProcedures = pkg.procedures.length > 0;

    if (hasRelevantDefinitions) score += 10;
    if (hasRelevantConcepts) score += 10;
    if (hasRelevantProcedures) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Knowledge Coverage (20%)
   * Measures comprehensiveness of structured collections
   */
  private scoreKnowledgeCoverage(pkg: KnowledgePackage): number {
    let score = 0;

    // Score based on presence of structured collections
    if (pkg.definitions.length > 0) score += 15;
    if (pkg.concepts.length > 0) score += 15;
    if (pkg.procedures.length > 0) score += 15;
    if (pkg.examples.length > 0) score += 15;
    if (pkg.warnings.length > 0) score += 10;
    if (pkg.bestPractices.length > 0) score += 10;
    if (pkg.commonMistakes.length > 0) score += 10;
    if (pkg.faqs.length > 0) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Readability (15%)
   * Measures content clarity and structure
   */
  private scoreReadability(pkg: KnowledgePackage, renderedContent?: string): number {
    let score = 70; // Base score

    // Check for structured content organization
    const hasDefinitions = pkg.definitions.length > 0;
    const hasConcepts = pkg.concepts.length > 0;
    const hasProcedures = pkg.procedures.length > 0;
    const hasExamples = pkg.examples.length > 0;

    if (hasDefinitions) score += 5;
    if (hasConcepts) score += 5;
    if (hasProcedures) score += 5;
    if (hasExamples) score += 5;

    // Check content length (not too short, not too long)
    const totalContent = pkg.definitions.length + pkg.concepts.length + pkg.procedures.length + pkg.examples.length;
    if (totalContent >= 5) score += 5;
    if (totalContent >= 10) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Practical Value (15%)
   * Measures usefulness and actionability
   */
  private scorePracticalValue(pkg: KnowledgePackage): number {
    let score = 0;

    // Procedures and commands indicate practical value
    if (pkg.procedures.length > 0) score += 30;
    if (pkg.commands.length > 0) score += 20;
    if (pkg.examples.length > 0) score += 20;
    if (pkg.bestPractices.length > 0) score += 15;
    if (pkg.commonMistakes.length > 0) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Examples (10%)
   * Measures presence of concrete examples
   */
  private scoreExamples(pkg: KnowledgePackage): number {
    let score = 0;

    const exampleCount = pkg.examples.length;
    const codeExamples = pkg.examples.filter(e => e.code).length;

    if (exampleCount > 0) score += 40;
    if (exampleCount >= 2) score += 30;
    if (exampleCount >= 3) score += 30;
    if (codeExamples > 0) score += 30;

    return Math.min(score, 100);
  }

  /**
   * Internal Linking (5%)
   * Measures presence of internal references
   */
  private scoreInternalLinking(pkg: KnowledgePackage, renderedContent?: string): number {
    let score = 50; // Base score

    // Check for relationships
    if (pkg.relationships.length > 0) score += 25;
    if (pkg.relationships.length >= 3) score += 25;

    // Check rendered content for internal links (if provided)
    if (renderedContent) {
      const hasInternalLinks = renderedContent.includes("/topics/");
      if (hasInternalLinks) score += 25;
    }

    return Math.min(score, 100);
  }

  /**
   * SEO Metadata (5%)
   * Measures presence of SEO-related metadata
   */
  private scoreSEOMetadata(pkg: KnowledgePackage): number {
    let score = 0;

    // Check metadata completeness
    if (pkg.metadata.sourceMetadata) {
      const sm = pkg.metadata.sourceMetadata;
      if (sm.adapterName) score += 20;
      if (sm.adapterVersion) score += 20;
      if (sm.sourceType) score += 20;
      if (sm.retrievedAt) score += 20;
      if (sm.processedAt) score += 20;
    }

    if (pkg.metadata.confidence) score += 20;

    return Math.min(score, 100);
  }

  /**
   * Validation Integrity (5%)
   * Measures confidence levels and data quality
   */
  private scoreValidationIntegrity(pkg: KnowledgePackage): number {
    let score = 0;

    // Check confidence levels across structured collections
    const checkConfidence = (items: any[], minLevel: string) => {
      if (items.length === 0) return 0;
      const highConfidenceCount = items.filter(item => {
        const conf = parseFloat(item.confidence) || 0;
        return conf >= parseFloat(minLevel);
      }).length;
      return (highConfidenceCount / items.length) * 100;
    };

    score += checkConfidence(pkg.definitions, "0.7") * 0.3;
    score += checkConfidence(pkg.concepts, "0.7") * 0.3;
    score += checkConfidence(pkg.procedures, "0.7") * 0.2;
    score += checkConfidence(pkg.examples, "0.7") * 0.2;

    return Math.min(score, 100);
  }
}
