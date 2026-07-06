/**
 * Incremental Article Regeneration Service
 * Regenerates only affected articles when knowledge is updated
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface RegenerationTask {
  topicId: string;
  articleId: string;
  reason: "knowledge_update" | "fact_check" | "seo_optimization";
  priority: number;
  createdAt: string;
}

export class IncrementalRegenerationService {
  async queueTopicRegeneration(topicId: string, reason: string = "knowledge_update"): Promise<void> {
    const supabase = createAdminClient();

    // Add to update queue
    await supabase
      .from("update_queue")
      .insert({
        object_id: topicId,
        object_type: "topic",
        job_type: "content_update",
        priority: 75, // HIGH priority
        status: "pending",
        scheduled_at: new Date().toISOString(),
        metadata: { reason },
      });
  }

  async queueBatchRegeneration(topicIds: string[], reason: string = "knowledge_update"): Promise<void> {
    const supabase = createAdminClient();

    const queueItems = topicIds.map(topicId => ({
      object_id: topicId,
      object_type: "topic",
      job_type: "content_update",
      priority: 75,
      status: "pending",
      scheduled_at: new Date().toISOString(),
      metadata: { reason },
    }));

    await supabase
      .from("update_queue")
      .insert(queueItems);
  }

  async processRegenerationQueue(batchSize: number = 10): Promise<{
    processed: number;
    failed: number;
    skipped: number;
  }> {
    const supabase = createAdminClient();

    // Fetch pending items
    const { data: queueItems } = await supabase
      .from("update_queue")
      .select("*")
      .eq("status", "pending")
      .eq("object_type", "topic")
      .eq("job_type", "content_update")
      .order("priority", { ascending: false })
      .order("scheduled_at", { ascending: true })
      .limit(batchSize);

    if (!queueItems || queueItems.length === 0) {
      return { processed: 0, failed: 0, skipped: 0 };
    }

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const item of queueItems) {
      try {
        // Mark as in progress
        await supabase
          .from("update_queue")
          .update({
            status: "in_progress",
            started_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        // Check if topic has any recent accepted knowledge updates
        const hasNewKnowledge = await this.checkForNewKnowledge(item.object_id);

        if (!hasNewKnowledge) {
          // Skip if no new knowledge
          await supabase
            .from("update_queue")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", item.id);
          skipped++;
          continue;
        }

        // Trigger regeneration using existing content update worker
        await this.triggerRegeneration(item.object_id);

        // Mark as completed
        await supabase
          .from("update_queue")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        processed++;
      } catch (error) {
        console.error(`Failed to process regeneration for topic ${item.object_id}:`, error);

        // Update retry count
        const newRetryCount = (item.retry_count || 0) + 1;

        if (newRetryCount >= item.max_retries) {
          await supabase
            .from("update_queue")
            .update({
              status: "failed",
              error_message: error instanceof Error ? error.message : String(error),
              completed_at: new Date().toISOString(),
            })
            .eq("id", item.id);
          failed++;
        } else {
          await supabase
            .from("update_queue")
            .update({
              status: "pending",
              retry_count: newRetryCount,
              scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Retry in 5 minutes
            })
            .eq("id", item.id);
        }
      }
    }

    return { processed, failed, skipped };
  }

  private async checkForNewKnowledge(topicId: string): Promise<boolean> {
    const supabase = createAdminClient();

    // Check for recent accepted discovered articles mapped to this topic
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentArticles } = await supabase
      .from("discovered_article_topics")
      .select(`
        discovered_articles(status, created_at)
      `)
      .eq("topic_id", topicId)
      .gte("created_at", since);

    if (!recentArticles || recentArticles.length === 0) {
      return false;
    }

    // Check if any accepted articles exist
    const hasAccepted = recentArticles.some((item: any) => 
      item.discovered_articles?.status === "accepted"
    );

    return hasAccepted;
  }

  private async triggerRegeneration(topicId: string): Promise<void> {
    // This would integrate with the existing content update worker
    // For now, we'll update the topic's updated_at timestamp
    const supabase = createAdminClient();

    await supabase
      .from("topics")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", topicId);
  }

  async getRegenerationStats(hours: number = 24): Promise<{
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    averageProcessingTime: number;
  }> {
    const supabase = createAdminClient();

    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data: queue } = await supabase
      .from("update_queue")
      .select("*")
      .eq("object_type", "topic")
      .eq("job_type", "content_update");

    const pending = (queue || []).filter(q => q.status === "pending").length;
    const inProgress = (queue || []).filter(q => q.status === "in_progress").length;
    const completed = (queue || []).filter(
      q => q.status === "completed" && new Date(q.completed_at) > new Date(since)
    ).length;
    const failed = (queue || []).filter(
      q => q.status === "failed" && new Date(q.completed_at) > new Date(since)
    ).length;

    // Calculate average processing time
    const completedItems = (queue || []).filter(q => q.status === "completed" && q.started_at && q.completed_at);
    const processingTimes = completedItems.map(q => 
      new Date(q.completed_at).getTime() - new Date(q.started_at).getTime()
    );
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;

    return {
      pending,
      inProgress,
      completed,
      failed,
      averageProcessingTime,
    };
  }

  async identifyTopicsNeedingRegeneration(limit: number = 50): Promise<string[]> {
    const supabase = createAdminClient();

    // Find topics with recent accepted discovered articles
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: acceptedArticles } = await supabase
      .from("discovered_articles")
      .select("id")
      .eq("status", "accepted")
      .gte("created_at", since)
      .limit(limit);

    if (!acceptedArticles || acceptedArticles.length === 0) {
      return [];
    }

    const articleIds = acceptedArticles.map(a => a.id);

    const { data: topicMappings } = await supabase
      .from("discovered_article_topics")
      .select("topic_id")
      .in("discovered_article_id", articleIds);

    if (!topicMappings || topicMappings.length === 0) {
      return [];
    }

    // Get unique topic IDs
    const uniqueTopicIds = [...new Set(topicMappings.map((m: any) => m.topic_id))];

    return uniqueTopicIds;
  }

  async autoQueueRegeneration(): Promise<{ queued: number; skipped: number }> {
    const topicIds = await this.identifyTopicsNeedingRegeneration();

    if (topicIds.length === 0) {
      return { queued: 0, skipped: 0 };
    }

    let queued = 0;
    let skipped = 0;

    for (const topicId of topicIds) {
      try {
        // Check if already in queue
        const supabase = createAdminClient();
        const { data: existing } = await supabase
          .from("update_queue")
          .select("*")
          .eq("object_id", topicId)
          .eq("object_type", "topic")
          .eq("job_type", "content_update")
          .in("status", ["pending", "in_progress"])
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        await this.queueTopicRegeneration(topicId, "knowledge_update");
        queued++;
      } catch (error) {
        console.error(`Failed to queue regeneration for topic ${topicId}:`, error);
      }
    }

    return { queued, skipped };
  }
}

export async function createIncrementalRegenerationService(): Promise<IncrementalRegenerationService> {
  return new IncrementalRegenerationService();
}
