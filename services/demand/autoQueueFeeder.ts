import { SupportedLanguage } from "@/lib/types";
import { captureInternalSearchIntentDemand, captureSeasonalTrends } from "./demandSources";
import { runTopicGapDetection } from "./topicGapDetection";
import {
  generateOpportunitiesFromDemandSignals,
  generateOpportunitiesFromTopicGaps,
  pushOpportunitiesToQueue,
} from "./opportunityGenerator";

export interface QueueFeederOptions {
  languageCode?: SupportedLanguage;
  demandSignalLimit?: number;
  topicGapLimit?: number;
  minPriorityScore?: number;
}

export interface QueueFeederResult {
  demandSignalsInserted: number;
  topicGapsCalculated: number;
  opportunitiesGenerated: number;
  opportunitiesQueued: number;
  errors: string[];
}

export async function runDemandPipeline(options: QueueFeederOptions = {}): Promise<QueueFeederResult> {
  const {
    languageCode = "en",
    demandSignalLimit = 50,
    topicGapLimit = 20,
    minPriorityScore = 40,
  } = options;

  const result: QueueFeederResult = {
    demandSignalsInserted: 0,
    topicGapsCalculated: 0,
    opportunitiesGenerated: 0,
    opportunitiesQueued: 0,
    errors: [],
  };

  // Step 1: Capture internal demand signals
  const demandResult = await captureInternalSearchIntentDemand(languageCode);
  if (demandResult.error) result.errors.push(demandResult.error);
  result.demandSignalsInserted += demandResult.inserted;

  // Step 2: Capture seasonal trends
  const seasonalResult = await captureSeasonalTrends(languageCode);
  if (seasonalResult.error) result.errors.push(seasonalResult.error);
  result.demandSignalsInserted += seasonalResult.inserted;

  // Step 3: Calculate topic gap scores
  const gapResult = await runTopicGapDetection(languageCode);
  if (gapResult.error) result.errors.push(gapResult.error);
  result.topicGapsCalculated = gapResult.calculated;

  // Step 4: Generate opportunities from demand signals
  const demandOpportunities = await generateOpportunitiesFromDemandSignals(languageCode, demandSignalLimit);
  if (demandOpportunities.error) result.errors.push(demandOpportunities.error);

  const filteredDemandOpportunities = demandOpportunities.opportunities.filter(
    (o) => o.priorityScore >= minPriorityScore
  );

  const queueResult1 = await pushOpportunitiesToQueue(filteredDemandOpportunities, languageCode);
  result.opportunitiesQueued += queueResult1.queued;
  result.errors.push(...queueResult1.errors);

  // Step 5: Generate opportunities from topic gaps
  const gapOpportunities = await generateOpportunitiesFromTopicGaps(languageCode, topicGapLimit);
  if (gapOpportunities.error) result.errors.push(gapOpportunities.error);

  const filteredGapOpportunities = gapOpportunities.opportunities.filter(
    (o) => o.priorityScore >= minPriorityScore
  );

  const queueResult2 = await pushOpportunitiesToQueue(filteredGapOpportunities, languageCode);
  result.opportunitiesQueued += queueResult2.queued;
  result.errors.push(...queueResult2.errors);

  result.opportunitiesGenerated = filteredDemandOpportunities.length + filteredGapOpportunities.length;

  return result;
}
