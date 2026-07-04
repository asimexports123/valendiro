/**
 * Autonomous Publishing Service
 * 
 * Automatically publishes rendered pages to production
 * No manual intervention required
 */

import { getAdminClient } from "@/lib/supabase/clientFactory";

const supabase = getAdminClient();

/**
 * Publish a rendered page
 */
export async function publishPage(topicSlug: string): Promise<void> {
  console.log(`Publishing page for: ${topicSlug}`);

  try {
    // Get the rendered content
    const { data: renderedData } = await supabase
      .from("rendered_content")
      .select("*")
      .eq("topic_slug", topicSlug)
      .single();

    if (!renderedData) {
      throw new Error(`Rendered content not found for ${topicSlug}`);
    }

    // Update the topic with published content
    const { error: updateError } = await supabase
      .from("topics")
      .update({
        content: renderedData.content,
        html_content: renderedData.html_content,
        status: "published",
        published_at: new Date().toISOString()
      })
      .eq("slug", topicSlug);

    if (updateError) {
      throw new Error(`Failed to update topic: ${updateError.message}`);
    }

    console.log(`Page published for ${topicSlug}`);

    // Update queue item status
    await updateQueueItemStatus(topicSlug, "published", { success: true, publishedAt: new Date().toISOString() });

  } catch (error) {
    console.error(`Error publishing page for ${topicSlug}:`, error);
    await updateQueueItemStatus(topicSlug, "failed", { error: String(error) });
    throw error; // Re-throw for retry logic
  }
}

/**
 * Process all rendered pages and publish them
 */
export async function processPublishingQueue(): Promise<void> {
  const { data: queueItems } = await supabase
    .from("content_generation_queue")
    .select("*")
    .eq("status", "rendered")
    .lt("attempts", 3)
    .limit(10);

  if (!queueItems || queueItems.length === 0) {
    console.log("No topics in publishing queue");
    return;
  }

  console.log(`Processing ${queueItems.length} topics from publishing queue`);

  for (const item of queueItems) {
    try {
      await supabase
        .from("content_generation_queue")
        .update({ attempts: (item.attempts || 0) + 1 })
        .eq("id", item.id);

      await publishPage(item.topic_slug);
    } catch (error) {
      console.error(`Failed to publish ${item.topic_slug} (attempt ${item.attempts + 1}):`, error);
      if ((item.attempts || 0) + 1 >= (item.max_attempts || 3)) {
        await updateQueueItemStatus(item.topic_slug, "failed", { error: String(error), maxAttemptsReached: true });
      }
    }
  }
}

/**
 * Update queue item status
 */
async function updateQueueItemStatus(topicSlug: string, status: string, metadata: any): Promise<void> {
  await supabase
    .from("content_generation_queue")
    .update({
      status,
      metadata,
      updated_at: new Date().toISOString()
    })
    .eq("topic_slug", topicSlug);
}

/**
 * Update topic status
 */
async function updateTopicStatus(topicSlug: string, status: string): Promise<void> {
  await supabase
    .from("topics")
    .update({
      status,
      published_at: new Date().toISOString()
    })
    .eq("slug", topicSlug);
}

/**
 * Run continuous publishing loop
 */
export async function runContinuousPublishing(): Promise<void> {
  console.log("Starting continuous publishing loop...");

  while (true) {
    await processPublishingQueue();

    // Wait 5 minutes before next check
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
  }
}
