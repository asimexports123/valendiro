import { JobDefinition, JobType } from "@/jobs/definitions/jobTypes";
import { UpdateQueue } from "@/lib/types";

export interface WorkerContext {
  job: UpdateQueue;
  definition: JobDefinition;
}

export abstract class BaseWorker {
  abstract readonly type: JobType;

  async run(ctx: WorkerContext): Promise<{ success: boolean; error?: string }> {
    try {
      await this.execute(ctx);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  abstract execute(ctx: WorkerContext): Promise<void>;
}
