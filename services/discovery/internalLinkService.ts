/**
 * Automatic Internal Link Regeneration Service
 * 
 * Regenerates internal links between articles automatically after publication
 * Part of the autonomous discovery pipeline
 */

import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

/**
 * Regenerate internal links for a topic
 */
export async function regenerateInternalLinks(topicId: string): Promise<void> {
  console.log(`[InternalLinks] Regenerating internal links for topic: ${topicId}`);

  // Fetch topic details
  const { data: topic, error } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(content, language_code)")
    .eq("id", topicId)
    .eq("topic_translations.language_code", "en")
    .single();

  if (error || !topic) {
    throw new Error(`Topic not found: ${error?.message}`);
  }

  const content = (topic.topic_translations as any)?.[0]?.content || '';
  const topicSlug = topic.slug;

  // Extract topics mentioned in content
  const mentionedTopics = await extractMentionedTopics(content, topicId);

  console.log(`[InternalLinks] Found ${mentionedTopics.length} mentioned topics`);

  // Remove old internal links for this topic
  await supabase
    .from("internal_links")
    .delete()
    .eq("source_topic_id", topicId);

  // Create new internal links
  for (const mentioned of mentionedTopics) {
    await createInternalLink(topicId, mentioned.topicId, mentioned.linkType, mentioned.relevance);
  }

  console.log(`[InternalLinks] Regenerated ${mentionedTopics.length} internal links`);
}

/**
 * Extract topics mentioned in content
 */
async function extractMentionedTopics(content: string, excludeTopicId: string): Promise<Array<{ topicId: string, linkType: string, relevance: number }>> {
  const mentioned: Array<{ topicId: string, linkType: string, relevance: number }> = [];

  // Fetch all topics
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug")
    .neq("id", excludeTopicId)
    .limit(500);

  if (!topics) return mentioned;

  const contentLower = content.toLowerCase();

  for (const topic of topics) {
    const slug = topic.slug.toLowerCase();
    const title = slug.replace(/-/g, ' ');

    // Check if topic is mentioned in content
    if (contentLower.includes(slug) || contentLower.includes(title)) {
      // Determine link type based on context
      const linkType = determineLinkType(content, slug);
      
      // Calculate relevance based on mention frequency and position
      const relevance = calculateRelevance(content, slug);

      mentioned.push({
        topicId: topic.id,
        linkType,
        relevance,
      });
    }
  }

  return mentioned;
}

/**
 * Determine link type based on context
 */
function determineLinkType(content: string, slug: string): string {
  const contentLower = content.toLowerCase();
  const slugLower = slug.toLowerCase();

  // Check for prerequisite indicators
  const prerequisitePatterns = [
    'prerequisite', 'required', 'before', 'first learn', 'foundation',
  ];
  if (prerequisitePatterns.some(pattern => contentLower.includes(pattern))) {
    return 'prerequisite';
  }

  // Check for example indicators
  const examplePatterns = [
    'example', 'demonstration', 'illustration', 'shown in',
  ];
  if (examplePatterns.some(pattern => contentLower.includes(pattern))) {
    return 'example';
  }

  // Check for reference indicators
  const referencePatterns = [
    'reference', 'see also', 'related', 'similar', 'learn more',
  ];
  if (referencePatterns.some(pattern => contentLower.includes(pattern))) {
    return 'reference';
  }

  // Default to related
  return 'related';
}

/**
 * Calculate relevance score based on mention frequency and position
 */
function calculateRelevance(content: string, slug: string): number {
  const contentLower = content.toLowerCase();
  const slugLower = slug.toLowerCase();

  // Count mentions
  const regex = new RegExp(slugLower, 'gi');
  const mentions = (contentLower.match(regex) || []).length;

  // Check if mentioned in headings (higher relevance)
  const headingRegex = new RegExp(`^#+.*${slugLower}`, 'gim');
  const headingMentions = (content.match(headingRegex) || []).length;

  // Calculate base relevance
  let relevance = Math.min(mentions * 0.1, 0.5); // Max 0.5 from frequency
  relevance += headingMentions * 0.3; // Add 0.3 per heading mention

  return Math.min(relevance, 1.0);
}

/**
 * Create internal link
 */
async function createInternalLink(
  sourceTopicId: string,
  targetTopicId: string,
  linkType: string,
  relevance: number
): Promise<void> {
  const { error } = await supabase
    .from("internal_links")
    .insert({
      source_topic_id: sourceTopicId,
      target_topic_id: targetTopicId,
      link_type: linkType,
      relevance_score: relevance,
      status: 'active',
      last_verified_at: new Date().toISOString(),
    });

  if (error) {
    // Ignore duplicate constraint violations
    if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
      throw new Error(`Failed to create internal link: ${error.message}`);
    }
  }
}

/**
 * Regenerate internal links for all topics
 */
export async function regenerateAllInternalLinks(): Promise<{ processed: number; linksCreated: number }> {
  console.log(`[InternalLinks] Regenerating internal links for all topics`);

  const { data: topics } = await supabase
    .from("topics")
    .select("id")
    .limit(100);

  if (!topics) {
    return { processed: 0, linksCreated: 0 };
  }

  let totalLinksCreated = 0;

  for (const topic of topics) {
    try {
      // Count links before
      const { count: beforeCount } = await supabase
        .from("internal_links")
        .select("id", { count: "exact", head: true })
        .eq("source_topic_id", topic.id);

      await regenerateInternalLinks(topic.id);

      // Count links after
      const { count: afterCount } = await supabase
        .from("internal_links")
        .select("id", { count: "exact", head: true })
        .eq("source_topic_id", topic.id);

      totalLinksCreated += (afterCount || 0) - (beforeCount || 0);
    } catch (error) {
      console.error(`[InternalLinks] Failed to regenerate links for topic ${topic.id}:`, error);
    }
  }

  console.log(`[InternalLinks] Processed ${topics.length} topics, created ${totalLinksCreated} links`);
  return { processed: topics.length, linksCreated: totalLinksCreated };
}

/**
 * Verify internal links and mark broken ones
 */
export async function verifyInternalLinks(): Promise<{ verified: number; broken: number }> {
  console.log(`[InternalLinks] Verifying internal links`);

  const { data: links } = await supabase
    .from("internal_links")
    .select("*")
    .eq("status", "active");

  if (!links) {
    return { verified: 0, broken: 0 };
  }

  let brokenCount = 0;

  for (const link of links) {
    // Check if target topic still exists
    const { data: targetTopic } = await supabase
      .from("topics")
      .select("id")
      .eq("id", link.target_topic_id)
      .maybeSingle();

    if (!targetTopic) {
      // Mark as broken
      await supabase
        .from("internal_links")
        .update({ status: 'broken' })
        .eq("id", link.id);
      brokenCount++;
    } else {
      // Update last verified time
      await supabase
        .from("internal_links")
        .update({ last_verified_at: new Date().toISOString() })
        .eq("id", link.id);
    }
  }

  console.log(`[InternalLinks] Verified ${links.length} links, found ${brokenCount} broken`);
  return { verified: links.length, broken: brokenCount };
}
