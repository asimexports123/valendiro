import { createClient as createServerClient } from "@/lib/supabase/server";
import { JobType } from "@/jobs/definitions/jobTypes";
import { UpdateQueue } from "@/lib/types";

export interface EnqueueOptions {
  objectId: string;
  objectType: UpdateQueue["object_type"];
  jobType: JobType;
  priority?: number;
  scheduledAt?: Date;
  payload?: Record<string, unknown>;
}

export async function enqueueJob(options: EnqueueOptions): Promise<UpdateQueue | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("update_queue")
    .insert({
      object_id: options.objectId,
      object_type: options.objectType,
      job_type: options.jobType,
      priority: options.priority ?? 0,
      scheduled_at: options.scheduledAt?.toISOString() ?? new Date().toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to enqueue job", error);
    return null;
  }

  return data as UpdateQueue;
}

export async function claimNextPendingJob(jobType: JobType): Promise<UpdateQueue | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("update_queue")
    .select("*")
    .eq("status", "pending")
    .eq("job_type", jobType)
    .lte("scheduled_at", new Date().toISOString())
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;

  // Mark in_progress
  await supabase
    .from("update_queue")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", data.id);

  return data as UpdateQueue;
}

export async function completeJob(jobId: string, errorMessage?: string): Promise<void> {
  const supabase = await createServerClient();
  await supabase
    .from("update_queue")
    .update({
      status: errorMessage ? "failed" : "completed",
      completed_at: new Date().toISOString(),
      error_message: errorMessage || null,
    })
    .eq("id", jobId);
}
