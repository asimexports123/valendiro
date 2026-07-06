/**
 * Discovery Quality Filter
 * 
 * Improve discovery quality. Reject:
 * - Thin content
 * - Spam
 * - Duplicate URLs
 * - Syndicated copies
 * - AI spam websites
 * 
 * Prefer:
 * - Original publisher
 * - Canonical URL
 * - Trusted domain
 */

import { evaluateSourceTrust } from './sourceTrustEngine';

export interface ArticleQuality {
  url: string;
  title: string;
  content: string;
  domain: string;
  contentLength: number;
  wordCount: number;
  trustScore: number;
  qualityScore: number;
  shouldReject: boolean;
  rejectReason?: string;
  isCanonical: boolean;
  isOriginal: boolean;
}

export interface FilterResult {
  accepted: ArticleQuality[];
  rejected: ArticleQuality[];
  acceptanceRate: number;
  filterStats: {
    thinContent: number;
    spam: number;
    duplicates: number;
    syndicated: number;
    aiSpam: number;
    lowTrust: number;
  };
}

/**
 * Minimum content thresholds
 */
const MIN_CONTENT_LENGTH = 200;
const MIN_WORD_COUNT = 50;
const MIN_QUALITY_SCORE = 50;

/**
 * Spam detection patterns
 */
const SPAM_PATTERNS = [
  /click here/gi,
  /buy now/gi,
  /limited time/gi,
  /act now/gi,
  /free money/gi,
  /get rich/gi,
  /winner/gi,
  /congratulations/gi,
];

/**
 * AI spam domain patterns
 */
const AI_SPAM_DOMAINS = [
  'ai-content',
  'auto-generated',
  'chatgpt-blog',
  'llm-content',
];

/**
 * Syndication detection patterns
 */
const SYNDICATION_PATTERNS = [
  /syndicated/gi,
  /reposted/gi,
  /republished/gi,
  /originally published/gi,
  /via @/gi,
  /source: /gi,
];

/**
 * Filter articles based on quality criteria
 */
export function filterArticlesByQuality(articles: any[]): FilterResult {
  const accepted: ArticleQuality[] = [];
  const rejected: ArticleQuality[] = [];
  const filterStats = {
    thinContent: 0,
    spam: 0,
    duplicates: 0,
    syndicated: 0,
    aiSpam: 0,
    lowTrust: 0,
  };

  const seenUrls = new Set<string>();
  const seenContentHashes = new Set<string>();

  for (const article of articles) {
    const quality = assessArticleQuality(article, seenUrls, seenContentHashes);

    if (quality.shouldReject) {
      rejected.push(quality);
      
      // Track rejection reasons
      if (quality.rejectReason?.includes('thin content')) filterStats.thinContent++;
      if (quality.rejectReason?.includes('spam')) filterStats.spam++;
      if (quality.rejectReason?.includes('duplicate')) filterStats.duplicates++;
      if (quality.rejectReason?.includes('syndicated')) filterStats.syndicated++;
      if (quality.rejectReason?.includes('AI spam')) filterStats.aiSpam++;
      if (quality.rejectReason?.includes('low trust')) filterStats.lowTrust++;
    } else {
      accepted.push(quality);
      seenUrls.add(article.url);
      seenContentHashes.add(hashContent(article.content));
    }
  }

  const acceptanceRate = articles.length > 0 ? (accepted.length / articles.length) * 100 : 0;

  return {
    accepted,
    rejected,
    acceptanceRate,
    filterStats,
  };
}

/**
 * Assess quality of a single article
 */
export function assessArticleQuality(
  article: any,
  seenUrls: Set<string>,
  seenContentHashes: Set<string>
): ArticleQuality {
  const content = article.content || article.description || '';
  const url = article.link || article.url || '';
  const title = article.title || '';
  const domain = extractDomain(url);

  const contentLength = content.length;
  const wordCount = content.split(/\s+/).length;

  const trustEvaluation = evaluateSourceTrust(url);
  const trustScore = trustEvaluation.trustScore.score;

  let shouldReject = false;
  let rejectReason: string | undefined;

  // Check 1: Thin content
  if (contentLength < MIN_CONTENT_LENGTH || wordCount < MIN_WORD_COUNT) {
    shouldReject = true;
    rejectReason = `thin content (${contentLength} chars, ${wordCount} words)`;
  }

  // Check 2: Duplicate URL
  if (seenUrls.has(url)) {
    shouldReject = true;
    rejectReason = 'duplicate URL';
  }

  // Check 3: Duplicate content
  const contentHash = hashContent(content);
  if (seenContentHashes.has(contentHash)) {
    shouldReject = true;
    rejectReason = 'duplicate content';
  }

  // Check 4: Spam detection
  if (detectSpam(title, content)) {
    shouldReject = true;
    rejectReason = 'spam detected';
  }

  // Check 5: AI spam detection
  if (detectAISpam(domain, url)) {
    shouldReject = true;
    rejectReason = 'AI spam website';
  }

  // Check 6: Syndicated content
  if (detectSyndicated(content)) {
    shouldReject = true;
    rejectReason = 'syndicated content';
  }

  // Check 7: Low trust source
  if (trustScore < 30) {
    shouldReject = true;
    rejectReason = 'low trust source';
  }

  // Calculate quality score
  const qualityScore = calculateQualityScore({
    contentLength,
    wordCount,
    trustScore,
    isCanonical: isCanonicalUrl(url),
    isOriginal: !detectSyndicated(content),
  });

  return {
    url,
    title,
    content,
    domain,
    contentLength,
    wordCount,
    trustScore,
    qualityScore,
    shouldReject,
    rejectReason,
    isCanonical: isCanonicalUrl(url),
    isOriginal: !detectSyndicated(content),
  };
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Hash content for duplicate detection
 */
function hashContent(content: string): string {
  // Simple hash - in production use crypto
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Detect spam in content
 */
function detectSpam(title: string, content: string): boolean {
  const combined = `${title} ${content}`.toLowerCase();
  return SPAM_PATTERNS.some(pattern => pattern.test(combined));
}

/**
 * Detect AI spam website
 */
function detectAISpam(domain: string, url: string): boolean {
  const combined = `${domain} ${url}`.toLowerCase();
  return AI_SPAM_DOMAINS.some(pattern => combined.includes(pattern));
}

/**
 * Detect syndicated content
 */
function detectSyndicated(content: string): boolean {
  return SYNDICATION_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Check if URL is canonical
 */
function isCanonicalUrl(url: string): boolean {
  // Remove common tracking parameters and check if it's the canonical version
  const canonicalUrl = url
    .replace(/[?&](utm_source|utm_medium|utm_campaign|ref|source)=[^&]*/g, '')
    .replace(/\/$/, '');
  
  return url === canonicalUrl;
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(factors: {
  contentLength: number;
  wordCount: number;
  trustScore: number;
  isCanonical: boolean;
  isOriginal: boolean;
}): number {
  let score = 0;

  // Content quality (40%)
  const contentScore = Math.min(100, (factors.contentLength / 1000) * 100);
  score += contentScore * 0.4;

  // Trust score (30%)
  score += factors.trustScore * 0.3;

  // Canonical bonus (15%)
  if (factors.isCanonical) score += 15;

  // Original content bonus (15%)
  if (factors.isOriginal) score += 15;

  return Math.round(score);
}

/**
 * Prioritize articles for processing
 */
export function prioritizeArticles(articles: ArticleQuality[]): ArticleQuality[] {
  return articles
    .sort((a, b) => {
      // Sort by quality score descending
      if (b.qualityScore !== a.qualityScore) {
        return b.qualityScore - a.qualityScore;
      }
      // Then by trust score descending
      if (b.trustScore !== a.trustScore) {
        return b.trustScore - a.trustScore;
      }
      // Then by content length descending
      return b.contentLength - a.contentLength;
    });
}

/**
 * Get canonical URL from article
 */
export function getCanonicalUrl(article: any): string {
  const url = article.link || article.url || '';
  
  // Remove tracking parameters
  const canonical = url
    .replace(/[?&](utm_source|utm_medium|utm_campaign|ref|source|fbclid|gclid)=[^&]*/g, '')
    .replace(/[?&]$/, '')
    .replace(/\/$/, '');

  return canonical;
}
