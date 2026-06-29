import { createClient } from "@/lib/supabase/server";
import {
  KnowledgeRelationship,
  KnowledgeObjectType,
  RelationshipType,
  Topic,
  Question,
  Entity,
  Article,
  KnowledgeObject,
} from "@/lib/types";

export interface CreateRelationshipInput {
  sourceId: string;
  sourceType: KnowledgeObjectType;
  targetId: string;
  targetType: KnowledgeObjectType;
  relationshipType: RelationshipType;
  strengthScore?: number;
  metadata?: Record<string, unknown>;
}

export interface GraphNode {
  id: string;
  type: KnowledgeObjectType;
  title: string | null;
}

export interface GraphEdge {
  relationship: KnowledgeRelationship;
  source: GraphNode;
  target: GraphNode;
}

export async function createRelationship(input: CreateRelationshipInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_relationships")
    .insert({
      source_id: input.sourceId,
      source_type: input.sourceType,
      target_id: input.targetId,
      target_type: input.targetType,
      relationship_type: input.relationshipType,
      strength_score: input.strengthScore ?? 0,
      metadata: input.metadata ?? {},
    })
    .select()
    .single<KnowledgeRelationship>();

  return { data, error: error?.message ?? null };
}

export async function getRelationshipsForObject(
  objectId: string,
  objectType: KnowledgeObjectType,
  direction: "outgoing" | "incoming" | "both" = "both"
) {
  const supabase = await createClient();

  let query = supabase.from("knowledge_relationships").select("*");

  if (direction === "outgoing") {
    query = query.eq("source_id", objectId).eq("source_type", objectType);
  } else if (direction === "incoming") {
    query = query.eq("target_id", objectId).eq("target_type", objectType);
  } else {
    query = query.or(
      `and(source_id.eq.${objectId},source_type.eq.${objectType}),and(target_id.eq.${objectId},target_type.eq.${objectType})`
    );
  }

  const { data, error } = await query.order("strength_score", { ascending: false });

  return { data: (data || []) as KnowledgeRelationship[], error: error?.message ?? null };
}

export async function findRelatedObjects(
  objectId: string,
  objectType: KnowledgeObjectType,
  relationshipType?: RelationshipType,
  minStrength = 0
) {
  const supabase = await createClient();

  let query = supabase
    .from("knowledge_relationships")
    .select("*")
    .or(
      `and(source_id.eq.${objectId},source_type.eq.${objectType}),and(target_id.eq.${objectId},target_type.eq.${objectType})`
    )
    .gte("strength_score", minStrength);

  if (relationshipType) {
    query = query.eq("relationship_type", relationshipType);
  }

  const { data, error } = await query;
  if (error || !data) return { data: [] as KnowledgeRelationship[], error: error?.message ?? null };

  return { data: data as KnowledgeRelationship[], error: null };
}

export async function findUnderdevelopedTopics(limit = 20) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("find_underdeveloped_topics", { limit_count: limit });

  if (error) {
    // Fallback if RPC not installed
    const { data: fallback, error: fallbackError } = await supabase
      .from("topics")
      .select("id, slug, status")
      .eq("status", "published")
      .limit(limit);

    return { data: (fallback || []) as Topic[], error: fallbackError?.message ?? null };
  }

  return { data: (data || []) as Topic[], error: null };
}

export async function deleteRelationship(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("knowledge_relationships").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function buildObjectGraph(objectId: string, objectType: KnowledgeObjectType, depth = 1) {
  const relationships = await getRelationshipsForObject(objectId, objectType, "both");
  const nodeIds = new Set<string>([objectId]);

  relationships.data.forEach((rel) => {
    nodeIds.add(rel.source_id);
    nodeIds.add(rel.target_id);
  });

  // First degree graph only; deeper recursion can be added for depth > 1
  return {
    root: { id: objectId, type: objectType, title: null } as GraphNode,
    edges: relationships.data.map((rel) => ({
      relationship: rel,
      source: { id: rel.source_id, type: rel.source_type, title: null },
      target: { id: rel.target_id, type: rel.target_type, title: null },
    })) as GraphEdge[],
  };
}
