/**
 * Regenerate topic content using improved AI content generator
 * This script regenerates a single topic's content with the world-class template
 */

import { createAdminClient } from "../lib/supabase/admin";
import { getAIContentGenerator } from "../services/ai/aiContentGenerator";

const TOPIC_SLUG = "javascript-fundamentals";

async function regenerateTopicContent() {
  console.log(`Regenerating content for topic: ${TOPIC_SLUG}`);

  const supabase = createAdminClient();

  // Fetch the topic
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title, language_code)")
    .eq("slug", TOPIC_SLUG)
    .eq("topic_translations.language_code", "en")
    .single();

  if (topicError || !topic) {
    throw new Error(`Topic not found: ${topicError?.message}`);
  }

  const title = (topic.topic_translations as any)?.[0]?.title || TOPIC_SLUG;
  console.log(`Topic title: ${title}`);

  // Generate new content using improved AI content generator
  const generator = getAIContentGenerator();
  const generated = await generator.generate({
    title,
    description: "Master the language of the web — variables, functions, and async patterns.",
    format: "explainer",
    languageCode: "en",
    keywords: ["javascript", "fundamentals", "programming", "web development"],
    tone: "professional",
  });

  console.log(`Generated content length: ${generated.content.length} characters`);

  // Update the topic translation with new content
  const { error: updateError } = await supabase
    .from("topic_translations")
    .update({
      content: generated.content,
      updated_at: new Date().toISOString(),
    })
    .eq("topic_id", topic.id)
    .eq("language_code", "en");

  if (updateError) {
    throw new Error(`Failed to update topic content: ${updateError.message}`);
  }

  console.log(`✓ Successfully regenerated content for topic: ${TOPIC_SLUG}`);
  console.log(`Generated at: ${generated.generatedAt}`);
  console.log(`Content sections included:`);
  console.log(`  - Learning Objectives`);
  console.log(`  - Prerequisites`);
  console.log(`  - When to Use`);
  console.log(`  - When NOT to Use`);
  console.log(`  - Practical Examples`);
  console.log(`  - Best Practices`);
  console.log(`  - Performance Considerations`);
  console.log(`  - Security Considerations`);
  console.log(`  - Interview Questions`);
  console.log(`  - Cheat Sheet`);
  console.log(`  - Action Checklist`);
  console.log(`  - Glossary`);
  console.log(`  - Next Steps in Learning Journey`);
}

regenerateTopicContent()
  .then(() => {
    console.log("Regeneration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Regeneration failed:", error);
    process.exit(1);
  });
