import { createAdminClient } from "@/lib/supabase/admin";
import {
  InternalLinkSuggestion,
  KnowledgeObjectType,
  SupportedLanguage,
} from "@/lib/types";

export interface LinkSuggestionInput {
  sourceObjectId: string;
  sourceObjectType: KnowledgeObjectType;
  targetObjectId: string;
  targetObjectType: KnowledgeObjectType;
  anchorText?: string;
  contextSnippet?: string;
  relevanceScore?: number;
  clusterStrengthScore?: number;
  metadata?: Record<string, unknown>;
}

export async function createLinkSuggestion(input: LinkSuggestionInput) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("internal_link_suggestions")
    .insert({
      source_object_id: input.sourceObjectId,
      source_object_type: input.sourceObjectType,
      target_object_id: input.targetObjectId,
      target_object_type: input.targetObjectType,
      anchor_text: input.anchorText ?? null,
      context_snippet: input.contextSnippet ?? null,
      relevance_score: input.relevanceScore ?? 0,
      cluster_strength_score: input.clusterStrengthScore ?? 0,
      metadata: input.metadata ?? {},
    })
    .select()
    .single<InternalLinkSuggestion>();

  return { data, error: error?.message ?? null };
}

export async function getSuggestionsForSource(
  sourceObjectId: string,
  sourceObjectType: KnowledgeObjectType,
  status?: "pending" | "approved" | "rejected",
  limit = 50
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("internal_link_suggestions")
    .select("*")
    .eq("source_object_id", sourceObjectId)
    .eq("source_object_type", sourceObjectType)
    .order("relevance_score", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  return { data: (data || []) as InternalLinkSuggestion[], error: error?.message ?? null };
}

export async function approveSuggestion(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("internal_link_suggestions")
    .update({ status: "approved" })
    .eq("id", id)
    .select()
    .single<InternalLinkSuggestion>();

  return { data, error: error?.message ?? null };
}

export async function rejectSuggestion(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("internal_link_suggestions")
    .update({ status: "rejected" })
    .eq("id", id)
    .select()
    .single<InternalLinkSuggestion>();

  return { data, error: error?.message ?? null };
}

export async function generateSuggestionsForObject(
  objectId: string,
  objectType: KnowledgeObjectType,
  languageCode: SupportedLanguage,
  limit = 10
) {
  const supabase = createAdminClient();

  // Simplified cross-table similarity: find other objects with the same category or tag
  const { data: categoryIds, error: catError } = await supabase.rpc("get_object_category_ids", {
    object_id: objectId,
    object_type: objectType,
  });

  if (catError || !categoryIds || categoryIds.length === 0) {
    return { suggestions: [] as InternalLinkSuggestion[], error: catError?.message ?? null };
  }

  const ids = (categoryIds as { category_id: string }[]).map((c) => c.category_id);
  const { data: related, error } = await supabase.rpc("find_objects_by_category_ids", {
    category_ids: ids,
    exclude_object_id: objectId,
    max_results: limit,
  });

  if (error) {
    return { suggestions: [] as InternalLinkSuggestion[], error: error.message };
  }

  const suggestions: InternalLinkSuggestion[] = [];
  for (const row of related || []) {
    const result = await createLinkSuggestion({
      sourceObjectId: objectId,
      sourceObjectType: objectType,
      targetObjectId: row.id as string,
      targetObjectType: row.object_type as KnowledgeObjectType,
      relevanceScore: 60,
      clusterStrengthScore: 70,
      contextSnippet: "Related by shared category",
    });

    if (result.data) suggestions.push(result.data);
  }

  return { suggestions, error: null };
}

export async function buildTopicClusterLinks(topicId: string, languageCode: SupportedLanguage) {
  const supabase = createAdminClient();

  // Find all questions and knowledge objects linked to this topic and suggest links between them
  const { data: members, error } = await supabase
    .from("knowledge_relationships")
    .select("source_id, source_type, target_id, target_type")
    .or(`and(source_id.eq.${topicId},source_type.eq.topic,relationship_type.eq.belongs_to),and(target_id.eq.${topicId},target_type.eq.topic,relationship_type.eq.belongs_to)`);

  if (error || !members) {
    return { suggestions: [] as InternalLinkSuggestion[], error: error?.message ?? null };
  }

  const suggestions: InternalLinkSuggestion[] = [];
  const children = members.map((rel) =>
    rel.source_id === topicId && rel.source_type === "topic"
      ? { id: rel.target_id, type: rel.target_type }
      : { id: rel.source_id, type: rel.source_type }
  );

  for (let i = 0; i < children.length; i++) {
    for (let j = i + 1; j < children.length; j++) {
      const a = children[i];
      const b = children[j];
      if (a.id === b.id) continue;

      const result = await createLinkSuggestion({
        sourceObjectId: a.id,
        sourceObjectType: a.type as KnowledgeObjectType,
        targetObjectId: b.id,
        targetObjectType: b.type as KnowledgeObjectType,
        relevanceScore: 70,
        clusterStrengthScore: 80,
        contextSnippet: "Related topic cluster member",
      });

      if (result.data) suggestions.push(result.data);
    }
  }

  return { suggestions, error: null };
}
