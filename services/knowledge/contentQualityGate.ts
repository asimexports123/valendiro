/**
 * Publication quality gate — block dummy, thin, and regressed content.
 */

export const MIN_PUBLISH_WORD_COUNT = 350;
export const MIN_PUBLISH_QUALITY_SCORE = 60; // 0–100 scale

/** Old editorial-upgrade.js template filler — not real knowledge. */
export const DUMMY_CONTENT_PATTERNS: RegExp[] = [
  /Executive Summary/i,
  /critical topic that requires understanding both theoretical foundations/i,
  /comprehensive guide covers essential concepts, real-world scenarios/i,
  /Leading organizations implement .+ strategies to solve complex problems/i,
  /healthcare provider improved patient outcomes/i,
  /fintech startup leveraged/i,
  /Phase 1: Preparation/i,
  /Traditional Approach \| Modern .+ Approach/i,
  /It forms the foundation for advanced concepts and specialized applications/i,
  /Industry adoption continues to grow across multiple sectors/i,
  /Some authors do not use simply refer to/i,
  /Takeaway: .+ is a way to…/i,
];

export function normalizeQualityScore(raw: unknown): number {
  if (typeof raw !== "number" || Number.isNaN(raw)) return 0;
  if (raw <= 1) return Math.round(raw * 100);
  return Math.round(raw);
}

export function countWords(content: string | null | undefined): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function detectDummyContent(content: string): string | null {
  for (const pattern of DUMMY_CONTENT_PATTERNS) {
    if (pattern.test(content)) {
      return pattern.source;
    }
  }
  return null;
}

export interface PublishEligibility {
  allowed: boolean;
  reasons: string[];
  wordCount: number;
  qualityScore: number;
}

export function evaluatePublishEligibility(input: {
  content: string;
  qualityScoreRaw?: unknown;
  wordsBefore?: number;
  minWords?: number;
  minQuality?: number;
  ignoreRegression?: boolean;
}): PublishEligibility {
  const minWords = input.minWords ?? MIN_PUBLISH_WORD_COUNT;
  const minQuality = input.minQuality ?? MIN_PUBLISH_QUALITY_SCORE;
  const wordCount = countWords(input.content);
  const qualityScore = normalizeQualityScore(input.qualityScoreRaw);
  const reasons: string[] = [];

  if (wordCount < minWords) {
    reasons.push(`Too short: ${wordCount} words (min ${minWords})`);
  }
  if (qualityScore < minQuality) {
    reasons.push(`Quality too low: ${qualityScore}/100 (min ${minQuality})`);
  }
  const dummy = detectDummyContent(input.content);
  if (dummy) {
    reasons.push(`Dummy/template content detected (${dummy})`);
  }
  if (input.wordsBefore != null && input.wordsBefore >= minWords && !input.ignoreRegression) {
    if (wordCount < input.wordsBefore * 0.85) {
      reasons.push(`Regression: ${input.wordsBefore} → ${wordCount} words`);
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    wordCount,
    qualityScore,
  };
}
