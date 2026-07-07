/**
 * Entity Storage Service
 * 
 * Stores resolved entities and relationships in the database
 * for knowledge graph features
 */

import { createAdminClient } from "@/lib/supabase/admin";
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
    
    // Check if entity already exists
    const { data: existing } = await supabase
      .from("knowledge_graph_nodes")
      .select("*")
      .eq("slug", slug)
      .single();
    
    if (existing) {
      // Update existing entity
      const { data: updated } = await supabase
        .from("knowledge_graph_nodes")
        .update({
          article_count: existing.article_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
      
      if (updated) {
        storedEntities.push({
          id: updated.id,
          canonical_name: updated.name,
          slug: updated.slug,
          type: updated.node_type,
          aliases: [],
          confidence_score: updated.confidence_score,
          description: updated.description,
          category: updated.node_type,
          article_count: updated.article_count,
          relationship_count: 0,
        });
      }
    } else {
      // Create new entity
      const entityId = uuidv4();
      const { data: created } = await supabase
        .from("knowledge_graph_nodes")
        .insert({
          id: entityId,
          node_type: entity.type,
          name: entity.canonicalName,
          slug: slug,
          description: entity.description,
          confidence_score: entity.confidenceScore,
          article_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (created) {
        storedEntities.push({
          id: created.id,
          canonical_name: created.name,
          slug: created.slug,
          type: created.node_type,
          aliases: [],
          confidence_score: created.confidence_score,
          description: created.description,
          category: created.node_type,
          article_count: created.article_count,
          relationship_count: 0,
        });
      }
    }
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
      // Check if relationship already exists
      const { data: existing } = await supabase
        .from("knowledge_graph_edges")
        .select("*")
        .eq("source_id", sourceId)
        .eq("target_id", targetId)
        .eq("edge_type", rel.type)
        .single();
      
      if (!existing) {
        // Create new relationship
        await supabase
          .from("knowledge_graph_edges")
          .insert({
            id: uuidv4(),
            source_id: sourceId,
            target_id: targetId,
            edge_type: rel.type,
            weight: rel.confidenceScore,
            confidence: rel.confidenceScore,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
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
