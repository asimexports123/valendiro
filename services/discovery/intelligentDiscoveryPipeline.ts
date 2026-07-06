/**
 * Intelligent Discovery Pipeline Decision Engine
 * 
 * Primary discovery decision using semantic analysis instead of keyword matching
 * Decides: relevance, new knowledge, updates, contradictions, regeneration needs
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { 
  classifyTopicSemantic, 
  classifyCategorySemantic, 
  extractEntities, 
  matchToSubjectModel 
} from "./semanticTopicClassifier";
import { 
  analyzeKnowledgeGaps, 
  compareWithKnowledgeGraph 
} from "./knowledgeGapDetector";
import { evaluateSourceTrust } from "./sourceTrustEngine";

export interface DiscoveryDecision {
  articleId: string;
  articleUrl: string;
  articleTitle: string;
  
  // Semantic Analysis
  topicClassification: {
    topicId: string | null;
    topicName: string;
    confidence: number;
    isNewTopic: boolean;
  };
  categoryClassification: {
    category: string;
    confidence: number;
  };
  entities: {
    technologies: string[];
    companies: string[];
    concepts: string[];
  };
  
  // Knowledge Graph Analysis
  knowledgeGapAnalysis: {
    hasGap: boolean;
    gapType: string;
    severity: string;
    shouldCreateNew: boolean;
    shouldUpdate: boolean;
  };
  graphComparison: {
    similarityScore: number;
    relatedPackages: string[];
    gapScore: number;
  };
  
  // Source Trust
  sourceTrust: {
    trustScore: number;
    tier: string;
    requiresCorroboration: boolean;
  };
  
  // Final Decision
  decision: {
    action: 'create-package' | 'update-package' | 'regenerate-article' | 'ignore' | 'require-review';
    confidence: number;
    reason: string;
    targetPackageId?: string;
    keywordSignal: number; // Weak signal only
  };
}

export interface PipelineResult {
  decisions: DiscoveryDecision[];
  summary: {
    totalArticles: number;
    createPackage: number;
    updatePackage: number;
    regenerateArticle: number;
    ignore: number;
    requireReview: number;
  };
}

/**
 * Process article through intelligent discovery pipeline
 */
export async function processIntelligentDiscovery(
  articles: any[]
): Promise<PipelineResult> {
  const decisions: DiscoveryDecision[] = [];
  
  for (const article of articles) {
    const decision = await makeDiscoveryDecision(article);
    decisions.push(decision);
  }

  const summary = {
    totalArticles: articles.length,
    createPackage: decisions.filter(d => d.decision.action === 'create-package').length,
    updatePackage: decisions.filter(d => d.decision.action === 'update-package').length,
    regenerateArticle: decisions.filter(d => d.decision.action === 'regenerate-article').length,
    ignore: decisions.filter(d => d.decision.action === 'ignore').length,
    requireReview: decisions.filter(d => d.decision.action === 'require-review').length,
  };

  return { decisions, summary };
}

/**
 * Make intelligent discovery decision for a single article
 */
async function makeDiscoveryDecision(article: any): Promise<DiscoveryDecision> {
  const articleContent = {
    title: article.title || '',
    content: article.content || article.description || '',
    url: article.link || article.url || '',
  };

  // Step 1: Semantic Topic Classification
  const topicClassification = classifyTopicSemantic(articleContent);
  
  // Step 2: Category Classification
  const categoryClassification = classifyCategorySemantic(articleContent);
  
  // Step 3: Entity Extraction
  const entities = extractEntities(articleContent);
  
  // Step 4: Subject Model Matching
  const supabase = createAdminClient();
  const { data: existingTopics } = await supabase
    .from('topics')
    .select('id, slug')
    .limit(20);
  
  const topicSlugs = existingTopics?.map(t => t.slug) || [];
  const subjectModelMatch = matchToSubjectModel(articleContent, topicSlugs);
  
  // Step 5: Knowledge Gap Detection
  const gapAnalysis = await analyzeKnowledgeGaps(articleContent);
  
  // Step 6: Knowledge Graph Comparison
  const graphComparison = await compareWithKnowledgeGraph(articleContent);
  
  // Step 7: Source Trust Evaluation
  const sourceTrust = evaluateSourceTrust(articleContent.url);
  
  // Step 8: Keyword Signal (weak signal only)
  const keywordSignal = calculateKeywordSignal(articleContent);
  
  // Step 9: Make Final Decision
  const decision = makeFinalDecision({
    topicClassification,
    categoryClassification,
    entities,
    subjectModelMatch,
    gapAnalysis,
    graphComparison,
    sourceTrust,
    keywordSignal,
  });

  return {
    articleId: article.id || crypto.randomUUID(),
    articleUrl: articleContent.url,
    articleTitle: articleContent.title,
    topicClassification: {
      topicId: topicClassification.topicId,
      topicName: topicClassification.topicName,
      confidence: topicClassification.confidence,
      isNewTopic: topicClassification.isNewTopic,
    },
    categoryClassification,
    entities,
    knowledgeGapAnalysis: {
      hasGap: gapAnalysis.hasGap,
      gapType: gapAnalysis.gaps[0]?.gapType || 'none',
      severity: gapAnalysis.overallSeverity,
      shouldCreateNew: gapAnalysis.shouldCreateNewPackage,
      shouldUpdate: gapAnalysis.shouldUpdateExisting,
    },
    graphComparison: {
      similarityScore: graphComparison.similarityScore,
      relatedPackages: graphComparison.relatedPackages,
      gapScore: graphComparison.gapScore,
    },
    sourceTrust: {
      trustScore: sourceTrust.trustScore.score,
      tier: sourceTrust.trustScore.tier,
      requiresCorroboration: sourceTrust.requiresCorroboration,
    },
    decision,
  };
}

/**
 * Make final decision based on all semantic analyses
 */
function makeFinalDecision(analysis: {
  topicClassification: any;
  categoryClassification: any;
  entities: any;
  subjectModelMatch: any;
  gapAnalysis: any;
  graphComparison: any;
  sourceTrust: any;
  keywordSignal: number;
}): DiscoveryDecision['decision'] {
  const {
    topicClassification,
    gapAnalysis,
    graphComparison,
    sourceTrust,
    keywordSignal,
  } = analysis;

  // Decision logic with semantic analysis as primary
  let action: 'create-package' | 'update-package' | 'regenerate-article' | 'ignore' | 'require-review' = 'require-review';
  let confidence = 0;
  let reason = '';
  let targetPackageId: string | undefined;

  // Priority 1: Critical knowledge gaps
  if (gapAnalysis.hasGap && gapAnalysis.overallSeverity === 'critical') {
    if (gapAnalysis.shouldCreateNew) {
      action = 'create-package';
      confidence = 0.9;
      reason = 'Critical knowledge gap detected - new topic requires package creation';
    } else if (gapAnalysis.shouldUpdate) {
      action = 'update-package';
      confidence = 0.85;
      reason = 'Critical knowledge gap detected - existing package requires update';
    }
  }
  // Priority 2: New topic with high confidence
  else if (topicClassification.isNewTopic && topicClassification.confidence > 0.5) {
    action = 'create-package';
    confidence = topicClassification.confidence;
    reason = 'New semantic topic detected with high confidence';
  }
  // Priority 3: High gap score from graph comparison
  else if (graphComparison.gapScore > 0.7) {
    action = 'create-package';
    confidence = 0.8;
    reason = 'Low similarity with existing knowledge graph - likely new knowledge';
  }
  // Priority 4: Contradictions detected
  else if (gapAnalysis.gaps.some((g: any) => g.gapType === 'contradiction')) {
    action = 'regenerate-article';
    confidence = 0.75;
    reason = 'Contradiction with existing knowledge detected - requires investigation and regeneration';
  }
  // Priority 5: Outdated information
  else if (gapAnalysis.gaps.some((g: any) => g.gapType === 'outdated-information')) {
    action = 'update-package';
    confidence = 0.8;
    reason = 'Article contains more recent information than existing knowledge';
  }
  // Priority 6: Medium gap score
  else if (graphComparison.gapScore > 0.4) {
    action = 'update-package';
    confidence = 0.6;
    reason = 'Moderate similarity with existing knowledge - may enhance existing package';
  }
  // Priority 7: Low source trust
  else if (sourceTrust.trustScore < 30) {
    action = 'ignore';
    confidence = 0.9;
    reason = 'Source trust score too low - ignoring article';
  }
  // Priority 8: High similarity but low gap - likely duplicate
  else if (graphComparison.similarityScore > 0.8 && graphComparison.gapScore < 0.2) {
    action = 'ignore';
    confidence = 0.85;
    reason = 'High similarity with existing knowledge - likely duplicate content';
  }
  // Priority 9: Low confidence semantic match
  else if (topicClassification.confidence < 0.3) {
    action = 'require-review';
    confidence = 0.5;
    reason = 'Low semantic confidence - requires manual review';
  }
  // Default: require review
  else {
    action = 'require-review';
    confidence = 0.4;
    reason = 'Insufficient semantic signals for automatic decision';
  }

  // Adjust confidence based on source trust
  if (sourceTrust.requiresCorroboration) {
    confidence *= 0.8; // Reduce confidence for untrusted sources
  }

  // Add keyword signal as weak weight (max 10% impact)
  const adjustedConfidence = confidence + (keywordSignal * 0.1);

  return {
    action,
    confidence: Math.min(1, adjustedConfidence),
    reason,
    targetPackageId,
    keywordSignal,
  };
}

/**
 * Calculate keyword signal (weak signal only)
 */
function calculateKeywordSignal(articleContent: {
  title: string;
  content: string;
}): number {
  const text = `${articleContent.title} ${articleContent.content}`.toLowerCase();
  
  // Common technology keywords (weak signal)
  const keywords = [
    'python', 'javascript', 'machine learning', 'cloud', 'devops',
    'security', 'data', 'api', 'database', 'frontend', 'backend',
  ];
  
  let matchCount = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      matchCount++;
    }
  }
  
  // Normalize to 0-1 range
  return Math.min(1, matchCount / keywords.length);
}

/**
 * Batch process articles with intelligent discovery
 */
export async function batchProcessIntelligentDiscovery(
  articles: any[]
): Promise<PipelineResult> {
  console.log(`Processing ${articles.length} articles through intelligent discovery pipeline...`);
  
  const result = await processIntelligentDiscovery(articles);
  
  console.log(`\nIntelligent Discovery Summary:`);
  console.log(`  Total Articles: ${result.summary.totalArticles}`);
  console.log(`  Create Package: ${result.summary.createPackage}`);
  console.log(`  Update Package: ${result.summary.updatePackage}`);
  console.log(`  Regenerate Article: ${result.summary.regenerateArticle}`);
  console.log(`  Ignore: ${result.summary.ignore}`);
  console.log(`  Require Review: ${result.summary.requireReview}`);
  
  return result;
}
