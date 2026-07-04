/**
 * Stopping Condition Service
 * 
 * Determines when to stop topic generation
 * Stopping condition: No significant knowledge gaps remain in any domain
 */

import { analyzeAllDomainsCoverage, hasSignificantGaps, CoverageAnalysis } from "./coverageEngine";
import { queueAllMissingTopics, hasQueueCapacity } from "./topicQueueService";

export interface StoppingConditionResult {
  shouldContinue: boolean;
  reason: string;
  domainsWithGaps: CoverageAnalysis[];
  totalDomains: number;
  domainsComplete: number;
}

/**
 * Check if generation should continue
 */
export async function shouldContinueGeneration(): Promise<StoppingConditionResult> {
  const analyses = await analyzeAllDomainsCoverage();
  const domainsWithGaps = analyses.filter(analysis => hasSignificantGaps(analysis));

  if (domainsWithGaps.length === 0) {
    return {
      shouldContinue: false,
      reason: "No significant knowledge gaps remain in any domain",
      domainsWithGaps: [],
      totalDomains: analyses.length,
      domainsComplete: analyses.length
    };
  }

  return {
    shouldContinue: true,
    reason: `${domainsWithGaps.length} domains have significant coverage gaps`,
    domainsWithGaps,
    totalDomains: analyses.length,
    domainsComplete: analyses.length - domainsWithGaps.length
  };
}

/**
 * Auto-improve domains until stopping condition met
 * Runs in a loop until no significant gaps remain
 */
export async function autoImproveUntilComplete(): Promise<void> {
  let iterations = 0;
  const MAX_ITERATIONS = 100; // Prevent infinite loops

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`\n=== Auto-improvement iteration ${iterations} ===`);

    // Check stopping condition
    const result = await shouldContinueGeneration();

    console.log(`Should continue: ${result.shouldContinue}`);
    console.log(`Reason: ${result.reason}`);
    console.log(`Domains complete: ${result.domainsComplete}/${result.totalDomains}`);

    if (!result.shouldContinue) {
      console.log("\n=== Stopping condition met ===");
      console.log("No significant knowledge gaps remain");
      break;
    }

    // Check queue capacity
    const hasCapacity = await hasQueueCapacity();
    if (!hasCapacity) {
      console.log("Queue at capacity, waiting...");
      // Wait 5 minutes before retry
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      continue;
    }

    // Queue missing topics
    console.log("Queueing missing topics...");
    await queueAllMissingTopics();

    // Wait for topics to be processed (check every minute)
    console.log("Waiting for topics to be processed...");
    await new Promise(resolve => setTimeout(resolve, 60 * 1000));
  }

  if (iterations >= MAX_ITERATIONS) {
    console.log("Warning: Max iterations reached");
  }
}

/**
 * Get coverage summary
 */
export async function getCoverageSummary(): Promise<{
  totalDomains: number;
  domainsComplete: number;
  domainsWithGaps: number;
  overallCoverage: number;
}> {
  const analyses = await analyzeAllDomainsCoverage();
  const domainsWithGaps = analyses.filter(analysis => hasSignificantGaps(analysis));

  const totalCoverage = analyses.reduce((sum, analysis) => sum + analysis.coveragePercentage, 0);
  const overallCoverage = totalCoverage / analyses.length;

  return {
    totalDomains: analyses.length,
    domainsComplete: analyses.length - domainsWithGaps.length,
    domainsWithGaps: domainsWithGaps.length,
    overallCoverage
  };
}
