/**
 * Automatic Topic Detection Service
 * Automatically maps discovered articles to relevant Knowledge OS topics
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface TopicMatch {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  confidence: number;
  matchMethod: "keyword" | "embedding" | "hybrid";
  matchedKeywords: string[];
}

export class TopicDetectionService {
  async detectTopicForArticle(article: any): Promise<TopicMatch | null> {
    const supabase = createAdminClient();

    // Extract keywords from article
    const articleKeywords = this.extractKeywords(article.title, article.content);

    // Fetch all published topics
    const { data: topics } = await supabase
      .from("topics")
      .select(`
        id, slug,
        topic_translations(title)
      `)
      .eq("status", "published");

    if (!topics || topics.length === 0) {
      return null;
    }

    // Find best matching topic
    let bestMatch: TopicMatch | null = null;

    for (const topic of topics) {
      const title = (topic.topic_translations as { title: string }[])?.[0]?.title || topic.slug;
      const topicKeywords = this.extractKeywords(title, "");
      
      const match = this.calculateMatch(articleKeywords, topicKeywords, title);
      
      if (!bestMatch || match.confidence > bestMatch.confidence) {
        bestMatch = {
          topicId: topic.id,
          topicSlug: topic.slug,
          topicTitle: title,
          confidence: match.confidence,
          matchMethod: match.method,
          matchedKeywords: match.matchedKeywords,
        };
      }
    }

    // Only return if confidence is above threshold
    if (bestMatch && bestMatch.confidence > 0.3) {
      return bestMatch;
    }

    return null;
  }

  async detectTopicsBatch(articleIds: string[]): Promise<Map<string, TopicMatch | null>> {
    const supabase = createAdminClient();
    const results = new Map<string, TopicMatch | null>();

    const { data: articles } = await supabase
      .from("discovered_articles")
      .select("*")
      .in("id", articleIds);

    if (!articles) {
      return results;
    }

    for (const article of articles) {
      const match = await this.detectTopicForArticle(article);
      results.set(article.id, match);
    }

    return results;
  }

  private extractKeywords(title: string, content: string): string[] {
    const text = `${title} ${content || ""}`.toLowerCase();
    
    // Remove common stop words
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
      "being", "have", "has", "had", "do", "does", "did", "will", "would",
      "could", "should", "may", "might", "must", "shall", "can", "need", "dare",
      "this", "that", "these", "those", "i", "you", "he", "she", "it", "we",
      "they", "what", "which", "who", "when", "where", "why", "how", "all",
      "each", "every", "both", "few", "more", "most", "other", "some", "such",
      "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
      "just", "also", "now", "here", "there", "when", "where", "why", "how"
    ]);

    // Extract words (3+ characters)
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    
    // Filter stop words and get unique words
    const uniqueWords = [...new Set(words.filter(word => !stopWords.has(word)))];
    
    return uniqueWords;
  }

  private calculateMatch(
    articleKeywords: string[],
    topicKeywords: string[],
    topicTitle: string
  ): { confidence: number; method: "keyword" | "embedding" | "hybrid"; matchedKeywords: string[] } {
    if (articleKeywords.length === 0 || topicKeywords.length === 0) {
      return { confidence: 0, method: "keyword", matchedKeywords: [] };
    }

    const articleSet = new Set(articleKeywords);
    const topicSet = new Set(topicKeywords);
    
    // Calculate Jaccard similarity
    const intersection = new Set([...articleSet].filter(x => topicSet.has(x)));
    const union = new Set([...articleSet, ...topicSet]);
    const jaccard = intersection.size / union.size;

    // Calculate keyword overlap ratio
    const overlapRatio = intersection.size / Math.max(articleSet.size, topicSet.size);

    // Combined confidence score
    const confidence = (jaccard * 0.6) + (overlapRatio * 0.4);

    // Check for exact title match (boost confidence)
    const titleMatch = articleKeywords.some(kw => topicTitle.toLowerCase().includes(kw));
    const boostedConfidence = titleMatch ? Math.min(confidence + 0.2, 1.0) : confidence;

    return {
      confidence: boostedConfidence,
      method: "keyword",
      matchedKeywords: Array.from(intersection),
    };
  }

  async autoMapArticlesToTopics(limit: number = 100): Promise<{ mapped: number; unmapped: number }> {
    const supabase = createAdminClient();

    // Fetch pending articles without topic mapping
    const { data: articles } = await supabase
      .from("discovered_articles")
      .select("id, title, content")
      .eq("status", "pending")
      .limit(limit);

    if (!articles || articles.length === 0) {
      return { mapped: 0, unmapped: 0 };
    }

    let mapped = 0;
    let unmapped = 0;

    for (const article of articles) {
      try {
        const match = await this.detectTopicForArticle(article);

        if (match) {
          await supabase
            .from("discovered_article_topics")
            .insert({
              discovered_article_id: article.id,
              topic_id: match.topicId,
              confidence: match.confidence,
              mapping_method: match.matchMethod,
            });
          mapped++;
        } else {
          unmapped++;
        }
      } catch (error) {
        console.error(`Failed to map article ${article.id}:`, error);
        unmapped++;
      }
    }

    return { mapped, unmapped };
  }

  async suggestNewTopicsFromUnmappedArticles(threshold: number = 5): Promise<string[]> {
    const supabase = createAdminClient();

    // Find articles that couldn't be mapped to existing topics
    const { data: unmappedArticles } = await supabase
      .from("discovered_articles")
      .select("title, content")
      .not("id", "in", `(SELECT discovered_article_id FROM discovered_article_topics)`)
      .eq("status", "pending")
      .limit(100);

    if (!unmappedArticles || unmappedArticles.length === 0) {
      return [];
    }

    // Extract and aggregate keywords from unmapped articles
    const keywordFrequency = new Map<string, number>();

    for (const article of unmappedArticles) {
      const keywords = this.extractKeywords(article.title, article.content);
      
      for (const keyword of keywords) {
        keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
      }
    }

    // Filter keywords that appear frequently
    const frequentKeywords = Array.from(keywordFrequency.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([keyword, _]) => keyword)
      .sort((a, b) => b.length - a.length); // Prefer longer, more specific keywords

    return frequentKeywords;
  }
}

export async function createTopicDetectionService(): Promise<TopicDetectionService> {
  return new TopicDetectionService();
}
