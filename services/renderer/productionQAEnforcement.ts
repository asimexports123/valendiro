/**
 * Production QA Enforcement
 *
 * Phase 3: validateProjectionPage() — per-page projection quality gate.
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

import type { DocumentNode, PluginFact } from "./types";

export interface ProjectionPageMetrics {
  duplicateFacts: number;
  duplicateHeadings: number;
  emptySections: number;
  placeholderHits: number;
  fillerRatio: number;
  graphSyntaxLeaks: number;
  rawMetadataLeaks: number;
  repeatedRecommendations: number;
  passed: boolean;
  issues: string[];
}

const PROJECTION_PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /placeholder text/i,
  /content goes here/i,
  /\[insert content\]/i,
  /key point \d+ about/i,
  /type \d+/i,
  /description \d+/i,
  /example \d+/i,
  /tbd/i,
  /coming soon/i,
  /in today's rapidly evolving/i,
  /understanding .+ helps you make better decisions, solve problems more effectively/i,
  /practice applying .+ in real scenarios/i,
  /experts see this as a foundational concept/i,
  /avoid using this when the problem doesn't match/i,
];

const GRAPH_SYNTAX_PATTERNS = [
  /\[\[.*?\]\]/,
  /node_type\s*[:=]/i,
  /source_asset_id\s*[:=]/i,
  /package_id\s*[:=]/i,
  /\{"@type":\s*"KnowledgeGraphNode"/i,
];

const FILLER_PATTERNS = [
  /it is important to note/gi,
  /it should be mentioned/gi,
  /it is worth noting/gi,
  /in conclusion/gi,
  /in summary/gi,
  /keep in mind/gi,
  /now that we understand/gi,
  /let's explore/gi,
  /this matters because it directly affects/gi,
];

function collectTextFromTree(nodes: DocumentNode[]): string[] {
  const chunks: string[] = [];
  for (const node of nodes) {
    if (node.type === "heading" && "text" in node) {
      chunks.push(node.text);
    }
    if (node.type === "paragraph" && "children" in node && Array.isArray(node.children)) {
      chunks.push(node.children.join(" "));
    }
    if (node.type === "list" && "items" in node) {
      for (const item of node.items) {
        if (item.type === "list-item" && item.children) {
          chunks.push(item.children.join(" "));
        }
      }
    }
    if (node.type === "callout" && "children" in node) {
      chunks.push(...collectTextFromTree(node.children));
    }
  }
  return chunks.filter((t) => t.trim().length > 0);
}

function normalizeForDedup(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Phase 3 projection page validator — runs on composed document tree + source facts.
 */
export function validateProjectionPage(
  tree: DocumentNode[],
  facts: PluginFact[]
): ProjectionPageMetrics {
  const issues: string[] = [];
  const textChunks = collectTextFromTree(tree);
  const fullText = textChunks.join("\n");

  const normalizedChunks = textChunks.map(normalizeForDedup);
  const chunkSet = new Set<string>();
  let duplicateFacts = 0;
  for (const chunk of normalizedChunks) {
    if (chunk.length < 20) continue;
    if (chunkSet.has(chunk)) duplicateFacts++;
    else chunkSet.add(chunk);
  }

  const headings = tree
    .filter((n): n is DocumentNode & { type: "heading"; text: string } => n.type === "heading")
    .map((h) => normalizeForDedup(h.text));
  const headingSet = new Set<string>();
  let duplicateHeadings = 0;
  for (const h of headings) {
    if (headingSet.has(h)) duplicateHeadings++;
    else headingSet.add(h);
  }

  const h2Sections: string[] = [];
  let current = "";
  for (const node of tree) {
    if (node.type === "heading" && node.level === 2) {
      if (current.trim().length > 0) h2Sections.push(current);
      current = "";
    } else if (node.type === "paragraph" || node.type === "list") {
      current += collectTextFromTree([node]).join(" ");
    }
  }
  if (current.trim().length > 0) h2Sections.push(current);
  const emptySections = h2Sections.filter((s) => s.trim().length < 40).length;

  let placeholderHits = 0;
  for (const pattern of PROJECTION_PLACEHOLDER_PATTERNS) {
    if (pattern.test(fullText)) {
      placeholderHits++;
      issues.push(`Placeholder pattern: ${pattern.source}`);
    }
  }

  let graphSyntaxLeaks = 0;
  for (const pattern of GRAPH_SYNTAX_PATTERNS) {
    if (pattern.test(fullText)) {
      graphSyntaxLeaks++;
      issues.push(`Graph syntax leak: ${pattern.source}`);
    }
  }

  const fillerMatches = fullText.match(new RegExp(FILLER_PATTERNS.map((p) => p.source).join("|"), "gi"));
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;
  const fillerRatio = wordCount > 0 ? (fillerMatches?.length ?? 0) / wordCount : 0;

  const rawMetadataLeaks =
    tree.filter((n) => n.type === "metadata" || n.type === "missing-knowledge").length +
    (fullText.match(/<!--[\s\S]*?-->/g)?.length ?? 0);

  const recommendationPatterns = [
    /what to learn next/gi,
    /continue your learning journey/gi,
    /explore related concepts/gi,
  ];
  let repeatedRecommendations = 0;
  for (const pattern of recommendationPatterns) {
    const matches = fullText.match(pattern);
    if (matches && matches.length > 1) repeatedRecommendations += matches.length - 1;
  }

  if (duplicateFacts > 0) issues.push(`${duplicateFacts} duplicate content blocks`);
  if (duplicateHeadings > 0) issues.push(`${duplicateHeadings} duplicate headings`);
  if (emptySections > 0) issues.push(`${emptySections} empty sections`);
  if (fillerRatio > 0.05) issues.push(`Filler ratio ${(fillerRatio * 100).toFixed(1)}%`);
  if (facts.length === 0) issues.push("No source facts");

  const passed =
    duplicateHeadings === 0 &&
    emptySections === 0 &&
    placeholderHits === 0 &&
    graphSyntaxLeaks === 0 &&
    rawMetadataLeaks === 0 &&
    fillerRatio < 0.08 &&
    duplicateFacts <= 1;

  return {
    duplicateFacts,
    duplicateHeadings,
    emptySections,
    placeholderHits,
    fillerRatio,
    graphSyntaxLeaks,
    rawMetadataLeaks,
    repeatedRecommendations,
    passed,
    issues,
  };
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
