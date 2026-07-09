/**
 * Entity Storage Service
 * 
 * Stores resolved entities and relationships in the database
 * for knowledge graph features
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { upsertGraphNodeWithId, upsertGraphEdge } from "@/services/knowledge/graphService";
import { v4 as uuidv4 } from "uuid";

const supabase = createAdminClient();

export interface StoredEntity {
  id: string;
  canonical_name: string;
  slug: string;
  type: string;
  aliases: string[];
  confidence_score: number;
  description: string;
  category: string;
  article_count: number;
  relationship_count: number;
}

export interface StoredRelationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  confidence_score: number;
}

/**
 * Store entities in database
 */
export async function storeEntities(entities: any[]): Promise<StoredEntity[]> {
  const storedEntities: StoredEntity[] = [];
  
  for (const entity of entities) {
    const slug = generateSlug(entity.canonicalName);
    const node = await upsertGraphNodeWithId({
      id: uuidv4(),
      name: entity.canonicalName,
      slug,
      node_type: entity.type,
      description: entity.description,
      confidence_score: entity.confidenceScore,
    });

    storedEntities.push({
      id: node.id,
      canonical_name: node.name,
      slug: node.slug,
      type: entity.type,
      aliases: [],
      confidence_score: entity.confidenceScore,
      description: entity.description,
      category: entity.type,
      article_count: 1,
      relationship_count: 0,
    });
  }
  
  return storedEntities;
}

/**
 * Store relationships in database
 */
export async function storeRelationships(
  relationships: any[],
  entities: StoredEntity[]
): Promise<void> {
  const entityMap = new Map(entities.map(e => [e.canonical_name, e.id]));
  
  for (const rel of relationships) {
    const sourceId = entityMap.get(rel.source);
    const targetId = entityMap.get(rel.target);
    
    if (sourceId && targetId) {
      await upsertGraphEdge(sourceId, targetId, rel.type, "entity-storage", rel.confidenceScore ?? 0.8);
    }
  }
}

/**
 * Get entity by slug
 */
export async function getEntityBySlug(slug: string): Promise<StoredEntity | null> {
  const { data } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", slug)
    .single();
  
  if (!data) return null;
  
  return {
    id: data.id,
    canonical_name: data.name,
    slug: data.slug,
    type: data.node_type,
    aliases: [],
    confidence_score: data.confidence_score,
    description: data.description,
    category: data.node_type,
    article_count: data.article_count,
    relationship_count: 0,
  };
}

/**
 * Get related entities
 */
export async function getRelatedEntities(entityId: string): Promise<StoredEntity[]> {
  const { data: edges } = await supabase
    .from("knowledge_graph_edges")
    .select("target_id")
    .eq("source_id", entityId);
  
  if (!edges || edges.length === 0) return [];
  
  const targetIds = edges.map(e => e.target_id);
  
  const { data: relatedNodes } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .in("id", targetIds);
  
  if (!relatedNodes) return [];
  
  return relatedNodes.map(n => ({
    id: n.id,
    canonical_name: n.name,
    slug: n.slug,
    type: n.node_type,
    aliases: [],
    confidence_score: n.confidence_score,
    description: n.description,
    category: n.node_type,
    article_count: n.article_count,
    relationship_count: 0,
  }));
}

/**
 * Get topics mentioning entity
 */
export async function getTopicsMentioningEntity(entityId: string): Promise<any[]> {
  // This would query topics that contain the entity name
  // For now, return empty array
  return [];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
