/**
 * Discovery Worker
 * Processes discovered articles and extracts knowledge into Knowledge Packages
 * Integrates with existing Knowledge OS architecture
 */

import { BaseWorker, type WorkerContext } from "./baseWorker";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateTopicFields } from "@/services/publish/writers";
import {
  KNOWLEDGE_ASSET_TABLE,
  rowToDiscoveredArticleLogical,
  type KnowledgeAssetRow,
} from "@/services/discovery/ingest/knowledgeAssetCompat";
import { JOB_TYPES } from "@/jobs/definitions/jobTypes";
import type { JobDefinition } from "@/jobs/definitions/jobTypes";

export class DiscoveryWorker extends BaseWorker {
  readonly type = JOB_TYPES.KNOWLEDGE_ACQUISITION;

  async execute(ctx: WorkerContext): Promise<void> {
    const supabase = createAdminClient();
    const discoveredArticleId = ctx.job.object_id;

    // 1. Fetch discovered article
    const { data: row, error: articleError } = await supabase
      .from(KNOWLEDGE_ASSET_TABLE)
      .select("*")
      .eq("id", discoveredArticleId)
      .single();

    if (articleError || !row) {
      throw new Error(`Discovered article not found: ${discoveredArticleId}`);
    }

    const article = rowToDiscoveredArticleLogical(row as KnowledgeAssetRow);

    // 2. Detect relevant topic
    const topicId = await this.detectRelevantTopic(article);
    if (!topicId) {
      // No relevant topic found, mark as rejected
      await supabase
        .from(KNOWLEDGE_ASSET_TABLE)
        .update({
          status: "rejected",
          rejection_reason: "No relevant topic detected",
          processing_completed_at: new Date().toISOString(),
        })
        .eq("id", discoveredArticleId);
      return;
    }

    // 3. Extract knowledge from article
    const knowledge = await this.extractKnowledge(article, topicId);

    // 4. Update knowledge package
    await this.updateKnowledgePackage(topicId, knowledge);

    // 5. Map article to topic
    await supabase
      .from("discovered_article_topics")
      .insert({
        discovered_article_id: discoveredArticleId,
        topic_id: topicId,
        confidence: knowledge.confidence,
        mapping_method: "keyword",
      });

    // 6. Mark article as accepted
    await supabase
      .from(KNOWLEDGE_ASSET_TABLE)
      .update({
        status: "accepted",
        relevance_score: knowledge.relevanceScore,
        confidence_score: knowledge.confidence,
        processing_completed_at: new Date().toISOString(),
      })
      .eq("id", discoveredArticleId);

    // 7. Queue article regeneration for the topic
    await this.queueArticleRegeneration(topicId);
  }

  private async detectRelevantTopic(article: any): Promise<string | null> {
    const supabase = createAdminClient();

    // Extract keywords from article title and content
    const keywords = this.extractKeywords(article.title, article.content);

    // Search for matching topics
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

    // Find best matching topic based on keyword overlap
    let bestMatch: { id: string; score: number } | null = null;

    for (const topic of topics) {
      const title = (topic.topic_translations as { title: string }[])?.[0]?.title || topic.slug;
      const topicKeywords = this.extractKeywords(title, "");
      
      const score = this.calculateKeywordOverlap(keywords, topicKeywords);
      
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { id: topic.id, score };
      }
    }

    // Only return if confidence is above threshold
    if (bestMatch && bestMatch.score > 0.3) {
      return bestMatch.id;
    }

    return null;
  }

  private extractKeywords(title: string, content: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    
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

  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) {
      return 0;
    }

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private async extractKnowledge(article: any, topicId: string): Promise<{
    knowledge: any[];
    confidence: number;
    relevanceScore: number;
  }> {
    // Use existing knowledge acquisition worker logic
    // This would integrate with the existing knowledgeAcquisitionWorker
    // For now, we'll create a simplified version that extracts facts from the article

    const facts = this.extractFactsFromArticle(article);
    
    return {
      knowledge: facts,
      confidence: 0.7,
      relevanceScore: 0.75,
    };
  }

  private extractFactsFromArticle(article: any): any[] {
    // Simplified fact extraction
    // In production, this would use NLP/AI to extract structured knowledge
    const facts: any[] = [];

    // Extract key statements from content
    const sentences: string[] = (article.content || article.summary || "")
      .split(/[.!?]+/)
      .filter((s: string) => s.trim().length > 20)
      .slice(0, 10); // Take first 10 meaningful sentences

    for (const sentence of sentences) {
      facts.push({
        statement: sentence.trim(),
        factType: "fact",
        confidence: "medium",
        domain: this.inferDomain(article),
        scope: "contextual",
        tags: this.extractTags(article.title),
      });
    }

    return facts;
  }

  private inferDomain(article: any): string {
    const content = `${article.title} ${article.content} ${article.summary}`.toLowerCase();
    
    if (content.includes("tech") || content.includes("software") || content.includes("code")) {
      return "technology";
    }
    if (content.includes("business") || content.includes("company") || content.includes("market")) {
      return "business";
    }
    if (content.includes("health") || content.includes("medical") || content.includes("doctor")) {
      return "health";
    }
    if (content.includes("travel") || content.includes("vacation") || content.includes("hotel")) {
      return "travel";
    }
    
    return "general";
  }

  private extractTags(title: string): string[] {
    const keywords = this.extractKeywords(title, "");
    return keywords.slice(0, 5);
  }

  private async updateKnowledgePackage(topicId: string, knowledge: any): Promise<void> {
    // Touch topic timestamp via canonical writer until package integration lands
    await updateTopicFields(topicId, {});
  }

  private async queueArticleRegeneration(topicId: string): Promise<void> {
    const supabase = createAdminClient();

    // Add to update queue for content generation
    await supabase
      .from("update_queue")
      .insert({
        object_id: topicId,
        object_type: "topic",
        job_type: "content_update",
        priority: 75, // HIGH priority
        status: "pending",
        scheduled_at: new Date().toISOString(),
      });
  }
}

export const DISCOVERY_WORKER_DEFINITION: JobDefinition = {
  type: JOB_TYPES.KNOWLEDGE_ACQUISITION,
  description: "Process discovered articles and extract knowledge into Knowledge Packages",
  priority: 75,
  maxRetries: 3,
  timeoutSeconds: 600,
};
