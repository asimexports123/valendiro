import { runContentGenerationWorker } from "@/jobs/workers/contentGenerationWorker";
import { runContentUpdateWorker } from "@/jobs/workers/contentUpdateWorker";

export type NewQueueType = "generation" | "update";

export async function runSchedulerOnce(queueType: NewQueueType): Promise<void> {
  if (queueType === "generation") {
    const result = await runContentGenerationWorker(1);
    if (result.error) console.error("Generation worker failed:", result.error);
  } else if (queueType === "update") {
    const result = await runContentUpdateWorker(1);
    if (result.error) console.error("Update worker failed:", result.error);
  }
}
