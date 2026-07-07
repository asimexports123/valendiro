/**
 * Canonical Topic Resolution Service
 * 
 * Ensures one concept = one topic ID = one canonical slug = one permanent URL
 * 
 * Rules:
 * - Remove timestamp suffixes completely
 * - Before creating a topic, search for existing canonical topic
 * - If exists: update knowledge package, regenerate article, keep same Topic ID and URL
 * - Never create duplicate topics for same concept
 * - Support aliases for variants
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

const supabase = createAdminClient();

export interface CanonicalTopic {
  id: string;
  slug: string;
  canonicalPath: string;
  title: string;
}

export interface TopicResolutionResult {
  topic: CanonicalTopic;
  isNewTopic: boolean;
  action: "created" | "updated";
}

/**
 * Generate canonical slug from title (no timestamp)
 */
export function generateCanonicalSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Search for existing canonical topic by title similarity
 */
export async function findExistingTopic(title: string): Promise<CanonicalTopic | null> {
  const canonicalSlug = generateCanonicalSlug(title);
  
  // Exact match by slug
  const { data: exactMatch } = await supabase
    .from("topics")
    .select("id, slug, canonical_path")
    .eq("slug", canonicalSlug)
    .single();
  
  if (exactMatch) {
    // Get title from translation
    const { data: translation } = await supabase
      .from("topic_translations")
      .select("title")
      .eq("topic_id", exactMatch.id)
      .eq("language_code", "en")
      .single();
    
    return {
      id: exactMatch.id,
      slug: exactMatch.slug,
      canonicalPath: exactMatch.canonical_path,
      title: translation?.title || title,
    };
  }
  
  // Fuzzy match by title similarity
  const { data: allTopics } = await supabase
    .from("topics")
    .select("id, slug, canonical_path")
    .limit(100);
  
  if (allTopics) {
    for (const topic of allTopics) {
      const { data: translation } = await supabase
        .from("topic_translations")
        .select("title")
        .eq("topic_id", topic.id)
        .eq("language_code", "en")
        .single();
      
      if (translation && calculateSimilarity(title, translation.title) > 0.85) {
        return {
          id: topic.id,
          slug: topic.slug,
          canonicalPath: topic.canonical_path,
          title: translation.title,
        };
      }
    }
  }
  
  return null;
}

/**
 * Calculate string similarity
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Resolve or create canonical topic
 */
export async function resolveOrCreateTopic(
  title: string,
  content: string,
  htmlContent: string
): Promise<TopicResolutionResult> {
  // Step 1: Search for existing topic
  console.log("  Searching for existing canonical topic...");
  const existingTopic = await findExistingTopic(title);
  
  if (existingTopic) {
    console.log(`  ✓ Found existing topic: ${existingTopic.id}`);
    console.log(`  ✓ Slug: ${existingTopic.slug}`);
    console.log(`  ✓ Title: ${existingTopic.title}`);
    
    // Step 2: Update existing topic
    console.log("  Updating existing topic content...");
    const { error: updateError } = await supabase
      .from("topics")
      .update({
        content,
        html_content: htmlContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingTopic.id);
    
    if (updateError) {
      console.error(`  ✗ Error updating topic: ${updateError.message}`);
      throw updateError;
    }
    
    // Step 3: Update topic translation
    console.log("  Updating topic translation...");
    const { error: transUpdateError } = await supabase
      .from("topic_translations")
      .update({
        title,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("topic_id", existingTopic.id)
      .eq("language_code", "en");
    
    if (transUpdateError) {
      console.error(`  ✗ Error updating translation: ${transUpdateError.message}`);
      throw transUpdateError;
    }
    
    console.log("  ✓ Topic updated successfully");
    
    return {
      topic: existingTopic,
      isNewTopic: false,
      action: "updated",
    };
  }
  
  // Step 4: Create new topic
  console.log("  No existing topic found, creating new canonical topic...");
  const topicId = uuidv4();
  const canonicalSlug = generateCanonicalSlug(title);
  const canonicalPath = `/en/topics/${canonicalSlug}`;
  
  const { data: newTopic, error: createError } = await supabase
    .from("topics")
    .insert({
      id: topicId,
      slug: canonicalSlug,
      canonical_path: canonicalPath,
      category_id: null,
      difficulty: 'intermediate',
      estimated_read_time: 8,
      status: 'published',
      published_at: new Date().toISOString(),
      content,
      html_content: htmlContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (createError) {
    console.error(`  ✗ Error creating topic: ${createError.message}`);
    throw createError;
  }
  
  console.log(`  ✓ New topic created: ${topicId}`);
  console.log(`  ✓ Canonical Slug: ${canonicalSlug}`);
  console.log(`  ✓ Canonical Path: ${canonicalPath}`);
  
  // Step 5: Create topic translation
  console.log("  Creating topic translation...");
  const translationId = uuidv4();
  const subtitle = content.substring(0, 200);
  const metaTitle = title;
  const metaDescription = content.substring(0, 160);
  
  const { error: transCreateError } = await supabase
    .from("topic_translations")
    .insert({
      id: translationId,
      topic_id: topicId,
      language_code: "en",
      title,
      subtitle,
      content,
      meta_title: metaTitle,
      meta_description: metaDescription,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  
  if (transCreateError) {
    console.error(`  ✗ Error creating translation: ${transCreateError.message}`);
    throw transCreateError;
  }
  
  console.log("  ✓ Translation created successfully");
  
  return {
    topic: {
      id: topicId,
      slug: canonicalSlug,
      canonicalPath,
      title,
    },
    isNewTopic: true,
    action: "created",
  };
}

/**
 * Add alias to topic
 */
export async function addTopicAlias(topicId: string, alias: string): Promise<void> {
  // This would require an aliases table in the database
  // For now, we'll implement the logic
  console.log(`  Adding alias "${alias}" to topic ${topicId}`);
  // Implementation would go here when aliases table is added
}
