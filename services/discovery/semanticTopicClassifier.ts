/**
 * Semantic Topic Classification
 * 
 * Classifies articles into topics using semantic analysis instead of keyword matching
 * Primary discovery decision mechanism
 */

export interface TopicClassification {
  topicId: string | null;
  topicName: string;
  confidence: number;
  relevanceScore: number;
  isNewTopic: boolean;
  semanticDistance: number;
}

export interface ArticleContent {
  title: string;
  content: string;
  url: string;
}

/**
 * Topic embeddings (simplified - in production would use actual embeddings)
 */
const TOPIC_EMBEDDINGS: Record<string, string[]> = {
  'python': ['python', 'programming', 'language', 'code', 'development', 'scripting', 'framework'],
  'javascript': ['javascript', 'js', 'node', 'react', 'vue', 'frontend', 'browser', 'web'],
  'machine-learning': ['machine learning', 'ml', 'ai', 'artificial intelligence', 'neural', 'model', 'training'],
  'cloud-computing': ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'infrastructure', 'deployment'],
  'cybersecurity': ['security', 'cyber', 'encryption', 'vulnerability', 'attack', 'defense', 'privacy'],
  'data-science': ['data', 'analytics', 'statistics', 'visualization', 'analysis', 'insights'],
  'devops': ['devops', 'ci/cd', 'deployment', 'infrastructure', 'automation', 'monitoring'],
  'mobile': ['mobile', 'ios', 'android', 'app', 'react native', 'flutter', 'smartphone'],
};

/**
 * Category embeddings
 */
const CATEGORY_EMBEDDINGS: Record<string, string[]> = {
  'technology': ['technology', 'software', 'hardware', 'digital', 'tech', 'computing', 'innovation'],
  'business': ['business', 'startup', 'enterprise', 'company', 'market', 'finance', 'economy'],
  'finance': ['finance', 'money', 'investment', 'banking', 'trading', 'financial', 'economy'],
  'science': ['science', 'research', 'study', 'scientific', 'experiment', 'discovery', 'academic'],
  'health': ['health', 'medical', 'wellness', 'healthcare', 'medicine', 'fitness', 'nutrition'],
};

/**
 * Classify article into topics using semantic similarity
 */
export function classifyTopicSemantic(article: ArticleContent): TopicClassification {
  const text = `${article.title} ${article.content}`.toLowerCase();
  const words = text.split(/\s+/);
  
  let bestMatch: TopicClassification = {
    topicId: null,
    topicName: 'unknown',
    confidence: 0,
    relevanceScore: 0,
    isNewTopic: true,
    semanticDistance: 1.0,
  };

  // Calculate semantic similarity with each topic
  for (const [topic, embeddings] of Object.entries(TOPIC_EMBEDDINGS)) {
    const similarity = calculateSemanticSimilarity(words, embeddings);
    
    if (similarity > bestMatch.confidence) {
      bestMatch = {
        topicId: topic,
        topicName: topic,
        confidence: similarity,
        relevanceScore: similarity,
        isNewTopic: similarity < 0.3,
        semanticDistance: 1 - similarity,
      };
    }
  }

  // If confidence is too low, mark as new topic
  if (bestMatch.confidence < 0.2) {
    bestMatch.isNewTopic = true;
    bestMatch.topicId = null;
    bestMatch.topicName = 'new-topic';
  }

  return bestMatch;
}

/**
 * Classify article into category using semantic similarity
 */
export function classifyCategorySemantic(article: ArticleContent): {
  category: string;
  confidence: number;
} {
  const text = `${article.title} ${article.content}`.toLowerCase();
  const words = text.split(/\s+/);
  
  let bestMatch = {
    category: 'general',
    confidence: 0,
  };

  for (const [category, embeddings] of Object.entries(CATEGORY_EMBEDDINGS)) {
    const similarity = calculateSemanticSimilarity(words, embeddings);
    
    if (similarity > bestMatch.confidence) {
      bestMatch = {
        category,
        confidence: similarity,
      };
    }
  }

  return bestMatch;
}

/**
 * Calculate semantic similarity using Jaccard index
 */
function calculateSemanticSimilarity(articleWords: string[], topicEmbeddings: string[]): number {
  const articleSet = new Set(articleWords);
  const topicSet = new Set(topicEmbeddings);
  
  const intersection = new Set([...articleSet].filter(x => topicSet.has(x)));
  const union = new Set([...articleSet, ...topicSet]);
  
  if (union.size === 0) return 0;
  
  // Enhanced similarity with partial matching
  let partialMatches = 0;
  for (const articleWord of articleSet) {
    for (const topicWord of topicSet) {
      if (articleWord.includes(topicWord) || topicWord.includes(articleWord)) {
        partialMatches += 0.5;
      }
    }
  }
  
  const jaccard = intersection.size / union.size;
  const enhancedScore = Math.min(1, jaccard + (partialMatches / articleSet.size));
  
  return enhancedScore;
}

/**
 * Extract key entities from article
 */
export function extractEntities(article: ArticleContent): {
  technologies: string[];
  companies: string[];
  concepts: string[];
  metrics: string[];
} {
  const text = `${article.title} ${article.content}`.toLowerCase();
  const words = text.split(/\s+/);
  
  const technologies: string[] = [];
  const companies: string[] = [];
  const concepts: string[] = [];
  const metrics: string[] = [];
  
  // Common technology patterns
  const techPatterns = [
    /python|javascript|java|c\+\+|rust|go|swift|kotlin|typescript/g,
    /react|angular|vue|svelte|next\.js|nuxt\.js/g,
    /aws|azure|gcp|docker|kubernetes|terraform/g,
    /machine learning|deep learning|neural network|ai/g,
  ];
  
  // Company patterns
  const companyPatterns = [
    /google|amazon|microsoft|apple|meta|tesla|nvidia/g,
    /spotify|netflix|airbnb|uber|lyft/g,
    /openai|anthropic|stability ai/g,
  ];
  
  // Concept patterns
  const conceptPatterns = [
    /api|rest|graphql|microservices|serverless/g,
    /ci\/cd|devops|agile|scrum|kanban/g,
    /cloud|saas|paas|iaas|container/g,
  ];
  
  // Extract technologies
  for (const pattern of techPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      technologies.push(...matches);
    }
  }
  
  // Extract companies
  for (const pattern of companyPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      companies.push(...matches);
    }
  }
  
  // Extract concepts
  for (const pattern of conceptPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      concepts.push(...matches);
    }
  }
  
  // Extract metrics (numbers with units)
  const metricPattern = /\d+\s*(%|ms|gb|mb|kb|seconds?|minutes?|hours?|days?)/g;
  const metricMatches = text.match(metricPattern);
  if (metricMatches) {
    metrics.push(...metricMatches);
  }
  
  return {
    technologies: [...new Set(technologies)],
    companies: [...new Set(companies)],
    concepts: [...new Set(concepts)],
    metrics: [...new Set(metrics)],
  };
}

/**
 * Match article to subject model
 */
export function matchToSubjectModel(
  article: ArticleContent,
  existingTopics: string[]
): {
  subjectModelId: string | null;
  matchScore: number;
  shouldCreateNew: boolean;
} {
  const classification = classifyTopicSemantic(article);
  const entities = extractEntities(article);
  
  // Calculate match score with existing topics
  let maxMatchScore = 0;
  let bestMatchId: string | null = null;
  
  for (const topic of existingTopics) {
    const topicEmbedding = TOPIC_EMBEDDINGS[topic] || [];
    const text = `${article.title} ${article.content}`.toLowerCase();
    const words = text.split(/\s+/);
    
    const similarity = calculateSemanticSimilarity(words, topicEmbedding);
    if (similarity > maxMatchScore) {
      maxMatchScore = similarity;
      bestMatchId = topic;
    }
  }
  
  // Entity-based matching
  const entityBonus = entities.technologies.length * 0.1 + 
                      entities.companies.length * 0.05 +
                      entities.concepts.length * 0.1;
  
  const finalScore = Math.min(1, maxMatchScore + entityBonus);
  
  return {
    subjectModelId: finalScore > 0.4 ? bestMatchId : null,
    matchScore: finalScore,
    shouldCreateNew: finalScore < 0.4,
  };
}

/**
 * Batch classify multiple articles
 */
export function batchClassifyTopics(articles: ArticleContent[]): TopicClassification[] {
  return articles.map(article => classifyTopicSemantic(article));
}

/**
 * Get topic distribution for articles
 */
export function getTopicDistribution(classifications: TopicClassification[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  for (const classification of classifications) {
    const topic = classification.topicName;
    distribution[topic] = (distribution[topic] || 0) + 1;
  }
  
  return distribution;
}
