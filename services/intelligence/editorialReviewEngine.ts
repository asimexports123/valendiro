/**
 * Editorial Review Engine
 *
 * Three AI review passes after the Writer agent:
 *   Pass 1 — Fact Checker     : Verify definitions, facts, entities, hallucination risk
 *   Pass 2 — Quality Reviewer : Readability, density, flow, completeness
 *   Pass 3 — SEO Reviewer     : Title, meta, headings, keyword coverage, intent
 *
 * Each pass returns a score (0–100) and actionable issues.
 * If any pass score < threshold → article is flagged for rewrite.
 *
 * LLM Calls: 3 (one per pass)
 * All deterministic work (slug, schema, links) happens outside this engine.
 */

import { getActiveLLMProvider } from "@/services/llm/llmProvider";
import "@/services/llm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FactCheckResult {
  score: number;           // 0–100 — confidence in factual accuracy
  passed: boolean;
  issues: string[];        // Specific facts that are questionable
  hallucinations: string[];// Statements that appear fabricated
  corrections: string[];   // Suggested corrections
  durationMs: number;
}

export interface QualityReviewResult {
  score: number;           // 0–100
  passed: boolean;
  readabilityScore: number;
  densityScore: number;
  flowScore: number;
  completenessScore: number;
  issues: string[];
  improvements: string[];
  durationMs: number;
}

export interface SEOReviewResult {
  score: number;           // 0–100
  passed: boolean;
  titleScore: number;
  metaScore: number;
  headingScore: number;
  keywordCoverageScore: number;
  intentScore: number;
  issues: string[];
  suggestions: string[];
  durationMs: number;
}

export interface EditorialReviewResult {
  factCheck: FactCheckResult;
  qualityReview: QualityReviewResult;
  seoReview: SEOReviewResult;
  overallScore: number;    // Weighted average
  passed: boolean;         // true if all three pass
  totalDurationMs: number;
  llmCallCount: number;    // always 3
}

// ─── Thresholds (configurable) ────────────────────────────────────────────────

const FACT_CHECK_THRESHOLD = 65;
const QUALITY_THRESHOLD = 70;
const SEO_THRESHOLD = 65;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJSON<T>(raw: string, fallback: T): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try { return JSON.parse(cleaned) as T; } catch {
    const match = cleaned.match(/(\{[\s\S]*\})/);
    if (match) { try { return JSON.parse(match[1]) as T; } catch { /* fall */ } }
    return fallback;
  }
}

// ─── Pass 1: Fact Checker ─────────────────────────────────────────────────────

const FACT_CHECK_SYSTEM = `You are an expert fact-checker at an educational publishing company.
Your job is to verify every factual claim in the article with high rigor.
Look for: incorrect definitions, wrong statistics, hallucinated entities, inconsistent claims.
Output ONLY valid JSON. No markdown. No extra text.`;

function buildFactCheckPrompt(content: string, keyword: string): string {
  return `Fact-check this article about "${keyword}".

ARTICLE:
${content.slice(0, 6000)}

Return ONLY this JSON:
{
  "score": 85,
  "issues": ["Claim X is inaccurate because..."],
  "hallucinations": ["Statement Y appears fabricated"],
  "corrections": ["X should be corrected to Y"]
}

Rules:
- score: 0-100 (100 = perfectly accurate, 0 = full of errors)
- Be specific about each issue
- If no issues found, return empty arrays
- Focus on factual accuracy, not writing style`;
}

export async function runFactChecker(
  content: string,
  keyword: string
): Promise<FactCheckResult> {
  const start = Date.now();
  const provider = getActiveLLMProvider();

  const response = await provider.complete({
    systemPrompt: FACT_CHECK_SYSTEM,
    userPrompt: buildFactCheckPrompt(content, keyword),
    temperature: 0.1,
    maxTokens: 1500,
  });

  const parsed = parseJSON<{ score: number; issues: string[]; hallucinations: string[]; corrections: string[] }>(
    response.content,
    { score: 70, issues: [], hallucinations: [], corrections: [] }
  );

  const score = Math.max(0, Math.min(100, parsed.score ?? 70));
  return {
    score,
    passed: score >= FACT_CHECK_THRESHOLD,
    issues: parsed.issues ?? [],
    hallucinations: parsed.hallucinations ?? [],
    corrections: parsed.corrections ?? [],
    durationMs: Date.now() - start,
  };
}

// ─── Pass 2: Quality Reviewer ─────────────────────────────────────────────────

const QUALITY_SYSTEM = `You are a senior editor at an educational knowledge platform.
Evaluate the article's overall quality as a learning resource.
Be honest and rigorous. Output ONLY valid JSON. No markdown.`;

function buildQualityPrompt(content: string, keyword: string): string {
  return `Review the quality of this educational article about "${keyword}".

ARTICLE:
${content.slice(0, 6000)}

Return ONLY this JSON:
{
  "score": 78,
  "readabilityScore": 80,
  "densityScore": 75,
  "flowScore": 78,
  "completenessScore": 79,
  "issues": ["Section X lacks examples", "Introduction is too brief"],
  "improvements": ["Add a real-world example in section Y", "Expand the conclusion"]
}

Scoring criteria:
- readabilityScore: Is it easy to read? Natural language? No jargon overload?
- densityScore: Does every sentence add value? No filler?
- flowScore: Does it flow logically? Good transitions?
- completenessScore: Does it fully cover the topic?
- score: weighted average of above
- All scores 0-100`;
}

export async function runQualityReviewer(
  content: string,
  keyword: string
): Promise<QualityReviewResult> {
  const start = Date.now();
  const provider = getActiveLLMProvider();

  const response = await provider.complete({
    systemPrompt: QUALITY_SYSTEM,
    userPrompt: buildQualityPrompt(content, keyword),
    temperature: 0.2,
    maxTokens: 1500,
  });

  const parsed = parseJSON<{
    score: number; readabilityScore: number; densityScore: number;
    flowScore: number; completenessScore: number; issues: string[]; improvements: string[];
  }>(response.content, {
    score: 70, readabilityScore: 70, densityScore: 70,
    flowScore: 70, completenessScore: 70, issues: [], improvements: [],
  });

  const score = Math.max(0, Math.min(100, parsed.score ?? 70));
  return {
    score,
    passed: score >= QUALITY_THRESHOLD,
    readabilityScore: parsed.readabilityScore ?? 70,
    densityScore: parsed.densityScore ?? 70,
    flowScore: parsed.flowScore ?? 70,
    completenessScore: parsed.completenessScore ?? 70,
    issues: parsed.issues ?? [],
    improvements: parsed.improvements ?? [],
    durationMs: Date.now() - start,
  };
}

// ─── Pass 3: SEO Reviewer ─────────────────────────────────────────────────────

const SEO_SYSTEM = `You are an expert SEO editor at an educational publishing company.
Evaluate the article's SEO quality. Be specific and actionable.
Output ONLY valid JSON. No markdown.`;

function buildSEOPrompt(
  content: string,
  keyword: string,
  metaTitle: string,
  metaDescription: string
): string {
  return `Review the SEO quality of this article.

Keyword: "${keyword}"
Meta Title: "${metaTitle}"
Meta Description: "${metaDescription}"

ARTICLE:
${content.slice(0, 5000)}

Return ONLY this JSON:
{
  "score": 75,
  "titleScore": 80,
  "metaScore": 72,
  "headingScore": 78,
  "keywordCoverageScore": 70,
  "intentScore": 76,
  "issues": ["Meta description too short", "H2 headings don't include keyword variants"],
  "suggestions": ["Add keyword to first H2", "Extend meta description to 140+ chars"]
}

Scoring criteria (all 0-100):
- titleScore: Does meta title have keyword? Under 60 chars? Compelling?
- metaScore: Does meta description have keyword? 120-155 chars? Has CTA?
- headingScore: Are H2/H3s descriptive? Do they cover topic angles?
- keywordCoverageScore: Is primary keyword + variants naturally used throughout?
- intentScore: Does the article match search intent for this keyword?
- score: weighted average`;
}

export async function runSEOReviewer(
  content: string,
  keyword: string,
  metaTitle: string,
  metaDescription: string
): Promise<SEOReviewResult> {
  const start = Date.now();
  const provider = getActiveLLMProvider();

  const response = await provider.complete({
    systemPrompt: SEO_SYSTEM,
    userPrompt: buildSEOPrompt(content, keyword, metaTitle, metaDescription),
    temperature: 0.1,
    maxTokens: 1500,
  });

  const parsed = parseJSON<{
    score: number; titleScore: number; metaScore: number; headingScore: number;
    keywordCoverageScore: number; intentScore: number; issues: string[]; suggestions: string[];
  }>(response.content, {
    score: 70, titleScore: 70, metaScore: 70, headingScore: 70,
    keywordCoverageScore: 70, intentScore: 70, issues: [], suggestions: [],
  });

  const score = Math.max(0, Math.min(100, parsed.score ?? 70));
  return {
    score,
    passed: score >= SEO_THRESHOLD,
    titleScore: parsed.titleScore ?? 70,
    metaScore: parsed.metaScore ?? 70,
    headingScore: parsed.headingScore ?? 70,
    keywordCoverageScore: parsed.keywordCoverageScore ?? 70,
    intentScore: parsed.intentScore ?? 70,
    issues: parsed.issues ?? [],
    suggestions: parsed.suggestions ?? [],
    durationMs: Date.now() - start,
  };
}

// ─── Full Editorial Review (all 3 passes) ─────────────────────────────────────

export async function runFullEditorialReview(
  content: string,
  keyword: string,
  metaTitle: string,
  metaDescription: string
): Promise<EditorialReviewResult> {
  const start = Date.now();

  const [factCheck, qualityReview, seoReview] = await Promise.all([
    runFactChecker(content, keyword),
    runQualityReviewer(content, keyword),
    runSEOReviewer(content, keyword, metaTitle, metaDescription),
  ]);

  // Weighted average: quality 40%, fact 35%, seo 25%
  const overallScore = Math.round(
    qualityReview.score * 0.40 +
    factCheck.score * 0.35 +
    seoReview.score * 0.25
  );

  return {
    factCheck,
    qualityReview,
    seoReview,
    overallScore,
    passed: factCheck.passed && qualityReview.passed && seoReview.passed,
    totalDurationMs: Date.now() - start,
    llmCallCount: 3,
  };
}
