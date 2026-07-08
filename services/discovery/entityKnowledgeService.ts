/**
 * Entity Knowledge Service
 * 
 * Autonomous entity knowledge generation and management.
 * Entities become first-class knowledge objects that automatically evolve
 * as new information is discovered from articles.
 * 
 * Uses existing metadata JSONB column in knowledge_graph_nodes to store entity knowledge.
 */

import { createAdminClient } from "@/lib/supabase/admin";

interface EntityKnowledge {
  overview?: string;
  history?: string;
  purpose?: string;
  products?: string[];
  technologies?: string[];
  people?: string[];
  organizations?: string[];
  locations?: string[];
  timeline?: any[];
  major_events?: any[];
  relationships?: any[];
  latest_news_summary?: string;
  latest_news_sources?: any[];
  frequently_mentioned_topics?: string[];
  common_questions?: any[];
  facts?: string[];
  sources?: any[];
  knowledge_version?: number;
  entity_fact_count?: number;
  entity_source_count?: number;
  last_knowledge_update?: string;
}

export class EntityKnowledgeService {
  private supabase = createAdminClient();

  /**
   * Process entities from an article and update their knowledge packages
   */
  async processEntitiesFromArticle(articleId: string, entities: any[], articleContent: string): Promise<void> {
    console.log(`[Entity Knowledge] Processing ${entities.length} entities from article ${articleId}`);

    for (const entity of entities) {
      await this.updateEntityKnowledge(entity, articleId, articleContent);
    }
  }

  /**
   * Update entity knowledge package with new information
   */
  async updateEntityKnowledge(entity: any, articleId: string, articleContent: string): Promise<void> {
    const entityId = entity.id;
    const entityName = entity.name;
    const entitySlug = entity.slug;

    console.log(`[Entity Knowledge] Updating knowledge for entity: ${entityName}`);

    // Get existing entity knowledge
    const existingKnowledge = await this.getEntityKnowledge(entitySlug);
    
    // Extract new facts from article content
    const newFacts = await this.extractFactsFromArticle(articleContent, entityName);
    
    // Extract new sources
    const newSources = await this.extractSourcesFromArticle(articleId);
    
    // Merge knowledge
    const mergedKnowledge = this.mergeKnowledge(existingKnowledge, newFacts, newSources);
    
    // Update entity in knowledge_graph_nodes
    await this.updateEntityKnowledgeInGraph(entityId, entityName, mergedKnowledge);
    
    console.log(`[Entity Knowledge] Updated knowledge for ${entityName}`);
  }

  /**
   * Get entity knowledge from knowledge_graph_nodes metadata column
   */
  async getEntityKnowledge(entitySlug: string): Promise<EntityKnowledge> {
    const { data, error } = await this.supabase
      .from("knowledge_graph_nodes")
      .select("metadata")
      .eq("slug", entitySlug)
      .single();

    if (error || !data) {
      return {};
    }

    const knowledge = data.metadata?.entity_knowledge || {};
    
    // Clean internal data from overview
    if (knowledge.overview) {
      knowledge.overview = this.cleanInternalData(knowledge.overview);
    }
    
    // Deduplicate facts
    if (knowledge.facts) {
      knowledge.facts = this.deduplicateFacts(knowledge.facts);
    }
    
    return knowledge;
  }
  
  /**
   * Remove internal graph data from text
   */
  cleanInternalData(text: string): string {
    let cleaned = text;
    
    // Remove internal relationship markers
    cleaned = cleaned.replace(/RELATED_TO/gi, '');
    cleaned = cleaned.replace(/RELATED_ARTICLE/gi, '');
    cleaned = cleaned.replace(/RELATIONSHIP_TYPE/gi, '');
    
    // Remove graph syntax
    cleaned = cleaned.replace(/→/g, '');
    cleaned = cleaned.replace(/-->/g, '');
    cleaned = cleaned.replace(/\[.*?\]/g, '');
    
    // Remove database field references
    cleaned = cleaned.replace(/node_id/gi, '');
    cleaned = cleaned.replace(/edge_id/gi, '');
    cleaned = cleaned.replace(/metadata/gi, '');
    
    // Remove debugging markers
    cleaned = cleaned.replace(/DEBUG:/gi, '');
    cleaned = cleaned.replace(/INTERNAL:/gi, '');
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }
  
  /**
   * Deduplicate facts by canonical content
   */
  deduplicateFacts(facts: string[]): string[] {
    const seen = new Set<string>();
    const uniqueFacts: string[] = [];
    
    for (const fact of facts) {
      // Normalize fact for comparison
      const normalized = fact.toLowerCase().trim().replace(/\s+/g, ' ');
      const key = normalized.substring(0, 50); // Use first 50 chars as key
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFacts.push(fact);
      }
    }
    
    return uniqueFacts;
  }

  /**
   * Extract facts from article content related to an entity
   */
  async extractFactsFromArticle(articleContent: string, entityName: string): Promise<string[]> {
    const facts: string[] = [];
    
    // Simple fact extraction - look for sentences containing the entity
    const sentences = articleContent.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(entityName.toLowerCase())) {
        facts.push(sentence.trim());
      }
    }
    
    // Limit to top 10 most relevant facts
    return facts.slice(0, 10);
  }

  /**
   * Extract sources from article
   */
  async extractSourcesFromArticle(articleId: string): Promise<any[]> {
    // Get article data from topics table (since we're using published articles)
    const { data: article } = await this.supabase
      .from("topics")
      .select("id, slug, created_at")
      .eq("id", articleId)
      .single();

    if (!article) {
      return [];
    }

    return [{
      source_type: "article",
      source_name: article.slug,
      source_id: article.id,
      publication_date: article.created_at,
      trust_score: 0.5,
    }];
  }

  /**
   * Merge new knowledge into existing knowledge
   */
  mergeKnowledge(existing: EntityKnowledge, newFacts: string[], newSources: any[]): EntityKnowledge {
    const merged = { ...existing };
    
    // Merge facts (avoid duplicates)
    const existingFacts = existing.facts || [];
    const mergedFacts = [...existingFacts];
    for (const fact of newFacts) {
      if (!mergedFacts.includes(fact)) {
        mergedFacts.push(fact);
      }
    }
    merged.facts = mergedFacts;
    
    // Merge sources
    const existingSources = existing.sources || [];
    const mergedSources = [...existingSources];
    for (const source of newSources) {
      const sourceKey = `${source.source_type}-${source.source_id}`;
      if (!mergedSources.some(s => `${s.source_type}-${s.source_id}` === sourceKey)) {
        mergedSources.push(source);
      }
    }
    merged.sources = mergedSources;
    
    // Update overview if we have enough facts
    if (newFacts.length > 0) {
      merged.overview = this.generateOverview(existingFacts.length > 0 ? existingFacts[0] : "", newFacts);
    }
    
    // Update latest news summary
    if (newFacts.length > 0) {
      merged.latest_news_summary = this.generateLatestNewsSummary(newFacts);
    }
    
    // Generate timeline
    merged.timeline = this.generateTimeline(merged.facts || [], merged.sources || []);
    
    return merged;
  }

  /**
   * Generate overview from facts - entity-centric, not article-centric
   */
  generateOverview(existingFact: string, newFacts: string[]): string {
    const allFacts = [existingFact, ...newFacts].filter(f => f);
    
    if (allFacts.length === 0) {
      return "";
    }
    
    // Create a cohesive overview by merging facts
    const overview = allFacts
      .slice(0, 5)
      .map(fact => fact.trim())
      .filter(fact => fact.length > 10)
      .join(". ");
    
    return overview + (overview.endsWith(".") ? "" : ".");
  }

  /**
   * Generate latest news summary
   */
  generateLatestNewsSummary(newFacts: string[]): string {
    if (newFacts.length === 0) {
      return "";
    }
    return `Recent developments indicate ${newFacts.slice(0, 3).join(". ")}.`;
  }
  
  /**
   * Generate timeline from knowledge
   */
  generateTimeline(facts: string[], sources: any[]): any[] {
    const timeline: any[] = [];
    
    // Add events from sources (chronological)
    sources.forEach(source => {
      if (source.publication_date) {
        timeline.push({
          date: source.publication_date,
          event: `Information referenced from ${source.source_name}`,
          type: 'source',
        });
      }
    });
    
    // Add key events from facts (use current date for fact discovery)
    facts.slice(0, 5).forEach((fact, index) => {
      timeline.push({
        date: new Date().toISOString(),
        event: `Knowledge extracted: ${fact.substring(0, 100)}...`,
        type: 'knowledge',
      });
    });
    
    // Sort by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return timeline.slice(0, 10); // Limit to 10 events
  }

  /**
   * Update entity knowledge in knowledge_graph_nodes metadata column
   */
  async updateEntityKnowledgeInGraph(entityId: string, entityName: string, knowledge: EntityKnowledge): Promise<void> {
    // Get current entity data
    const { data: current } = await this.supabase
      .from("knowledge_graph_nodes")
      .select("metadata")
      .eq("id", entityId)
      .single();

    const currentMetadata = current?.metadata || {};
    const currentKnowledge = currentMetadata.entity_knowledge || {};
    const currentVersion = currentKnowledge.knowledge_version || 1;
    
    const factCount = knowledge.facts?.length || 0;
    const sourceCount = knowledge.sources?.length || 0;

    // Update metadata with entity knowledge
    const updatedMetadata = {
      ...currentMetadata,
      entity_knowledge: {
        ...knowledge,
        knowledge_version: currentVersion + 1,
        entity_fact_count: factCount,
        entity_source_count: sourceCount,
        last_knowledge_update: new Date().toISOString(),
      },
    };

    await this.supabase
      .from("knowledge_graph_nodes")
      .update({
        metadata: updatedMetadata,
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", entityId);
  }
}
