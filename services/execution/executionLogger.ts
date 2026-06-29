import { createClient } from "@/lib/supabase/server";
import { ExecutionLog, KnowledgeObjectType } from "@/lib/types";

export type QueueType = "generation" | "update" | "priority";
export type LogStatus = "started" | "success" | "failed" | "retry";

export interface LogEntryInput {
  queueType: QueueType;
  queueItemId: string;
  objectId?: string | null;
  objectType?: KnowledgeObjectType | null;
  action: string;
  status: LogStatus;
  message?: string | null;
  metadata?: Record<string, unknown>;
  durationMs?: number | null;
}

export async function logExecution(input: LogEntryInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("execution_logs").insert({
    queue_type: input.queueType,
    queue_item_id: input.queueItemId,
    object_id: input.objectId ?? null,
    object_type: input.objectType ?? null,
    action: input.action,
    status: input.status,
    message: input.message ?? null,
    metadata: input.metadata ?? {},
    duration_ms: input.durationMs ?? null,
  });

  return { error: error?.message ?? null };
}

export async function getExecutionLogsForQueueItem(queueType: QueueType, queueItemId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("execution_logs")
    .select("*")
    .eq("queue_type", queueType)
    .eq("queue_item_id", queueItemId)
    .order("created_at", { ascending: false });

  return { data: (data || []) as ExecutionLog[], error: error?.message ?? null };
}

export async function getRecentExecutionLogs(limit = 50, status?: LogStatus) {
  const supabase = await createClient();
  let query = supabase.from("execution_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  return { data: (data || []) as ExecutionLog[], error: error?.message ?? null };
}
