/**
 * Deduplication and Knowledge Merging Service
 * 
 * Prevents duplicate knowledge and merges information from multiple sources
 * Part of the autonomous discovery pipeline
 */

import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

export interface SimilarContent {
  id: string;
  title: string;
  url: string;
  similarity: number;
  sourceId: string;
}

/**
 * Check for duplicate content and merge if similar
 */
export async function processDeduplication(contentId: string): Promise<void> {
  console.log(`[Deduplication] Processing deduplication for content: ${contentId}`);

  // Fetch the content
  const { data: content, error } = await supabase
    .from("discovered_content")
    .select("*")
    .eq("id", contentId)
    .single();

  if (error || !content) {
    throw new Error(`Content not found: ${error?.message}`);
  }

  // Check for similar content
  const similarContent = await findSimilarContent(content);
  
  if (similarContent.length === 0) {
    // No duplicates found
    await updateContentStatus(contentId, "processing");
    console.log(`[Deduplication] No similar content found for: ${content.title}`);
    return;
  }

  console.log(`[Deduplication] Found ${similarContent.length} similar items for: ${content.title}`);

  // Merge with most similar content
  const mostSimilar = similarContent[0];
  
  if (mostSimilar.similarity > 0.8) {
    // High similarity - merge into existing content
    await mergeContent(contentId, mostSimilar.id);
    await updateContentStatus(contentId, "merged");
    console.log(`[Deduplication] Merged content into: ${mostSimilar.id}`);
  } else {
    // Medium similarity - mark as related but keep separate
    await markAsRelated(contentId, similarContent);
    await updateContentStatus(contentId, "deduplicated");
    console.log(`[Deduplication] Marked as related content`);
  }
}

/**
 * Find similar content using content hash and title similarity
 */
async function findSimilarContent(content: any): Promise<SimilarContent[]> {
  const similar: SimilarContent[] = [];

  // First, check for exact hash match
  const { data: exactMatch } = await supabase
    .from("discovered_content")
    .select("*")
    .eq("content_hash", content.content_hash)
    .neq("id", content.id)
    .limit(10);

  if (exactMatch) {
    exactMatch.forEach(item => {
      similar.push({
        id: item.id,
        title: item.title,
        url: item.url,
        similarity: 1.0,
        sourceId: item.source_id,
      });
    });
  }

  // Then, check for title similarity
  const { data: titleMatches } = await supabase
    .from("discovered_content")
    .select("*")
    .neq("id", content.id)
    .in("status", ["pending", "processing", "deduplicated"])
    .limit(50);

  if (titleMatches) {
    titleMatches.forEach(item => {
      const similarity = calculateTitleSimilarity(content.title, item.title);
      if (similarity > 0.5) {
        similar.push({
          id: item.id,
          title: item.title,
          url: item.url,
          similarity,
          sourceId: item.source_id,
        });
      }
    });
  }

  // Sort by similarity and return top matches
  return similar
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

/**
 * Calculate title similarity using Jaccard similarity
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = new Set(title1.toLowerCase().split(/\s+/));
  const words2 = new Set(title2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Merge content into existing content
 */
async function mergeContent(sourceId: string, targetId: string): Promise<void> {
  // Fetch both content items
  const { data: source } = await supabase
    .from("discovered_content")
    .select("*")
    .eq("id", sourceId)
    .single();

  const { data: target } = await supabase
    .from("discovered_content")
    .select("*")
    .eq("id", targetId)
    .single();

  if (!source || !target) {
    throw new Error("Source or target content not found");
  }

  // Merge knowledge from source into target
  const mergedKnowledge = mergeKnowledgeData(
    target.extracted_knowledge || {},
    source.extracted_knowledge || {}
  );

  // Update target with merged knowledge
  await supabase
    .from("discovered_content")
    .update({
      extracted_knowledge: mergedKnowledge,
      similar_content_ids: [
        ...(target.similar_content_ids || []),
        sourceId,
      ],
    })
    .eq("id", targetId);

  // Mark source as merged
  await supabase
    .from("discovered_content")
    .update({
      status: "merged",
      merged_into_id: targetId,
    })
    .eq("id", sourceId);
}

/**
 * Merge knowledge data from multiple sources
 */
function mergeKnowledgeData(target: any, source: any): any {
  const merged = { ...target };

  // Merge arrays
  Object.keys(source).forEach(key => {
    if (Array.isArray(source[key])) {
      if (Array.isArray(target[key])) {
        // Merge arrays, removing duplicates
        merged[key] = [...new Set([...target[key], ...source[key]])];
      } else {
        merged[key] = source[key];
      }
    } else if (typeof source[key] === 'object' && source[key] !== null) {
      // Recursively merge objects
      merged[key] = mergeKnowledgeData(target[key] || {}, source[key]);
    } else {
      // Take source value if target doesn't have it
      if (!target[key]) {
        merged[key] = source[key];
      }
    }
  });

  return merged;
}

/**
 * Mark content as related to other similar content
 */
async function markAsRelated(contentId: string, similarContent: SimilarContent[]): Promise<void> {
  const similarIds = similarContent.map(sc => sc.id);

  await supabase
    .from("discovered_content")
    .update({
      similar_content_ids: similarIds,
    })
    .eq("id", contentId);
}

/**
 * Update content status
 */
async function updateContentStatus(contentId: string, status: string): Promise<void> {
  await supabase
    .from("discovered_content")
    .update({
      status,
      processing_started_at: status === "processing" ? new Date().toISOString() : null,
    })
    .eq("id", contentId);
}

/**
 * Process all pending content for deduplication
 */
export async function processPendingDeduplication(): Promise<{ processed: number; merged: number }> {
  console.log(`[Deduplication] Processing pending deduplication`);

  const { data: pendingContent } = await supabase
    .from("discovered_content")
    .select("*")
    .eq("status", "pending")
    .limit(100);

  if (!pendingContent) {
    return { processed: 0, merged: 0 };
  }

  let mergedCount = 0;
  for (const content of pendingContent) {
    try {
      await processDeduplication(content.id);
      if (content.status === "merged") {
        mergedCount++;
      }
    } catch (error) {
      console.error(`[Deduplication] Failed to process content ${content.id}:`, error);
      await supabase
        .from("discovered_content")
        .update({ status: "failed", error_message: (error as Error).message })
        .eq("id", content.id);
    }
  }

  console.log(`[Deduplication] Processed ${pendingContent.length} items, merged ${mergedCount}`);
  return { processed: pendingContent.length, merged: mergedCount };
}
