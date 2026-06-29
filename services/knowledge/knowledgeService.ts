import { createClient as createServerClient } from "@/lib/supabase/server";
import { KnowledgeObject } from "@/lib/types";
import { ListOptions, PaginatedResult, ServiceResult } from "@/services/shared/types";

export async function getKnowledgeObjectById(
  id: string
): Promise<ServiceResult<KnowledgeObject & { translations?: unknown[] }>> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("knowledge_objects")
    .select("*, knowledge_object_translations(*)")
    .eq("id", id)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function listKnowledgeObjects(
  options: ListOptions = {}
): Promise<PaginatedResult<KnowledgeObject>> {
  const { page = 1, pageSize = 20, status = "published" } = options;
  const supabase = await createServerClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("knowledge_objects")
    .select("*", { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: (data || []) as KnowledgeObject[],
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > to + 1,
  };
}

export async function createKnowledgeObject(
  payload: Partial<KnowledgeObject>
): Promise<ServiceResult<KnowledgeObject>> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("knowledge_objects")
    .insert(payload)
    .select()
    .single();

  return { data, error: error ? new Error(error.message) : null };
}
