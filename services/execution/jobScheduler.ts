import { runContentGenerationWorker } from "@/jobs/workers/contentGenerationWorker";
import { runContentUpdateWorker } from "@/jobs/workers/contentUpdateWorker";
import { runKnowledgeAcquisitionWorker } from "@/jobs/workers/knowledgeAcquisitionWorker";
import { executePriorityDecisions, autoApproveHighPriorityDecisions } from "./priorityExecutionEngine";
import { getAutomationConfig } from "@/services/system/settings";

export interface SchedulerRunOptions {
  autoApproveThreshold?: number;
  priorityTopN?: number;
  generationLimit?: number;
  updateLimit?: number;
}

export interface SchedulerRunResult {
  priority: Awaited<ReturnType<typeof executePriorityDecisions>>;
  generation: Awaited<ReturnType<typeof runContentGenerationWorker>>;
  update: Awaited<ReturnType<typeof runContentUpdateWorker>>;
  knowledgeAcquisition: Awaited<ReturnType<typeof runKnowledgeAcquisitionWorker>>;
  errors: string[];
}

export async function runSchedulerCycle(options: SchedulerRunOptions = {}): Promise<SchedulerRunResult> {
  const config = await getAutomationConfig();
  const { autoApproveThreshold = 80, priorityTopN = 10, updateLimit = 10 } = options;
  const generationLimit = options.generationLimit ?? config.publishLimitPerRun;
  const errors: string[] = [];

  // Step 1: Auto-approve high-priority decisions
  const approveResult = await autoApproveHighPriorityDecisions(autoApproveThreshold);
  if (approveResult.error) errors.push(approveResult.error);

  // Step 2: Execute approved priority decisions -> enqueue generation/update jobs
  const priority = await executePriorityDecisions({ topN: priorityTopN });
  if (priority.errors.length > 0) errors.push(...priority.errors);

  // Step 3: Run content generation worker (rate-limited by publish_limit_per_run)
  const generation = await runContentGenerationWorker(generationLimit);
  if (generation.error) errors.push(generation.error);

  // Step 4: Run content update worker
  const update = await runContentUpdateWorker(updateLimit);
  if (update.error) errors.push(update.error);

  // Step 5: Run knowledge acquisition worker
  const knowledgeAcquisition = await runKnowledgeAcquisitionWorker(updateLimit);
  if (knowledgeAcquisition.error) errors.push(knowledgeAcquisition.error);

  return {
    priority,
    generation,
    update,
    knowledgeAcquisition,
    errors,
  };
}

export function isRetryable(errorMessage: string): boolean {
  const retryablePatterns = ["timeout", "rate limit", "temporarily unavailable", "network", "connection"];
  return retryablePatterns.some((pattern) => errorMessage.toLowerCase().includes(pattern));
}
