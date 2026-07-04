/**
 * Topic Queue Service
 * 
 * Queues missing topics for generation
 * Only queues topics that are missing from coverage
 */

import { createClient } from "@supabase/supabase-js";
import { analyzeCoverage, CoverageAnalysis } from "./coverageEngine";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Queue missing topics for a domain
 */
export async function queueMissingTopics(domainId: string): Promise<void> {
  const analysis = await analyzeCoverage(domainId);

  if (analysis.missingTopics.length === 0) {
    console.log(`No missing topics for domain: ${domainId}`);
    return;
  }

  console.log(`Queueing ${analysis.missingTopics.length} missing topics for ${domainId}`);

  // Queue each missing topic
  for (const topicSlug of analysis.missingTopics) {
    await queueTopicForGeneration(topicSlug, domainId);
  }

  console.log(`Queued ${analysis.missingTopics.length} topics for generation`);
}

/**
 * Queue a single topic for generation
 */
async function queueTopicForGeneration(topicSlug: string, domainId: string): Promise<void> {
  // Check if topic already exists in queue
  const { data: existing } = await supabase
    .from("content_generation_queue")
    .select("*")
    .eq("topic_slug", topicSlug)
    .single();

  if (existing) {
    console.log(`Topic ${topicSlug} already in queue`);
    return;
  }

  // Add to generation queue
  const { error } = await supabase
    .from("content_generation_queue")
    .insert({
      topic_slug: topicSlug,
      status: "pending",
      priority: 50,
      metadata: {
        domainId,
        queuedFor: "coverage-gap"
      }
    });

  if (error) {
    console.error(`Error queuing topic ${topicSlug}:`, error);
  }
}

/**
 * Queue missing topics for all domains with gaps
 */
export async function queueAllMissingTopics(): Promise<void> {
  const { getDomainsWithGaps } = await import("./coverageEngine");
  const domainsWithGaps = await getDomainsWithGaps();

  console.log(`Found ${domainsWithGaps.length} domains with coverage gaps`);

  for (const domain of domainsWithGaps) {
    await queueMissingTopics(domain.domainId);
  }
}

/**
 * Check if queue has capacity for new topics
 */
export async function hasQueueCapacity(): Promise<boolean> {
  const { count } = await supabase
    .from("content_generation_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("priority", 90);

  // Allow queueing if less than 50 pending topics
  return (count || 0) < 50;
}
