import { createClient } from "@/lib/supabase/server";
import { ContentPriorityQueueItem, KnowledgeObjectType, SupportedLanguage } from "@/lib/types";
import { logExecution } from "./executionLogger";
import { enqueueContentGeneration, enqueueContentUpdate } from "@/services/intelligence/contentDecisionEngine";

export interface PriorityExecutionOptions {
  topN?: number;
  decisionTypes?: ("create" | "update" | "ignore")[];
}

export interface PriorityExecutionResult {
  processed: number;
  createCount: number;
  updateCount: number;
  ignoreCount: number;
  errors: string[];
}

export async function executePriorityDecisions(options: PriorityExecutionOptions = {}): Promise<PriorityExecutionResult> {
  const { topN = 10, decisionTypes = ["create", "update", "ignore"] } = options;
  const supabase = await createClient();

  const result: PriorityExecutionResult = {
    processed: 0,
    createCount: 0,
    updateCount: 0,
    ignoreCount: 0,
    errors: [],
  };

  const { data: decisionIds, error } = await supabase
    .from("content_priority_queue")
    .select("id")
    .eq("status", "approved")
    .in("decision_type", decisionTypes)
    .lt("retry_count", 3)
    .order("priority_score", { ascending: false })
    .limit(topN);

  if (error || !decisionIds) {
    result.errors.push(error?.message || "Failed to fetch priority decisions");
    return result;
  }

  for (const row of decisionIds) {
    const { data: decision, error: claimError } = await supabase
      .rpc("claim_queue_item", { queue_type: "priority", item_id: row.id })
      .maybeSingle();

    if (claimError || !decision) {
      continue;
    }

    const decisionTyped = decision as unknown as ContentPriorityQueueItem;
    const start = Date.now();
    try {
      await supabase
        .from("content_priority_queue")
        .update({ status: "done", processing_started_at: new Date().toISOString() })
        .eq("id", decisionTyped.id);

      await logExecution({
        queueType: "priority",
        queueItemId: decisionTyped.id,
        objectId: decisionTyped.object_id,
        objectType: decisionTyped.object_type,
        action: `execute_${decisionTyped.decision_type}`,
        status: "started",
      });

      if (decisionTyped.decision_type === "create") {
        const title = decisionTyped.reason || "New content opportunity";
        const enqueueResult = await enqueueContentGeneration(
          decisionTyped.object_type,
          title,
          decisionTyped.reason || "Generated from priority decision",
          decisionTyped.priority_score,
          undefined,
          decisionTyped.metadata ?? {}
        );
        if (enqueueResult.error) throw new Error(enqueueResult.error);
        result.createCount++;
      } else if (decisionTyped.decision_type === "update") {
        const enqueueResult = await enqueueContentUpdate(
          decisionTyped.object_id,
          decisionTyped.object_type,
          decisionTyped.reason || "Priority-driven update",
          decisionTyped.priority_score,
          decisionTyped.metadata ?? {}
        );
        if (enqueueResult.error) throw new Error(enqueueResult.error);
        result.updateCount++;
      } else {
        result.ignoreCount++;
      }

      await logExecution({
        queueType: "priority",
        queueItemId: decisionTyped.id,
        objectId: decisionTyped.object_id,
        objectType: decisionTyped.object_type,
        action: `execute_${decisionTyped.decision_type}`,
        status: "success",
        message: `Executed ${decisionTyped.decision_type} decision`,
        durationMs: Date.now() - start,
      });

      result.processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await supabase
        .from("content_priority_queue")
        .update({
          status: "approved",
          retry_count: decisionTyped.retry_count + 1,
          failed_reason: message,
        })
        .eq("id", decisionTyped.id);

      await logExecution({
        queueType: "priority",
        queueItemId: decisionTyped.id,
        objectId: decisionTyped.object_id,
        objectType: decisionTyped.object_type,
        action: `execute_${decisionTyped.decision_type}`,
        status: "failed",
        message,
        durationMs: Date.now() - start,
      });

      result.errors.push(message);
    }
  }

  return result;
}

export async function autoApproveHighPriorityDecisions(threshold = 80) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_priority_queue")
    .update({ status: "approved" })
    .eq("status", "pending")
    .gte("priority_score", threshold);

  return { error: error?.message ?? null };
}
