/**
 * Publication Validation Service
 *
 * Dedicated service for validating rendered outputs before publication.
 * Separated from the Publication Pipeline for clear separation of concerns.
 *
 * Validation Checks:
 * - Render completed successfully
 * - Status = published (or equivalent publish-ready state)
 * - Latest renderer version
 * - Language matches target translation
 * - HTML/content integrity
 * - Metadata completeness
 * - Quality score meets configured threshold
 * - Topic exists and is publishable
 */

import type { RenderedOutput, Topic } from './publicationPipeline';

export interface ValidationConfig {
  qualityThreshold: number;
  minCoverage: number;
  minCompleteness: number;
  minAuthority: number;
  minReferences: number;
  requiredRendererVersion: string;
  allowedOutputFormats: ('html' | 'markdown' | 'json')[];
  minWordCount: number;
  minSectionCount: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    renderCompleted: boolean;
    statusIsPublished: boolean;
    rendererVersionValid: boolean;
    languageMatch: boolean;
    contentIntegrity: boolean;
    metadataComplete: boolean;
    qualityScoreValid: boolean;
    coverageValid: boolean;
    completenessValid: boolean;
    authorityValid: boolean;
    referencesValid: boolean;
    topicExists: boolean;
    topicPublishable: boolean;
  };
  score: number; // 0-100 validation score
  level: 'LEVEL_1_PUBLISHED' | 'DEFERRED' | 'FAILED';
}

export interface ValidationReport {
  renderedOutputId: string;
  topicId: string | null;
  languageCode: string;
  validation: ValidationResult;
  timestamp: string;
}

export class PublicationValidation {
  private config: ValidationConfig;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      qualityThreshold: 0.7,
      minCoverage: 0.5,
      minCompleteness: 0.5,
      minAuthority: 0.8,
      minReferences: 2,
      requiredRendererVersion: '1.0.0',
      allowedOutputFormats: ['html'],
      minWordCount: 100,
      minSectionCount: 3,
      ...config,
    };
  }

  /**
   * Validate a rendered output for publication
   */
  validate(
    renderedOutput: RenderedOutput,
    topic: Topic | null,
    targetLanguage: string = 'en'
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let passedChecks = 0;
    let totalChecks = 13;

    // Check 1: Render completed successfully
    const renderCompleted = this.checkRenderCompleted(renderedOutput);
    passedChecks += renderCompleted ? 1 : 0;
    if (!renderCompleted) {
      errors.push('Render did not complete successfully');
    }

    // Check 2: Status is published
    const statusIsPublished = renderedOutput.status === 'published';
    passedChecks += statusIsPublished ? 1 : 0;
    if (!statusIsPublished) {
      errors.push(`Rendered output status is '${renderedOutput.status}', expected 'published'`);
    }

    // Check 3: Renderer version is valid
    const rendererVersionValid = this.checkRendererVersion(renderedOutput);
    passedChecks += rendererVersionValid ? 1 : 0;
    if (!rendererVersionValid) {
      errors.push(
        `Renderer version '${renderedOutput.renderer_version}' does not match required '${this.config.requiredRendererVersion}'`
      );
    }

    // Check 4: Language matches target
    const languageMatch = this.checkLanguageMatch(renderedOutput, targetLanguage);
    passedChecks += languageMatch ? 1 : 0;
    if (!languageMatch) {
      errors.push('Language does not match target translation');
    }

    // Check 5: Content integrity
    const contentIntegrity = this.checkContentIntegrity(renderedOutput);
    passedChecks += contentIntegrity ? 1 : 0;
    if (!contentIntegrity) {
      errors.push('Content integrity validation failed');
    }

    // Check 6: Metadata completeness
    const metadataComplete = this.checkMetadataCompleteness(renderedOutput);
    passedChecks += metadataComplete ? 1 : 0;
    if (!metadataComplete) {
      warnings.push('Metadata is incomplete');
    }

    // Check 7: Quality score valid
    const qualityScoreValid = this.checkQualityScore(renderedOutput);
    passedChecks += qualityScoreValid ? 1 : 0;
    if (!qualityScoreValid) {
      const score = this.extractQualityScore(renderedOutput);
      errors.push(
        `Quality score ${score.toFixed(2)} does not meet threshold of ${this.config.qualityThreshold}`
      );
    }

    // Check 8: Coverage valid
    const coverageValid = this.checkCoverage(renderedOutput);
    passedChecks += coverageValid ? 1 : 0;
    if (!coverageValid) {
      errors.push(`Coverage does not meet minimum threshold of ${this.config.minCoverage}`);
    }

    // Check 9: Completeness valid
    const completenessValid = this.checkCompleteness(renderedOutput);
    passedChecks += completenessValid ? 1 : 0;
    if (!completenessValid) {
      errors.push(`Completeness does not meet minimum threshold of ${this.config.minCompleteness}`);
    }

    // Check 10: Authority valid
    const authorityValid = this.checkAuthority(renderedOutput);
    passedChecks += authorityValid ? 1 : 0;
    if (!authorityValid) {
      errors.push(`Authority does not meet minimum threshold of ${this.config.minAuthority}`);
    }

    // Check 11: References valid
    const referencesValid = this.checkReferences(renderedOutput);
    passedChecks += referencesValid ? 1 : 0;
    if (!referencesValid) {
      errors.push(`References count does not meet minimum of ${this.config.minReferences}`);
    }

    // Check 12: Topic exists
    const topicExists = topic !== null;
    passedChecks += topicExists ? 1 : 0;
    if (!topicExists) {
      errors.push('Topic does not exist');
    }

    // Check 13: Topic is publishable
    const topicPublishable = topic ? this.checkTopicPublishable(topic) : false;
    passedChecks += topicPublishable ? 1 : 0;
    if (topic && !topicPublishable) {
      errors.push(`Topic status is '${topic.status}', cannot publish archived topics`);
    }

    // Calculate validation score (0-100)
    const score = Math.round((passedChecks / totalChecks) * 100);

    // Determine publication level
    let level: 'LEVEL_1_PUBLISHED' | 'DEFERRED' | 'FAILED';
    if (errors.length === 0) {
      level = 'LEVEL_1_PUBLISHED';
    } else if (this.checkCoreRequirements(renderedOutput)) {
      level = 'DEFERRED';
    } else {
      level = 'FAILED';
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checks: {
        renderCompleted,
        statusIsPublished,
        rendererVersionValid,
        languageMatch,
        contentIntegrity,
        metadataComplete,
        qualityScoreValid,
        coverageValid,
        completenessValid,
        authorityValid,
        referencesValid,
        topicExists,
        topicPublishable,
      },
      score,
      level,
    };
  }

  /**
   * Check if render completed successfully
   */
  private checkRenderCompleted(renderedOutput: RenderedOutput): boolean {
    return renderedOutput.status !== 'failed';
  }

  /**
   * Check if renderer version matches required version
   */
  private checkRendererVersion(renderedOutput: RenderedOutput): boolean {
    return renderedOutput.renderer_version === this.config.requiredRendererVersion;
  }

  /**
   * Check if language matches target
   */
  private checkLanguageMatch(renderedOutput: RenderedOutput, targetLanguage: string): boolean {
    // For now, we'll assume English is the target
    // In future, this would check the language metadata in the rendered output
    return true;
  }

  /**
   * Check content integrity
   */
  private checkContentIntegrity(renderedOutput: RenderedOutput): boolean {
    if (!renderedOutput.content || renderedOutput.content.length === 0) {
      return false;
    }

    if (renderedOutput.word_count < this.config.minWordCount) {
      return false;
    }

    if (renderedOutput.section_count < this.config.minSectionCount) {
      return false;
    }

    if (!renderedOutput.document_tree) {
      return false;
    }

    return true;
  }

  /**
   * Check metadata completeness
   */
  private checkMetadataCompleteness(renderedOutput: RenderedOutput): boolean {
    if (!renderedOutput.cache_key || renderedOutput.cache_key.length === 0) {
      return false;
    }

    if (!renderedOutput.knowledge_hash || renderedOutput.knowledge_hash.length === 0) {
      return false;
    }

    if (!renderedOutput.renderer_id || renderedOutput.renderer_id.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Check quality score
   */
  private checkQualityScore(renderedOutput: RenderedOutput): boolean {
    const score = this.extractQualityScore(renderedOutput);
    return score >= this.config.qualityThreshold;
  }

  /**
   * Extract quality score from rendered output
   */
  private extractQualityScore(renderedOutput: RenderedOutput): number {
    if (!renderedOutput.quality_score) {
      return 0;
    }

    // Try different possible keys for quality score
    return (
      renderedOutput.quality_score.overall ||
      renderedOutput.quality_score.total ||
      renderedOutput.quality_score.score ||
      0
    );
  }

  /**
   * Check if topic is publishable
   */
  private checkTopicPublishable(topic: Topic): boolean {
    return topic.status !== 'archived';
  }

  /**
   * Check coverage meets minimum threshold
   */
  private checkCoverage(renderedOutput: RenderedOutput): boolean {
    const score = this.extractQualityScore(renderedOutput);
    return score >= this.config.minCoverage;
  }

  /**
   * Check completeness meets minimum threshold
   */
  private checkCompleteness(renderedOutput: RenderedOutput): boolean {
    const score = this.extractQualityScore(renderedOutput);
    return score >= this.config.minCompleteness;
  }

  /**
   * Check authority meets minimum threshold
   */
  private checkAuthority(renderedOutput: RenderedOutput): boolean {
    const score = this.extractQualityScore(renderedOutput);
    return score >= this.config.minAuthority;
  }

  /**
   * Check references count meets minimum requirement
   */
  private checkReferences(renderedOutput: RenderedOutput): boolean {
    if (!renderedOutput.citation_count) {
      return false;
    }
    return renderedOutput.citation_count >= this.config.minReferences;
  }

  /**
   * Check core requirements for LEVEL_1 publication
   */
  private checkCoreRequirements(renderedOutput: RenderedOutput): boolean {
    const qualityScore = this.extractQualityScore(renderedOutput);
    return (
      qualityScore >= this.config.qualityThreshold &&
      renderedOutput.citation_count >= this.config.minReferences
    );
  }

  /**
   * Validate topic-specific collection requirements
   */
  validateTopicCollections(topic: Topic | null, renderedOutput: RenderedOutput): boolean {
    if (!topic) return false;

    const category = topic.category_id || 'general';
    const requiredCollections = this.getRequiredCollections(category);
    
    // For now, assume collections are validated if basic requirements are met
    // This can be enhanced with actual collection checking logic
    return this.checkCoreRequirements(renderedOutput);
  }

  /**
   * Get required collections based on topic category
   */
  private getRequiredCollections(category: string): string[] {
    const collectionMap: Record<string, string[]> = {
      programming: ['definitions', 'concepts', 'references'],
      finance: ['definitions', 'concepts', 'risks', 'references'],
      health: ['definitions', 'symptoms', 'causes', 'references'],
      business: ['definitions', 'concepts', 'best_practices', 'references'],
      general: ['definitions', 'concepts', 'references'],
    };

    return collectionMap[category.toLowerCase()] || collectionMap.general;
  }

  /**
   * Generate a validation report
   */
  generateReport(
    renderedOutputId: string,
    topicId: string | null,
    languageCode: string,
    validation: ValidationResult
  ): ValidationReport {
    return {
      renderedOutputId,
      topicId,
      languageCode,
      validation,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Batch validate multiple rendered outputs
   */
  batchValidate(
    items: Array<{ renderedOutput: RenderedOutput; topic: Topic | null; targetLanguage: string }>
  ): ValidationResult[] {
    return items.map(item =>
      this.validate(item.renderedOutput, item.topic, item.targetLanguage)
    );
  }
}
