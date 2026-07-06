/**
 * Source Trust Engine
 * 
 * Dynamically scores sources based on authority and quality
 * Never blindly trust a single RSS article
 */

export interface SourceTrustScore {
  score: number; // 0-100
  tier: 'critical' | 'high' | 'medium' | 'low' | 'untrusted';
  authority: string;
  factors: {
    domainAuthority: number;
    contentQuality: number;
    freshness: number;
    consistency: number;
    editorialOversight: number;
  };
}

export interface SourceEvaluation {
  url: string;
  domain: string;
  trustScore: SourceTrustScore;
  requiresCorroboration: boolean;
  recommendedMinSources: number;
}

/**
 * Domain authority tiers
 */
const DOMAIN_TIER_CRITICAL = [
  // Official documentation
  'docs.python.org', 'developer.mozilla.org', 'docs.microsoft.com', 'nodejs.org',
  'go.dev', 'rust-lang.org', 'kubernetes.io', 'docker.com',
  // Government
  'gov', 'gov.uk', 'europa.eu', 'nasa.gov', 'nih.gov',
  // Standards organizations
  'w3.org', 'ietf.org', 'iso.org', 'ieee.org',
  // Universities
  '.edu', 'mit.edu', 'stanford.edu', 'cmu.edu', 'berkeley.edu',
  // Research organizations
  'arxiv.org', 'nature.com', 'science.org', 'acm.org',
];

const DOMAIN_TIER_HIGH = [
  // Official company engineering blogs
  'engineering.atspotify.com', 'netflixtechblog.com', 'medium.com/spotify-engineering',
  'aws.amazon.com/blogs', 'cloud.google.com/blog', 'azure.microsoft.com/blog',
  'developers.google.com', 'blog.github.com',
  // Well-known publishers
  'nytimes.com', 'washingtonpost.com', 'wsj.com', 'economist.com',
  'techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com',
];

const DOMAIN_TIER_LOW = [
  // Aggregators and unknown blogs
  'blogspot.com', 'wordpress.com', 'medium.com', 'substack.com',
];

/**
 * AI spam detection patterns
 */
const AI_SPAM_PATTERNS = [
  /ai-generated/i,
  /chatgpt-written/i,
  /artificial-intelligence-content/i,
  /automated-content/i,
];

/**
 * Evaluate a source's trustworthiness
 */
export function evaluateSourceTrust(url: string): SourceEvaluation {
  const domain = extractDomain(url);
  const trustScore = calculateTrustScore(domain, url);
  
  return {
    url,
    domain,
    trustScore,
    requiresCorroboration: trustScore.tier !== 'critical',
    recommendedMinSources: getMinSourcesRequired(trustScore.tier),
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
 * Calculate trust score based on domain and content factors
 */
function calculateTrustScore(domain: string, url: string): SourceTrustScore {
  let score = 50; // Base score
  const factors = {
    domainAuthority: 50,
    contentQuality: 50,
    freshness: 50,
    consistency: 50,
    editorialOversight: 50,
  };

  // Domain authority check
  if (isCriticalDomain(domain)) {
    factors.domainAuthority = 95;
    factors.editorialOversight = 90;
  } else if (isHighDomain(domain)) {
    factors.domainAuthority = 80;
    factors.editorialOversight = 75;
  } else if (isLowDomain(domain)) {
    factors.domainAuthority = 30;
    factors.editorialOversight = 40;
  } else {
    factors.domainAuthority = 50;
    factors.editorialOversight = 50;
  }

  // AI spam detection
  if (isAISpam(url)) {
    factors.contentQuality = 10;
    factors.editorialOversight = 5;
  }

  // Calculate overall score
  score = (
    factors.domainAuthority * 0.4 +
    factors.contentQuality * 0.2 +
    factors.editorialOversight * 0.2 +
    factors.freshness * 0.1 +
    factors.consistency * 0.1
  );

  const tier = determineTier(score);
  const authority = getAuthorityLabel(tier);

  return {
    score: Math.round(score),
    tier,
    authority,
    factors,
  };
}

/**
 * Check if domain is in critical tier
 */
function isCriticalDomain(domain: string): boolean {
  return DOMAIN_TIER_CRITICAL.some(tier => domain.includes(tier));
}

/**
 * Check if domain is in high tier
 */
function isHighDomain(domain: string): boolean {
  return DOMAIN_TIER_HIGH.some(tier => domain.includes(tier));
}

/**
 * Check if domain is in low tier
 */
function isLowDomain(domain: string): boolean {
  return DOMAIN_TIER_LOW.some(tier => domain.includes(tier));
}

/**
 * Check if URL appears to be AI-generated spam
 */
function isAISpam(url: string): boolean {
  return AI_SPAM_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Determine trust tier based on score
 */
function determineTier(score: number): SourceTrustScore['tier'] {
  if (score >= 90) return 'critical';
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'low';
  return 'untrusted';
}

/**
 * Get human-readable authority label
 */
function getAuthorityLabel(tier: SourceTrustScore['tier']): string {
  switch (tier) {
    case 'critical': return 'Official Source';
    case 'high': return 'Trusted Publisher';
    case 'medium': return 'Verified Source';
    case 'low': return 'Unknown Source';
    case 'untrusted': return 'Untrusted';
  }
}

/**
 * Get minimum number of sources required for corroboration
 */
function getMinSourcesRequired(tier: SourceTrustScore['tier']): number {
  switch (tier) {
    case 'critical': return 1;
    case 'high': return 2;
    case 'medium': return 3;
    case 'low': return 5;
    case 'untrusted': return 10;
  }
}

/**
 * Batch evaluate multiple sources
 */
export function evaluateMultipleSources(urls: string[]): SourceEvaluation[] {
  return urls.map(url => evaluateSourceTrust(url));
}

/**
 * Get aggregate trust score for multiple sources
 */
export function getAggregateTrustScore(evaluations: SourceEvaluation[]): {
  averageScore: number;
  minSourcesMet: boolean;
  recommendedMinSources: number;
  needsCorroboration: boolean;
} {
  if (evaluations.length === 0) {
    return {
      averageScore: 0,
      minSourcesMet: false,
      recommendedMinSources: 3,
      needsCorroboration: true,
    };
  }

  const averageScore = evaluations.reduce((sum, e) => sum + e.trustScore.score, 0) / evaluations.length;
  const maxRecommendedSources = Math.max(...evaluations.map(e => e.recommendedMinSources));
  const minSourcesMet = evaluations.length >= maxRecommendedSources;
  const needsCorroboration = evaluations.some(e => e.requiresCorroboration);

  return {
    averageScore: Math.round(averageScore),
    minSourcesMet,
    recommendedMinSources: maxRecommendedSources,
    needsCorroboration,
  };
}
