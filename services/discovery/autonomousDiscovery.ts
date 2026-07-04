/**
 * Autonomous Topic Discovery Service
 * 
 * Automatically discovers topics from sources
 * No manual intervention required
 */

import { WikipediaAdapter } from "../discovery/adapters/wikipediaAdapter";
import { DocsAdapter } from "../discovery/adapters/docsAdapter";
import { createClient } from "@supabase/supabase-js";
import type { SlotInfo } from "../discovery/adapters";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DiscoveredTopic {
  slug: string;
  title: string;
  description: string;
  sourceUrl: string | null;
  adapterName: string;
}

/**
 * Auto-discover topics for a given topic slug
 */
export async function autoDiscoverTopic(topicSlug: string, topicTitle: string): Promise<DiscoveredTopic | null> {
  console.log(`Auto-discovering topic: ${topicSlug}`);

  try {
    // Try Wikipedia first
    const wikiAdapter = new WikipediaAdapter();
    
    // Create empty slot for discovery
    const emptySlots: SlotInfo[] = [{
      id: "discovery-slot",
      slug: topicSlug,
      title: topicTitle,
      description: "Auto-discovery slot",
      sectionSlug: "discovery",
      sectionName: "Discovery"
    }];

    const wikiCandidates = await wikiAdapter.extract(topicSlug, topicTitle, emptySlots);

    if (wikiCandidates.length > 0) {
      const candidate = wikiCandidates[0];
      return {
        slug: topicSlug,
        title: candidate.title,
        description: candidate.description,
        sourceUrl: candidate.sourceUrl,
        adapterName: "WikipediaAdapter"
      };
    }

    return null;
  } catch (error) {
    console.error(`Error discovering topic ${topicSlug}:`, error);
    return null;
  }
}

/**
 * Auto-discover multiple topics
 */
export async function autoDiscoverTopics(topicSlugs: string[], topicTitles: string[]): Promise<DiscoveredTopic[]> {
  const results: DiscoveredTopic[] = [];

  for (let i = 0; i < topicSlugs.length; i++) {
    const slug = topicSlugs[i];
    const title = topicTitles[i] || slug;
    const discovered = await autoDiscoverTopic(slug, title);
    if (discovered) {
      results.push(discovered);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Get topics from generation queue and discover them
 */
export async function processDiscoveryQueue(): Promise<void> {
  const { data: queueItems } = await supabase
    .from("content_generation_queue")
    .select("*")
    .eq("status", "pending")
    .limit(10);

  if (!queueItems || queueItems.length === 0) {
    console.log("No topics in discovery queue");
    return;
  }

  console.log(`Processing ${queueItems.length} topics from queue`);

  for (const item of queueItems) {
    const discovered = await autoDiscoverTopic(item.topic_slug, item.topic_slug);

    if (discovered) {
      // Update queue item with discovered data
      await supabase
        .from("content_generation_queue")
        .update({
          status: "discovered",
          discovered_data: discovered,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      console.log(`Discovered: ${item.topic_slug}`);
    } else {
      // Mark as failed
      await supabase
        .from("content_generation_queue")
        .update({
          status: "failed",
          error_message: "Could not discover topic from any source",
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      console.log(`Failed to discover: ${item.topic_slug}`);
    }
  }
}

/**
 * Run continuous discovery loop
 */
export async function runContinuousDiscovery(): Promise<void> {
  console.log("Starting continuous discovery loop...");

  while (true) {
    await processDiscoveryQueue();

    // Wait 5 minutes before next check
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
  }
}
