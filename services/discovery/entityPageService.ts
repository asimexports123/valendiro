/**
 * Entity Page Service
 * 
 * Generates canonical entity pages from knowledge graph data
 */

import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

export interface EntityPage {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  articleCount: number;
  relationshipCount: number;
  overview: string;
  latestArticles: any[];
  relatedEntities: any[];
  timeline: string;
  categories: string[];
  relatedConcepts: string[];
  frequentlyMentionedTopics: string[];
  internalLinks: string[];
}

/**
 * Get entity page data from database
 */
export async function getEntityPage(slug: string): Promise<EntityPage | null> {
  // Get entity from knowledge graph nodes
  const { data: entity, error: entityError } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (entityError || !entity) {
    return null;
  }

  // Get related entities through edges
  const { data: edges } = await supabase
    .from("knowledge_graph_edges")
    .select("*, target_node:knowledge_graph_nodes(*)")
    .eq("source_id", entity.id)
    .limit(20);

  const relatedEntities = edges?.map(e => ({
    name: e.target_node?.name,
    type: e.target_node?.node_type,
    relationship: e.edge_type,
    slug: e.target_node?.slug,
  })) || [];

  // Get topics mentioning this entity
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .ilike("content", `%${entity.name}%`)
    .limit(10);

  const latestArticles = topics || [];

  return {
    id: entity.id,
    name: entity.name,
    slug: entity.slug,
    type: entity.node_type,
    description: entity.description || `${entity.name} is a ${entity.node_type} in the knowledge graph.`,
    articleCount: entity.article_count || 0,
    relationshipCount: relatedEntities.length,
    overview: generateOverview(entity),
    latestArticles,
    relatedEntities,
    timeline: generateTimeline(entity),
    categories: [entity.node_type],
    relatedConcepts: relatedEntities.slice(0, 5).map(e => e.name),
    frequentlyMentionedTopics: latestArticles.slice(0, 5).map(t => t.slug),
    internalLinks: [`/entity/${slug}`, ...latestArticles.slice(0, 3).map(t => `/en/topics/${t.slug}`)],
  };
}

/**
 * Generate entity page markdown
 */
export function entityPageToMarkdown(page: EntityPage): string {
  let markdown = `# ${page.name}\n\n`;
  markdown += `**Type:** ${page.type}\n\n`;
  markdown += `## Overview\n\n${page.overview}\n\n`;
  
  markdown += `## Description\n\n${page.description}\n\n`;
  
  if (page.latestArticles.length > 0) {
    markdown += `## Latest Articles\n\n`;
    page.latestArticles.forEach(article => {
      markdown += `- [${article.slug}](/en/topics/${article.slug})\n`;
    });
    markdown += `\n`;
  }
  
  if (page.relatedEntities.length > 0) {
    markdown += `## Related Entities\n\n`;
    page.relatedEntities.forEach(rel => {
      markdown += `- ${rel.name} (${rel.relationship}) - [/entity/${rel.slug}](/entity/${rel.slug})\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `## Timeline\n\n${page.timeline}\n\n`;
  
  markdown += `## Categories\n\n`;
  page.categories.forEach(cat => {
    markdown += `- ${cat}\n`;
  });
  markdown += `\n`;
  
  if (page.relatedConcepts.length > 0) {
    markdown += `## Related Concepts\n\n`;
    page.relatedConcepts.forEach(concept => {
      markdown += `- ${concept}\n`;
    });
    markdown += `\n`;
  }
  
  if (page.frequentlyMentionedTopics.length > 0) {
    markdown += `## Frequently Mentioned Topics\n\n`;
    page.frequentlyMentionedTopics.forEach(topic => {
      markdown += `- ${topic}\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `## Internal Links\n\n`;
  page.internalLinks.forEach(link => {
    markdown += `- ${link}\n`;
  });
  
  return markdown;
}

function generateOverview(entity: any): string {
  return `${entity.name} is a ${entity.node_type} that appears in ${entity.article_count} articles in the knowledge graph. It has been mentioned in various contexts related to technology, development, and industry trends.`;
}

function generateTimeline(entity: any): string {
  return `${entity.name} has been tracked in the knowledge graph since ${new Date(entity.created_at).toLocaleDateString()}. It has been mentioned in ${entity.article_count} articles and has ${entity.confidence_score} confidence score.`;
}
