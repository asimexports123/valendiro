/**
 * Run Scheduler Manually
 *
 * Manually triggers the scheduler to process pending jobs in the canonical update_queue.
 */

import { runSchedulerCycle } from "../services/execution/jobScheduler";

async function main() {
  console.log("Running Scheduler");
  console.log("================\n");

  try {
    const result = await runSchedulerCycle({
      generationLimit: 1,
      updateLimit: 1,
    });

    console.log("Scheduler Results:");
    console.log("==================");
    console.log(`Priority: ${result.priority.processed} processed`);
    console.log(`Generation: ${result.generation.processed} processed`);
    console.log(`Update: ${result.update.processed} processed`);
    console.log(`Knowledge Acquisition: ${result.knowledgeAcquisition.processed} processed`);

    if (result.errors.length > 0) {
      console.log(`\nErrors: ${result.errors.join(", ")}`);
    }

    if (result.knowledgeAcquisition.results && result.knowledgeAcquisition.results.length > 0) {
      console.log("\nKnowledge Acquisition Results:");
      for (const res of result.knowledgeAcquisition.results) {
        console.log(`  Job ${res.jobId}: ${res.status} - ${res.message}`);
        console.log(`    Package ID: ${res.packageId}`);
        console.log(`    Topic ID: ${res.topicId}`);
      }
    }
  } catch (error: any) {
    console.error("Scheduler failed:", error.message);
  }
}

main().catch(console.error);
