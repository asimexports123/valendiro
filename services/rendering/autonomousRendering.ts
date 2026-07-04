/**
 * Autonomous Page Rendering Service
 * 
 * Automatically renders production-quality pages from Knowledge Packages
 * No manual intervention required
 */

import { getAdminClient } from "@/lib/supabase/clientFactory";

const supabase = getAdminClient();

/**
 * Render page for an assembled topic
 */
export async function renderPage(topicSlug: string): Promise<void> {
  console.log(`Rendering page for: ${topicSlug}`);

  try {
    // Import the actual render function from renderer orchestrator
    const { render } = await import("../renderer/orchestrator");
    const { generateEngagementLayer } = await import("../engagement/engagementLayer");
    const { generateArticleContent, writeArticleToTopic } = await import("../writing/autonomousWriting");

    // Get the Knowledge Package for this topic
    const { data: packageData } = await supabase
      .from("knowledge_packages")
      .select("*")
      .eq("topic_slug", topicSlug)
      .single();

    if (!packageData) {
      throw new Error(`Knowledge Package not found for ${topicSlug}`);
    }

    // Step 1: Generate actual article content from Knowledge Package
    console.log(`Generating article content for ${topicSlug}`);
    const articleContent = await generateArticleContent(topicSlug, packageData.package);
    await writeArticleToTopic(topicSlug, articleContent);
    console.log(`Article content written for ${topicSlug}`);

    // Step 2: Render the page using correct RenderRequest structure (Layer 1: Core Content)
    const result = await render({
      packageId: packageData.id,
      format: "html",
      rendererId: "knowledge-authoring-v1"
    });

    console.log(`Layer 1 (Core Content) rendered for ${topicSlug}`);

    // Step 3: Generate Layer 2: Engagement Layer
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", topicSlug)
      .single();

    if (topic) {
      // Get related topics for engagement hooks
      const { data: relatedTopics } = await supabase
        .from("knowledge_relationships")
        .select("target_topic_id")
        .eq("source_topic_id", topic.id)
        .limit(3);

      const relatedTopicIds = relatedTopics?.map(r => r.target_topic_id) || [];
      await generateEngagementLayer(topic.id, relatedTopicIds);
      console.log(`Layer 2 (Engagement Layer) generated for ${topicSlug}`);
    }

    // Update queue item status
    await updateQueueItemStatus(topicSlug, "rendered", { success: true, renderedAt: new Date().toISOString() });

  } catch (error) {
    console.error(`Error rendering page for ${topicSlug}:`, error);
    await updateQueueItemStatus(topicSlug, "failed", { error: String(error) });
    throw error; // Re-throw for retry logic
  }
}

/**
 * Process all assembled topics and render pages
 */
export async function processRenderingQueue(): Promise<void> {
  const { data: queueItems } = await supabase
    .from("content_generation_queue")
    .select("*")
    .eq("status", "assembled")
    .lt("attempts", 3)
    .limit(10);

  if (!queueItems || queueItems.length === 0) {
    console.log("No topics in rendering queue");
    return;
  }

  console.log(`Processing ${queueItems.length} topics from rendering queue`);

  for (const item of queueItems) {
    try {
      await supabase
        .from("content_generation_queue")
        .update({ attempts: (item.attempts || 0) + 1 })
        .eq("id", item.id);

      await renderPage(item.topic_slug);
    } catch (error) {
      console.error(`Failed to render ${item.topic_slug} (attempt ${item.attempts + 1}):`, error);
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
 * Run continuous rendering loop
 */
export async function runContinuousRendering(): Promise<void> {
  console.log("Starting continuous rendering loop...");

  while (true) {
    await processRenderingQueue();

    // Wait 5 minutes before next check
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
  }
}
