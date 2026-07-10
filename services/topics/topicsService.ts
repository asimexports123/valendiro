import { createClient as createServerClient } from "@/lib/supabase/server";
import { insertTopic, updateTopicFields } from "@/services/publish/writers";
import { ListOptions, PaginatedResult, ServiceResult } from "@/services/shared/types";

export interface TopicsServiceConfig {
  // Future configuration: AI provider, rate limits, feature flags
}

export async function listTopicss(options: ListOptions = {}): Promise<PaginatedResult<any>> {
  const { page = 1, pageSize = 20 } = options;
  const supabase = await createServerClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("topics")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > to + 1,
  };
}

export async function getTopicsById(id: string): Promise<ServiceResult<any>> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("topics").select("*").eq("id", id).single();
  return { data, error: error ? new Error(error.message) : null };
}

export async function createTopics(payload: Record<string, unknown>): Promise<ServiceResult<any>> {
  try {
    const id = await insertTopic(payload as Parameters<typeof insertTopic>[0]);
    return getTopicsById(id);
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function updateTopics(id: string, payload: Record<string, unknown>): Promise<ServiceResult<any>> {
  try {
    await updateTopicFields(id, payload);
    return getTopicsById(id);
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function deleteTopics(id: string): Promise<ServiceResult<null>> {
  const supabase = await createServerClient();
  const { error } = await supabase.from("topics").delete().eq("id", id);
  return { data: null, error: error ? new Error(error.message) : null };
}
