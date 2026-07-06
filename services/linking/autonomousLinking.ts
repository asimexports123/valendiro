/**
 * Autonomous Internal Linking Service
 * 
 * Automatically builds internal links between topics using knowledge relationships
 * No manual intervention required
 */

import { getAdminClient } from "@/lib/supabase/clientFactory";

const supabase = getAdminClient();

/**
 * Build internal links for a published topic
 */
export async function buildInternalLinks(topicSlug: string): Promise<void> {
  console.log(`Building internal links for: ${topicSlug}`);

  // Get topic ID
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", topicSlug)
    .single();

  if (topicError || !topic) {
    console.warn(`Topic not found or query failed for ${topicSlug}:`, topicError?.message);
    return;
  }

  // Find related topics using knowledge relationships
  const { data: relationships, error: relError } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .or(`source_id.eq.${topic.id},target_id.eq.${topic.id}`)
    .limit(20);

  if (relError) {
    throw new Error(`Failed to fetch relationships for ${topicSlug}: ${relError.message}`);
  }

  if (!relationships || relationships.length === 0) {
    console.log(`No relationships found for ${topicSlug}`);
    return;
  }

  // Extract related topic IDs
  const relatedTopicIds = new Set<string>();
  relationships.forEach(rel => {
    if (rel.source_id !== topic.id) relatedTopicIds.add(rel.source_id);
    if (rel.target_id !== topic.id) relatedTopicIds.add(rel.target_id);
  });

  // Create internal links
  for (const relatedId of relatedTopicIds) {
    await createInternalLink(topic.id, relatedId);
  }

  console.log(`Internal links built for ${topicSlug}: ${relatedTopicIds.size} links`);
}

/**
 * Create internal link between two topics
 */
async function createInternalLink(sourceId: string, targetId: string): Promise<void> {
  // Check if link already exists
  const { data: existing } = await supabase
    .from("internal_links")
    .select("id")
    .eq("source_id", sourceId)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    return; // Link already exists
  }

  // Create new internal link
  const { error: insertError } = await supabase
    .from("internal_links")
    .insert({
      source_id: sourceId,
      target_id: targetId,
      link_type: "related",
      created_at: new Date().toISOString()
    });

  if (insertError) {
    throw new Error(`Failed to create internal link ${sourceId} → ${targetId}: ${insertError.message}`);
  }
}

/**
 * Build internal links for all published topics
 */
export async function buildAllInternalLinks(): Promise<void> {
  const { data: topics, error } = await supabase
    .from("topics")
    .select("id, slug")
    .eq("status", "published")
    .limit(100);

  if (error) {
    throw new Error(`Failed to fetch published topics: ${error.message}`);
  }

  if (!topics || topics.length === 0) {
    console.log("No published topics to build links for");
    return;
  }

  console.log(`Building internal links for ${topics.length} topics`);
  const errors: string[] = [];

  for (const topic of topics) {
    try {
      await buildInternalLinks(topic.slug);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Failed to build links for ${topic.slug}: ${message}`);
      errors.push(`${topic.slug}: ${message}`);
    }
  }

  if (errors.length > 0) {
    console.error(`Internal linking completed with ${errors.length} error(s)`);
  }
}

/**
 * Run continuous internal linking loop
 */
export async function runContinuousLinking(): Promise<void> {
  console.log("Starting continuous internal linking loop...");

  while (true) {
    await buildAllInternalLinks();

    // Wait 1 hour before next check
    await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
  }
}
