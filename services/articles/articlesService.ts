import { createClient as createServerClient } from "@/lib/supabase/server";
import { ListOptions, PaginatedResult, ServiceResult } from "@/services/shared/types";

export interface ArticlesServiceConfig {
  // Future configuration: AI provider, rate limits, feature flags
}

export async function listArticless(options: ListOptions = {}): Promise<PaginatedResult<any>> {
  const { page = 1, pageSize = 20 } = options;
  const supabase = await createServerClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("articles")
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

export async function getArticlesById(id: string): Promise<ServiceResult<any>> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
  return { data, error: error ? new Error(error.message) : null };
}

export async function createArticles(payload: Record<string, unknown>): Promise<ServiceResult<any>> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("articles").insert(payload).select().single();
  return { data, error: error ? new Error(error.message) : null };
}

export async function updateArticles(id: string, payload: Record<string, unknown>): Promise<ServiceResult<any>> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("articles").update(payload).eq("id", id).select().single();
  return { data, error: error ? new Error(error.message) : null };
}

export async function deleteArticles(id: string): Promise<ServiceResult<null>> {
  const supabase = await createServerClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  return { data: null, error: error ? new Error(error.message) : null };
}
