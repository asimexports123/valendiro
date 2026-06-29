import { createClient } from "@/lib/supabase/server";
import {
  ContentGenerationQueueItem,
  ContentUpdateQueueItem,
  ContentPriorityQueueItem,
  KnowledgeObjectType,
  SupportedLanguage,
} from "@/lib/types";

export interface EvaluateObjectInput {
  objectId: string;
  objectType: KnowledgeObjectType;
  languageCode: SupportedLanguage;
  priorityScore: number;
  reason: string;
  decisionType: "create" | "update" | "ignore";
  metadata?: Record<string, unknown>;
}

export async function evaluateAndQueue(input: EvaluateObjectInput) {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("content_priority_queue")
    .select("id")
    .eq("object_id", input.objectId)
    .eq("object_type", input.objectType)
    .eq("decision_type", input.decisionType)
    .maybeSingle();

  if (existingError) {
    return { data: null, error: existingError.message };
  }

  if (existing) {
    const { data, error } = await supabase
      .from("content_priority_queue")
      .update({
        priority_score: input.priorityScore,
        reason: input.reason,
        metadata: input.metadata ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single<ContentPriorityQueueItem>();

    return { data, error: error?.message ?? null };
  }

  const { data, error } = await supabase
    .from("content_priority_queue")
    .insert({
      object_id: input.objectId,
      object_type: input.objectType,
      priority_score: input.priorityScore,
      decision_type: input.decisionType,
      reason: input.reason,
      metadata: input.metadata ?? {},
    })
    .select()
    .single<ContentPriorityQueueItem>();

  return { data, error: error?.message ?? null };
}

export async function enqueueContentGeneration(
  objectType: KnowledgeObjectType,
  title: string,
  reason: string,
  priorityScore: number,
  description?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_generation_queue")
    .insert({
      object_type: objectType,
      title,
      description: description ?? null,
      reason,
      priority_score: priorityScore,
      metadata: metadata ?? {},
    })
    .select()
    .single<ContentGenerationQueueItem>();

  return { data, error: error?.message ?? null };
}

export async function enqueueContentUpdate(
  objectId: string,
  objectType: KnowledgeObjectType,
  reason: string,
  priorityScore: number,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_update_queue")
    .insert({
      object_id: objectId,
      object_type: objectType,
      reason,
      priority_score: priorityScore,
      metadata: metadata ?? {},
    })
    .select()
    .single<ContentUpdateQueueItem>();

  return { data, error: error?.message ?? null };
}

export async function getPendingDecisions(limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_priority_queue")
    .select("*")
    .eq("status", "pending")
    .order("priority_score", { ascending: false })
    .limit(limit);

  return { data: (data || []) as ContentPriorityQueueItem[], error: error?.message ?? null };
}

export async function approveDecision(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_priority_queue")
    .update({ status: "approved" })
    .eq("id", id)
    .select()
    .single<ContentPriorityQueueItem>();

  return { data, error: error?.message ?? null };
}

export async function rejectDecision(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_priority_queue")
    .update({ status: "rejected" })
    .eq("id", id)
    .select()
    .single<ContentPriorityQueueItem>();

  return { data, error: error?.message ?? null };
}

export async function getQueueItems(type: "generation" | "update" | "priority", status = "pending", limit = 50) {
  const supabase = await createClient();
  const table =
    type === "generation" ? "content_generation_queue" : type === "update" ? "content_update_queue" : "content_priority_queue";

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("status", status)
    .order("priority_score", { ascending: false })
    .limit(limit);

  return { data: (data || []) as any[], error: error?.message ?? null };
}

export async function runContentOpportunityScan(objectType: KnowledgeObjectType, languageCode: SupportedLanguage) {
  const supabase = await createClient();

  // Example: Find published objects with no scores and queue them for evaluation
  const { data: unscored, error } = await supabase
    .from("content_scores")
    .select("object_id, object_type")
    .eq("object_type", objectType)
    .eq("language_code", languageCode)
    .order("overall_priority_score", { ascending: true })
    .limit(50);

  if (error || !unscored) {
    return { queued: 0, error: error?.message ?? null };
  }

  let queued = 0;
  for (const item of unscored) {
    const result = await evaluateAndQueue({
      objectId: item.object_id as string,
      objectType: item.object_type as KnowledgeObjectType,
      languageCode,
      priorityScore: 0,
      reason: "Needs scoring and priority review",
      decisionType: "update",
    });
    if (!result.error) queued++;
  }

  return { queued, error: null };
}
