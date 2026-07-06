/**
 * Knowledge Gap Detection
 * 
 * Detects gaps in existing knowledge and identifies genuinely new knowledge
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface KnowledgeGap {
  gapType: 'new-topic' | 'missing-concept' | 'outdated-information' | 'contradiction' | 'insufficient-depth';
  topic: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  suggestedActions: string[];
}

export interface GapAnalysisResult {
  hasGap: boolean;
  gaps: KnowledgeGap[];
  overallSeverity: 'critical' | 'high' | 'medium' | 'low';
  shouldCreateNewPackage: boolean;
  shouldUpdateExisting: boolean;
  shouldRegenerate: boolean;
}

export interface ArticleContent {
  title: string;
  content: string;
  url: string;
}

/**
 * Analyze article for knowledge gaps
 */
export async function analyzeKnowledgeGaps(
  article: ArticleContent
): Promise<GapAnalysisResult> {
  const supabase = createAdminClient();
  const gaps: KnowledgeGap[] = [];
  
  // Get existing knowledge packages
  const { data: existingPackages } = await supabase
    .from('knowledge_packages')
    .select('id, slug, fact_count, last_verified_at, knowledge_hash')
    .eq('status', 'ready')
    .limit(20);

  if (!existingPackages || existingPackages.length === 0) {
    // No existing knowledge - everything is a gap
    gaps.push({
      gapType: 'new-topic',
      topic: 'general',
      description: 'No existing knowledge packages found',
      severity: 'critical',
      confidence: 1.0,
      suggestedActions: ['Create initial knowledge package'],
    });
    
    return {
      hasGap: true,
      gaps,
      overallSeverity: 'critical',
      shouldCreateNewPackage: true,
      shouldUpdateExisting: false,
      shouldRegenerate: false,
    };
  }

  // Check for new concepts not in existing knowledge
  const newConcepts = detectNewConcepts(article, existingPackages);
  if (newConcepts.length > 0) {
    gaps.push({
      gapType: 'missing-concept',
      topic: newConcepts.join(', '),
      description: 'New concepts detected that are not in existing knowledge',
      severity: 'high',
      confidence: 0.8,
      suggestedActions: ['Add new concepts to existing package', 'Create new package if concepts are substantial'],
    });
  }

  // Check for outdated information
  const outdatedInfo = detectOutdatedInformation(article, existingPackages);
  if (outdatedInfo.hasOutdated) {
    gaps.push({
      gapType: 'outdated-information',
      topic: outdatedInfo.topic,
      description: 'Article contains more recent information than existing knowledge',
      severity: 'high',
      confidence: 0.9,
      suggestedActions: ['Update existing knowledge package with new information'],
    });
  }

  // Check for contradictions
  const contradictions = detectContradictions(article, existingPackages);
  if (contradictions.length > 0) {
    gaps.push({
      gapType: 'contradiction',
      topic: contradictions.join(', '),
      description: 'Article contradicts existing knowledge',
      severity: 'critical',
      confidence: 0.7,
      suggestedActions: ['Investigate contradiction', 'Verify sources', 'Update knowledge with correct information'],
    });
  }

  // Check for insufficient depth
  const insufficientDepth = detectInsufficientDepth(article, existingPackages);
  if (insufficientDepth.hasInsufficientDepth) {
    gaps.push({
      gapType: 'insufficient-depth',
      topic: insufficientDepth.topic,
      description: 'Existing knowledge lacks depth compared to article',
      severity: 'medium',
      confidence: 0.6,
      suggestedActions: ['Enhance existing knowledge with additional details'],
    });
  }

  // Determine overall severity
  const overallSeverity = calculateOverallSeverity(gaps);

  // Determine actions
  const shouldCreateNewPackage = gaps.some(g => g.gapType === 'new-topic');
  const shouldUpdateExisting = gaps.some(g => 
    g.gapType === 'missing-concept' || 
    g.gapType === 'outdated-information' ||
    g.gapType === 'insufficient-depth'
  );
  const shouldRegenerate = gaps.some(g => 
    g.gapType === 'outdated-information' || 
    g.gapType === 'contradiction'
  );

  return {
    hasGap: gaps.length > 0,
    gaps,
    overallSeverity,
    shouldCreateNewPackage,
    shouldUpdateExisting,
    shouldRegenerate,
  };
}

/**
 * Detect new concepts not in existing knowledge
 */
function detectNewConcepts(
  article: ArticleContent,
  existingPackages: any[]
): string[] {
  const articleWords = new Set(
    `${article.title} ${article.content}`
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4) // Filter short words
  );

  const existingConcepts = new Set<string>();
  
  // In production, this would analyze actual content of existing packages
  // For now, use a simple heuristic
  for (const pkg of existingPackages) {
    const topicWords = pkg.slug.split('-');
    topicWords.forEach((word: string) => existingConcepts.add(word));
  }

  const newConcepts = [...articleWords].filter(word => !existingConcepts.has(word));
  
  // Return top new concepts
  return newConcepts.slice(0, 5);
}

/**
 * Detect outdated information
 */
function detectOutdatedInformation(
  article: ArticleContent,
  existingPackages: any[]
): { hasOutdated: boolean; topic: string } {
  // Check if article mentions recent dates/versions
  const currentYear = new Date().getFullYear();
  const text = `${article.title} ${article.content}`.toLowerCase();
  
  const recentMentions = text.match(new RegExp(`\\b(20${currentYear.toString().slice(2)}|${currentYear})\\b`));
  
  if (recentMentions) {
    // Check if existing packages are old
    const oldPackages = existingPackages.filter(pkg => {
      const lastVerified = new Date(pkg.last_verified_at);
      const monthsSinceUpdate = (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsSinceUpdate > 6; // Older than 6 months
    });

    if (oldPackages.length > 0) {
      return {
        hasOutdated: true,
        topic: oldPackages[0].slug,
      };
    }
  }

  return { hasOutdated: false, topic: '' };
}

/**
 * Detect contradictions with existing knowledge
 */
function detectContradictions(
  article: ArticleContent,
  existingPackages: any[]
): string[] {
  const contradictions: string[] = [];
  
  // Contradiction patterns (simplified)
  const contradictionPatterns = [
    { pattern: /not supported/gi, antonym: /supported/gi },
    { pattern: /deprecated/gi, antonym: /recommended/gi },
    { pattern: /removed/gi, antonym: /available/gi },
    { pattern: /discontinued/gi, antonym: /active/gi },
  ];

  const text = `${article.title} ${article.content}`.toLowerCase();

  for (const { pattern, antonym } of contradictionPatterns) {
    if (pattern.test(text)) {
      // Check if existing knowledge contains the antonym
      // In production, this would query actual knowledge content
      if (existingPackages.some(pkg => pkg.slug.includes('recommended') || pkg.slug.includes('supported'))) {
        contradictions.push('Version support contradiction');
      }
    }
  }

  return contradictions;
}

/**
 * Detect insufficient depth in existing knowledge
 */
function detectInsufficientDepth(
  article: ArticleContent,
  existingPackages: any[]
): { hasInsufficientDepth: boolean; topic: string } {
  const articleWordCount = article.content.split(/\s+/).length;
  
  // Find most relevant existing package
  const relevantPackage = existingPackages[0]; // Simplified
  
  if (relevantPackage && relevantPackage.fact_count < 10) {
    return {
      hasInsufficientDepth: articleWordCount > 500, // Article is substantial but existing knowledge is sparse
      topic: relevantPackage.slug,
    };
  }

  return { hasInsufficientDepth: false, topic: '' };
}

/**
 * Calculate overall severity from gaps
 */
function calculateOverallSeverity(gaps: KnowledgeGap[]): 'critical' | 'high' | 'medium' | 'low' {
  if (gaps.some(g => g.severity === 'critical')) return 'critical';
  if (gaps.some(g => g.severity === 'high')) return 'high';
  if (gaps.some(g => g.severity === 'medium')) return 'medium';
  return 'low';
}

/**
 * Compare article with existing Knowledge Graph
 */
export async function compareWithKnowledgeGraph(
  article: ArticleContent
): Promise<{
  similarityScore: number;
  relatedPackages: string[];
  gapScore: number;
  recommendation: 'create-new' | 'update-existing' | 'ignore';
}> {
  const supabase = createAdminClient();
  
  // Get existing packages for comparison
  const { data: existingPackages } = await supabase
    .from('knowledge_packages')
    .select('id, slug, knowledge_hash, fact_count')
    .eq('status', 'ready')
    .limit(10);

  if (!existingPackages || existingPackages.length === 0) {
    return {
      similarityScore: 0,
      relatedPackages: [],
      gapScore: 1.0,
      recommendation: 'create-new',
    };
  }

  // Calculate similarity with existing packages
  const articleText = `${article.title} ${article.content}`.toLowerCase();
  const articleWords = new Set(articleText.split(/\s+/));
  
  let maxSimilarity = 0;
  const relatedPackages: string[] = [];

  for (const pkg of existingPackages) {
    const packageWords = new Set(pkg.slug.split('-'));
    const intersection = new Set([...articleWords].filter(x => packageWords.has(x)));
    const union = new Set([...articleWords, ...packageWords]);
    
    const similarity = union.size > 0 ? intersection.size / union.size : 0;
    
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
    }
    
    if (similarity > 0.2) {
      relatedPackages.push(pkg.slug);
    }
  }

  // Calculate gap score (inverse of similarity)
  const gapScore = 1 - maxSimilarity;

  // Determine recommendation
  let recommendation: 'create-new' | 'update-existing' | 'ignore';
  if (gapScore > 0.7) {
    recommendation = 'create-new';
  } else if (gapScore > 0.3) {
    recommendation = 'update-existing';
  } else {
    recommendation = 'ignore';
  }

  return {
    similarityScore: maxSimilarity,
    relatedPackages,
    gapScore,
    recommendation,
  };
}
