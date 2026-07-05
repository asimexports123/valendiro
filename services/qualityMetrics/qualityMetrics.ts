/**
 * Phase 33.2: Quality Metrics
 * 
 * Calculates quality metrics for Knowledge Packages:
 * - Coverage Score
 * - Completeness Score
 * - Authority Score
 * - Freshness Score
 */

import type { KnowledgePackage } from "../renderer/types";

export interface QualityMetrics {
  coverageScore: number; // 0-100
  completenessScore: number; // 0-100
  authorityScore: number; // 0-100
  freshnessScore: number; // 0-100
  overallQualityScore: number; // 0-100
  calculatedAt: string;
}

export interface MetricsOptions {
  weights?: {
    coverage: number;
    completeness: number;
    authority: number;
    freshness: number;
  };
  freshnessThreshold?: number; // days
}

const DEFAULT_WEIGHTS = {
  coverage: 0.3,
  completeness: 0.3,
  authority: 0.25,
  freshness: 0.15,
};

export class QualityMetricsCalculator {
  private options: MetricsOptions;

  constructor(options: MetricsOptions = {}) {
    this.options = {
      weights: DEFAULT_WEIGHTS,
      freshnessThreshold: 365, // 1 year
      ...options,
    };
  }

  calculateMetrics(pkg: KnowledgePackage): QualityMetrics {
    const coverageScore = this.calculateCoverageScore(pkg);
    const completenessScore = this.calculateCompletenessScore(pkg);
    const authorityScore = this.calculateAuthorityScore(pkg);
    const freshnessScore = this.calculateFreshnessScore(pkg);

    const weights = this.options.weights || DEFAULT_WEIGHTS;
    const overallQualityScore =
      coverageScore * weights.coverage +
      completenessScore * weights.completeness +
      authorityScore * weights.authority +
      freshnessScore * weights.freshness;

    return {
      coverageScore: Math.round(coverageScore),
      completenessScore: Math.round(completenessScore),
      authorityScore: Math.round(authorityScore),
      freshnessScore: Math.round(freshnessScore),
      overallQualityScore: Math.round(overallQualityScore),
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Coverage Score: Measures how many structured collections are populated
   */
  private calculateCoverageScore(pkg: KnowledgePackage): number {
    const collections = [
      pkg.definitions.length,
      pkg.concepts.length,
      pkg.procedures.length,
      pkg.examples.length,
      pkg.comparisons.length,
      pkg.commands.length,
      pkg.formulae.length,
      pkg.warnings.length,
      pkg.bestPractices.length,
      pkg.commonMistakes.length,
      pkg.faqs.length,
      pkg.references.length,
    ];

    const nonEmptyCollections = collections.filter(count => count > 0).length;
    const totalCollections = collections.length;

    return (nonEmptyCollections / totalCollections) * 100;
  }

  /**
   * Completeness Score: Measures depth of knowledge in each collection
   */
  private calculateCompletenessScore(pkg: KnowledgePackage): number {
    let score = 0;
    const maxScore = 100;

    // Definitions (15 points)
    if (pkg.definitions.length >= 5) score += 15;
    else if (pkg.definitions.length >= 3) score += 10;
    else if (pkg.definitions.length >= 1) score += 5;

    // Concepts (15 points)
    if (pkg.concepts.length >= 5) score += 15;
    else if (pkg.concepts.length >= 3) score += 10;
    else if (pkg.concepts.length >= 1) score += 5;

    // Procedures (15 points)
    if (pkg.procedures.length >= 3) score += 15;
    else if (pkg.procedures.length >= 1) score += 8;

    // Examples (15 points)
    if (pkg.examples.length >= 3) score += 15;
    else if (pkg.examples.length >= 1) score += 8;

    // Warnings (10 points)
    if (pkg.warnings.length >= 2) score += 10;
    else if (pkg.warnings.length >= 1) score += 5;

    // Best Practices (10 points)
    if (pkg.bestPractices.length >= 3) score += 10;
    else if (pkg.bestPractices.length >= 1) score += 5;

    // Common Mistakes (10 points)
    if (pkg.commonMistakes.length >= 2) score += 10;
    else if (pkg.commonMistakes.length >= 1) score += 5;

    // FAQs (10 points)
    if (pkg.faqs.length >= 3) score += 10;
    else if (pkg.faqs.length >= 1) score += 5;

    // References (10 points)
    if (pkg.references.length >= 2) score += 10;
    else if (pkg.references.length >= 1) score += 5;

    return Math.min(score, maxScore);
  }

  /**
   * Authority Score: Measures the quality and reliability of sources
   */
  private calculateAuthorityScore(pkg: KnowledgePackage): number {
    let score = 50; // Base score

    // Source metadata authority
    if (pkg.metadata.sourceMetadata) {
      const sm = pkg.metadata.sourceMetadata;
      
      // High authority sources
      const sourceType = sm.sourceType as string;
      if (sourceType === "official-docs") score += 30;
      else if (sourceType === "json") score += 20;
      else if (sourceType === "wikipedia") score += 15;
      else if (sourceType === "legacy") score += 5;
      else score += 10; // Default for other types

      // Validation status
      if (sm.validationStatus === "valid") score += 10;
      else score -= 10;

      // Adapter version (indicates maturity)
      if (sm.adapterVersion) score += 10;
    }

    // Confidence level
    if (pkg.metadata.confidence === "high") score += 10;
    else if (pkg.metadata.confidence === "medium") score += 5;

    // Source count (more sources = higher authority)
    if (pkg.metadata.sourceCount >= 3) score += 10;
    else if (pkg.metadata.sourceCount >= 2) score += 5;

    // References (indicates research backing)
    if (pkg.references.length >= 3) score += 10;
    else if (pkg.references.length >= 1) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Freshness Score: Measures how recent the knowledge is
   */
  private calculateFreshnessScore(pkg: KnowledgePackage): number {
    const lastUpdated = pkg.metadata.lastUpdated;
    const lastVerified = pkg.metadata.lastVerified;
    const thresholdDays = this.options.freshnessThreshold || 365;

    const calculateDaysSince = (dateString: string | null): number => {
      if (!dateString) return Infinity;
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    let score = 100;
    const daysSinceUpdate = calculateDaysSince(lastUpdated);
    const daysSinceVerification = calculateDaysSince(lastVerified);

    // Decay based on age
    if (daysSinceUpdate <= 30) score = 100;
    else if (daysSinceUpdate <= 90) score = 90;
    else if (daysSinceUpdate <= 180) score = 80;
    else if (daysSinceUpdate <= 365) score = 70;
    else score = Math.max(50, 100 - (daysSinceUpdate - 365) / 30);

    // Boost for recent verification
    if (daysSinceVerification <= 30) score = Math.min(100, score + 10);
    else if (daysSinceVerification <= 90) score = Math.min(100, score + 5);

    return Math.round(score);
  }
}
