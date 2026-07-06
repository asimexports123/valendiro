/**
 * Run Workers Directly (Bypass Scheduler)
 *
 * Directly runs the workers to test the unified queue architecture
 * without the getAutomationConfig request context issue.
 */

import { runKnowledgeAcquisitionWorker } from "../jobs/workers/knowledgeAcquisitionWorker";

async function main() {
  console.log("Running Knowledge Acquisition Worker Directly");
  console.log("================================================\n");

  try {
    const result = await runKnowledgeAcquisitionWorker(30);

    console.log("Worker Results:");
    console.log(`Processed: ${result.processed}`);
    console.log(`Error: ${result.error || "None"}`);

    if (result.results && result.results.length > 0) {
      console.log("\nResults:");
      for (const res of result.results) {
        console.log(`  Job ${res.jobId}: ${res.status} - ${res.message}`);
        console.log(`    Package ID: ${res.packageId}`);
        console.log(`    Topic ID: ${res.topicId}`);
      }
    }
  } catch (error: any) {
    console.error("Worker failed:", error.message);
    console.error(error.stack);
  }
}

main().catch(console.error);
