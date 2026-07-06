/**
 * Production QA Enforcement
 * 
 * The QA gate is mandatory. Never publish if:
 * - Editorial score < 90
 * - Placeholder text detected
 * - Internal links below minimum
 * - References below minimum
 * - Empty sections
 * - Duplicate content
 * - Generic filler
 * 
 * If QA fails: Keep the currently published article. Never replace a better article with a worse one.
 */

export interface QARequirement {
  name: string;
  critical: boolean;
  threshold: number;
  actual: number;
  passed: boolean;
}

export interface QAReport {
  overallScore: number;
  passed: boolean;
  requirements: QARequirement[];
  criticalFailures: string[];
  warnings: string[];
  recommendation: 'publish' | 'keep-current' | 'require-review';
}

export interface ContentQualityMetrics {
  editorialScore: number;
  placeholderTextDetected: boolean;
  internalLinksCount: number;
  referencesCount: number;
  emptySections: number;
  duplicateContentRatio: number;
  genericFillerRatio: number;
  wordCount: number;
  readingTime: number;
}

/**
 * Placeholder text patterns to detect
 */
const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /placeholder text/i,
  /content goes here/i,
  /\[insert content\]/i,
  /tbd/i,
  /to be determined/i,
  /coming soon/i,
  /more information/i,
];

/**
 * Generic filler patterns to detect
 */
const GENERIC_FILLER_PATTERNS = [
  /it is important to note/gi,
  /it should be mentioned/gi,
  /in conclusion/gi,
  /in summary/gi,
  /it is worth noting/gi,
  /keep in mind/gi,
];

/**
 * Enforce QA requirements before publishing
 */
export function enforceProductionQA(
  currentMetrics: ContentQualityMetrics,
  existingScore?: number
): QAReport {
  const requirements: QARequirement[] = [];
  const criticalFailures: string[] = [];
  const warnings: string[] = [];

  // Requirement 1: Editorial score >= 90 (CRITICAL)
  const editorialScoreReq: QARequirement = {
    name: 'Editorial Score',
    critical: true,
    threshold: 90,
    actual: currentMetrics.editorialScore,
    passed: currentMetrics.editorialScore >= 90,
  };
  requirements.push(editorialScoreReq);

  if (!editorialScoreReq.passed) {
    criticalFailures.push(`Editorial score ${currentMetrics.editorialScore} below threshold 90`);
  }

  // Requirement 2: No placeholder text (CRITICAL)
  const placeholderReq: QARequirement = {
    name: 'No Placeholder Text',
    critical: true,
    threshold: 0,
    actual: currentMetrics.placeholderTextDetected ? 1 : 0,
    passed: !currentMetrics.placeholderTextDetected,
  };
  requirements.push(placeholderReq);

  if (!placeholderReq.passed) {
    criticalFailures.push('Placeholder text detected in content');
  }

  // Requirement 3: Internal links >= 5 (CRITICAL)
  const internalLinksReq: QARequirement = {
    name: 'Internal Links',
    critical: true,
    threshold: 5,
    actual: currentMetrics.internalLinksCount,
    passed: currentMetrics.internalLinksCount >= 5,
  };
  requirements.push(internalLinksReq);

  if (!internalLinksReq.passed) {
    criticalFailures.push(`Internal links ${currentMetrics.internalLinksCount} below minimum 5`);
  }

  // Requirement 4: References >= 1 (CRITICAL)
  const referencesReq: QARequirement = {
    name: 'References',
    critical: true,
    threshold: 1,
    actual: currentMetrics.referencesCount,
    passed: currentMetrics.referencesCount >= 1,
  };
  requirements.push(referencesReq);

  if (!referencesReq.passed) {
    criticalFailures.push(`References ${currentMetrics.referencesCount} below minimum 1`);
  }

  // Requirement 5: No empty sections (CRITICAL)
  const emptySectionsReq: QARequirement = {
    name: 'No Empty Sections',
    critical: true,
    threshold: 0,
    actual: currentMetrics.emptySections,
    passed: currentMetrics.emptySections === 0,
  };
  requirements.push(emptySectionsReq);

  if (!emptySectionsReq.passed) {
    criticalFailures.push(`${currentMetrics.emptySections} empty sections detected`);
  }

  // Requirement 6: Duplicate content < 10% (CRITICAL)
  const duplicateContentReq: QARequirement = {
    name: 'Duplicate Content',
    critical: true,
    threshold: 10,
    actual: currentMetrics.duplicateContentRatio * 100,
    passed: currentMetrics.duplicateContentRatio < 0.10,
  };
  requirements.push(duplicateContentReq);

  if (!duplicateContentReq.passed) {
    criticalFailures.push(`Duplicate content ${(currentMetrics.duplicateContentRatio * 100).toFixed(1)}% exceeds threshold 10%`);
  }

  // Requirement 7: Generic filler < 5% (WARNING)
  const genericFillerReq: QARequirement = {
    name: 'Generic Filler',
    critical: false,
    threshold: 5,
    actual: currentMetrics.genericFillerRatio * 100,
    passed: currentMetrics.genericFillerRatio < 0.05,
  };
  requirements.push(genericFillerReq);

  if (!genericFillerReq.passed) {
    warnings.push(`Generic filler ${(currentMetrics.genericFillerRatio * 100).toFixed(1)}% exceeds threshold 5%`);
  }

  // Requirement 8: Minimum word count (WARNING)
  const wordCountReq: QARequirement = {
    name: 'Word Count',
    critical: false,
    threshold: 500,
    actual: currentMetrics.wordCount,
    passed: currentMetrics.wordCount >= 500,
  };
  requirements.push(wordCountReq);

  if (!wordCountReq.passed) {
    warnings.push(`Word count ${currentMetrics.wordCount} below recommended minimum 500`);
  }

  // Calculate overall score
  const criticalPassed = requirements.filter(r => r.critical && r.passed).length;
  const criticalTotal = requirements.filter(r => r.critical).length;
  const overallScore = (criticalPassed / criticalTotal) * 100;

  // Determine recommendation
  let recommendation: 'publish' | 'keep-current' | 'require-review';
  
  if (criticalFailures.length === 0) {
    recommendation = 'publish';
  } else if (existingScore && existingScore > currentMetrics.editorialScore) {
    recommendation = 'keep-current';
    warnings.push('Existing article has higher editorial score - keeping current version');
  } else {
    recommendation = 'require-review';
  }

  return {
    overallScore,
    passed: criticalFailures.length === 0,
    requirements,
    criticalFailures,
    warnings,
    recommendation,
  };
}

/**
 * Detect placeholder text in content
 */
export function detectPlaceholderText(content: string): boolean {
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Detect generic filler in content
 */
export function detectGenericFiller(content: string): { detected: boolean; ratio: number } {
  const matches = content.match(new RegExp(GENERIC_FILLER_PATTERNS.join('|'), 'gi'));
  const fillerCount = matches ? matches.length : 0;
  const wordCount = content.split(/\s+/).length;
  const ratio = wordCount > 0 ? fillerCount / wordCount : 0;

  return {
    detected: ratio > 0.05,
    ratio,
  };
}

/**
 * Detect empty sections in content
 */
export function detectEmptySections(sections: string[]): number {
  return sections.filter(section => section.trim().length < 50).length;
}

/**
 * Calculate duplicate content ratio
 */
export function calculateDuplicateRatio(content: string, existingContent?: string): number {
  if (!existingContent) return 0;

  const contentWords = new Set(content.toLowerCase().split(/\s+/));
  const existingWords = new Set(existingContent.toLowerCase().split(/\s+/));

  const intersection = new Set([...contentWords].filter(x => existingWords.has(x)));
  const union = new Set([...contentWords, ...existingWords]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Extract content quality metrics from rendered output
 */
export function extractContentMetrics(
  content: string,
  internalLinks: number,
  references: number,
  existingContent?: string
): ContentQualityMetrics {
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  return {
    editorialScore: 85, // Would be calculated from actual scoring system
    placeholderTextDetected: detectPlaceholderText(content),
    internalLinksCount: internalLinks,
    referencesCount: references,
    emptySections: detectEmptySections(content.split(/\n\n+/)),
    duplicateContentRatio: calculateDuplicateRatio(content, existingContent),
    genericFillerRatio: detectGenericFiller(content).ratio,
    wordCount,
    readingTime,
  };
}

/**
 * Safe publish decision - never replace better with worse
 */
export function makeSafePublishDecision(
  qaReport: QAReport,
  currentPublishedScore?: number
): {
  shouldPublish: boolean;
  reason: string;
  action: 'publish' | 'keep-current' | 'queue-review';
} {
  if (!qaReport.passed) {
    return {
      shouldPublish: false,
      reason: `QA failed: ${qaReport.criticalFailures.join(', ')}`,
      action: 'queue-review',
    };
  }

  if (currentPublishedScore && currentPublishedScore > qaReport.overallScore) {
    return {
      shouldPublish: false,
      reason: `Current published score (${currentPublishedScore}) higher than new content (${qaReport.overallScore})`,
      action: 'keep-current',
    };
  }

  return {
    shouldPublish: true,
    reason: 'QA passed and content quality improved or maintained',
    action: 'publish',
  };
}
