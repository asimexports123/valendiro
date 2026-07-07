/**
 * Trust Scoring Service
 * 
 * Calculates trust, freshness, authority, originality, and spam scores
 * for discovered content and sources
 */

import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

export interface TrustScores {
  trustScore: number;      // 0-1: Overall trustworthiness
  freshnessScore: number;  // 0-1: How recent the content is
  authorityScore: number;  // 0-1: Domain authority and expertise
  originalityScore: number; // 0-1: How unique/original the content is
  spamScore: number;       // 0-1: Likelihood of being spam/low quality
}

export interface ScoringContext {
  domain: string;
  publishedAt: Date;
  contentLength: number;
  title: string;
  url: string;
  sourceType: string;
}

/**
 * Calculate trust scores for discovered content
 */
export async function calculateTrustScores(context: ScoringContext): Promise<TrustScores> {
  const trustScore = await calculateTrustScore(context);
  const freshnessScore = calculateFreshnessScore(context.publishedAt);
  const authorityScore = await calculateAuthorityScore(context.domain);
  const originalityScore = calculateOriginalityScore(context.contentLength, context.title);
  const spamScore = await calculateSpamScore(context);

  return {
    trustScore,
    freshnessScore,
    authorityScore,
    originalityScore,
    spamScore,
  };
}

/**
 * Calculate overall trust score
 */
async function calculateTrustScore(context: ScoringContext): Promise<number> {
  let score = 0.5; // Base score

  // Domain reputation
  const domainReputation = await getDomainReputation(context.domain);
  score += domainReputation * 0.3;

  // Source type trust
  const sourceTypeTrust = getSourceTypeTrust(context.sourceType);
  score += sourceTypeTrust * 0.2;

  // URL pattern (https, no suspicious parameters)
  if (context.url.startsWith('https://')) {
    score += 0.1;
  }

  // Content quality indicators
  if (context.contentLength > 500) {
    score += 0.1;
  }

  if (context.contentLength > 2000) {
    score += 0.1;
  }

  // Title quality
  if (context.title.length > 10 && context.title.length < 200) {
    score += 0.05;
  }

  return Math.min(Math.max(score, 0), 1);
}

/**
 * Calculate freshness score based on publication date
 */
function calculateFreshnessScore(publishedAt: Date): number {
  const now = new Date();
  const ageInDays = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);

  // Freshness decays over time
  if (ageInDays < 1) return 1.0;
  if (ageInDays < 7) return 0.9;
  if (ageInDays < 30) return 0.7;
  if (ageInDays < 90) return 0.5;
  if (ageInDays < 365) return 0.3;
  return 0.1;
}

/**
 * Calculate authority score based on domain
 */
async function calculateAuthorityScore(domain: string): Promise<number> {
  let score = 0.5; // Base score

  // Known high-authority domains
  const highAuthorityDomains = [
    'gov', 'edu', 'org', // TLDs
    'mozilla.org', 'developer.mozilla.org',
    'w3.org', 'whatwg.org',
    'mdn.dev',
    'github.com', 'stackoverflow.com',
    'medium.com', 'dev.to',
  ];

  const domainLower = domain.toLowerCase();
  
  if (highAuthorityDomains.some(d => domainLower.includes(d))) {
    score += 0.3;
  }

  // Check if domain has SSL
  if (domainLower.includes('https')) {
    score += 0.1;
  }

  // Check domain age (simplified - in production use whois API)
  const domainAge = await getDomainAge(domain);
  if (domainAge > 365) { // More than 1 year old
    score += 0.1;
  }

  return Math.min(Math.max(score, 0), 1);
}

/**
 * Calculate originality score
 */
function calculateOriginalityScore(contentLength: number, title: string): number {
  let score = 0.5; // Base score

  // Content length indicates substance
  if (contentLength > 1000) score += 0.1;
  if (contentLength > 3000) score += 0.1;
  if (contentLength > 5000) score += 0.1;

  // Title uniqueness (simplified)
  const genericTitles = ['untitled', 'new post', 'update', 'news'];
  if (!genericTitles.some(t => title.toLowerCase().includes(t))) {
    score += 0.1;
  }

  return Math.min(Math.max(score, 0), 1);
}

/**
 * Calculate spam score
 */
async function calculateSpamScore(context: ScoringContext): Promise<number> {
  let score = 0.0; // Base score (0 = not spam)

  const spamIndicators = [
    'buy now', 'click here', 'free money', 'win big',
    'limited time', 'act now', 'don\'t miss',
    'congratulations', 'you have been selected',
  ];

  const titleLower = context.title.toLowerCase();
  spamIndicators.forEach(indicator => {
    if (titleLower.includes(indicator)) {
      score += 0.2;
    }
  });

  // Check for excessive punctuation
  const exclamationCount = (context.title.match(/!/g) || []).length;
  if (exclamationCount > 2) {
    score += 0.2;
  }

  // Check for all caps title
  if (context.title === context.title.toUpperCase() && context.title.length > 5) {
    score += 0.3;
  }

  // Check URL for spam patterns
  const spamUrlPatterns = ['spam', 'scam', 'fake', 'phishing'];
  spamUrlPatterns.forEach(pattern => {
    if (context.url.toLowerCase().includes(pattern)) {
      score += 0.5;
    }
  });

  return Math.min(Math.max(score, 0), 1);
}

/**
 * Get domain reputation from database
 */
async function getDomainReputation(domain: string): Promise<number> {
  const { data } = await supabase
    .from("discovery_sources")
    .select("trust_score")
    .eq("domain", domain)
    .maybeSingle();

  return data?.trust_score || 0.5;
}

/**
 * Get source type trust level
 */
function getSourceTypeTrust(sourceType: string): number {
  const trustLevels: Record<string, number> = {
    'official_docs': 0.9,
    'government': 0.9,
    'research_paper': 0.85,
    'trusted_org': 0.8,
    'feedly': 0.7,
    'rss': 0.6,
  };

  return trustLevels[sourceType] || 0.5;
}

/**
 * Get domain age (simplified - in production use whois API)
 */
async function getDomainAge(domain: string): Promise<number> {
  // Simplified - return 2 years as default
  // In production, use whois API to get actual domain age
  return 730; 
}

/**
 * Update source scores based on performance
 */
export async function updateSourceScores(sourceId: string, performance: {
  successRate: number;
  averageQuality: number;
  errorRate: number;
}): Promise<void> {
  const { data: source } = await supabase
    .from("discovery_sources")
    .select("*")
    .eq("id", sourceId)
    .single();

  if (!source) return;

  const newTrustScore = (
    source.trust_score * 0.7 +
    performance.successRate * 0.2 +
    performance.averageQuality * 0.1
  );

  const newSpamScore = Math.max(0, source.spam_score - (performance.successRate * 0.1));

  await supabase
    .from("discovery_sources")
    .update({
      trust_score: newTrustScore,
      spam_score: newSpamScore,
    })
    .eq("id", sourceId);
}
