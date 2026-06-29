"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CrudConfig {
  table: string;
  idColumn?: string;
  revalidatePaths?: string[];
}

export async function listItems<T>(
  config: CrudConfig,
  options: {
    page?: number;
    pageSize?: number;
    search?: string;
    searchColumns?: string[];
    orderBy?: string;
    order?: "asc" | "desc";
  } = {}
): Promise<{ data: T[]; count: number; error: string | null }> {
  const {
    page = 1,
    pageSize = 20,
    search = "",
    searchColumns = [],
    orderBy = "created_at",
    order = "desc",
  } = options;

  const supabase = await createClient();
  let query = supabase.from(config.table).select("*", { count: "exact" });

  if (search && searchColumns.length > 0) {
    const ors = searchColumns.map((col) => `${col}.ilike.%${search}%`).join(",");
    query = query.or(ors);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order(orderBy, { ascending: order === "asc" })
    .range(from, to);

  return {
    data: (data || []) as T[],
    count: count || 0,
    error: error ? error.message : null,
  };
}

export async function getItemById<T>(
  config: CrudConfig,
  id: string
): Promise<{ data: T | null; error: string | null }> {
  const supabase = await createClient();
  const idColumn = config.idColumn || "id";
  const { data, error } = await supabase
    .from(config.table)
    .select("*")
    .eq(idColumn, id)
    .single();

  return { data: data as T | null, error: error ? error.message : null };
}

export async function createItem<T>(
  config: CrudConfig,
  payload: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(config.table)
    .insert(payload)
    .select()
    .single();

  if (config.revalidatePaths) {
    config.revalidatePaths.forEach((path) => revalidatePath(path));
  }

  return { data: data as T | null, error: error ? error.message : null };
}

export async function updateItem<T>(
  config: CrudConfig,
  id: string,
  payload: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  const supabase = await createClient();
  const idColumn = config.idColumn || "id";
  const { data, error } = await supabase
    .from(config.table)
    .update(payload)
    .eq(idColumn, id)
    .select()
    .single();

  if (config.revalidatePaths) {
    config.revalidatePaths.forEach((path) => revalidatePath(path));
  }

  return { data: data as T | null, error: error ? error.message : null };
}

export async function deleteItem(
  config: CrudConfig,
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const idColumn = config.idColumn || "id";
  const { error } = await supabase.from(config.table).delete().eq(idColumn, id);

  if (config.revalidatePaths) {
    config.revalidatePaths.forEach((path) => revalidatePath(path));
  }

  return { error: error ? error.message : null };
}
