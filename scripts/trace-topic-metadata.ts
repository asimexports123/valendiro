/**
 * Trace Topic Metadata Pipeline
 * RSS Article → Knowledge Package → Topic → Topic Translation → SEO Metadata → Rendered Page
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function traceTopicMetadata() {
  console.log("=" + "=".repeat(79));
  console.log("TRACE TOPIC METADATA PIPELINE");
  console.log("=".repeat(80));
  console.log();

  // Get the newly created topic from Phase 8.4
  const topicSlug = "github-joins-coalition-advocating-for-fixes-to-california-ai-transparency-act-to-protect-open-source-1783435192998";

  console.log("STEP 1: GET EXTRACTED RSS ARTICLE");
  console.log("-".repeat(80));
  const { data: extractedArticle } = await supabase
    .from("discovered_content")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (extractedArticle) {
    console.log(`✓ Original URL: ${extractedArticle.url}`);
    console.log(`✓ Extracted Title: ${extractedArticle.title}`);
    console.log(`✓ Content Length: ${(extractedArticle.content_full || '').length} characters`);
  }
  console.log();

  console.log("STEP 2: GET KNOWLEDGE PACKAGE");
  console.log("-".repeat(80));
  const { data: knowledgePackage } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("slug", topicSlug)
    .single();

  if (knowledgePackage) {
    console.log(`✓ Knowledge Package ID: ${knowledgePackage.id}`);
    console.log(`✓ Knowledge Package Slug: ${knowledgePackage.slug}`);
    console.log(`✓ Knowledge Package Topic ID: ${knowledgePackage.topic_id}`);
  }
  console.log();

  console.log("STEP 3: GET TOPIC");
  console.log("-".repeat(80));
  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", topicSlug)
    .single();

  if (topic) {
    console.log(`✓ Topic ID: ${topic.id}`);
    console.log(`✓ Topic Slug: ${topic.slug}`);
    console.log(`✓ Topic Status: ${topic.status}`);
    console.log(`✓ Topic Content Length: ${(topic.content || '').length} characters`);
    console.log(`✓ Topic HTML Content Length: ${(topic.html_content || '').length} characters`);
  }
  console.log();

  console.log("STEP 4: GET TOPIC TRANSLATION");
  console.log("-".repeat(80));
  const { data: topicTranslation } = await supabase
    .from("topic_translations")
    .select("*")
    .eq("topic_id", topic?.id)
    .eq("language_code", "en")
    .single();

  if (topicTranslation) {
    console.log(`✓ Topic Translation ID: ${topicTranslation.id}`);
    console.log(`✓ Topic Translation Title: ${topicTranslation.title}`);
    console.log(`✓ Topic Translation Description: ${topicTranslation.description}`);
  } else {
    console.log(`✗ NO TOPIC TRANSLATION FOUND`);
  }
  console.log();

  console.log("STEP 5: CHECK SEO METADATA");
  console.log("-".repeat(80));
  console.log(`✓ Topic Canonical Path: ${topic?.canonical_path}`);
  console.log(`✓ Topic Published At: ${topic?.published_at}`);
  console.log();

  console.log("=" + "=".repeat(79));
  console.log("ROOT CAUSE ANALYSIS");
  console.log("=".repeat(80));
  console.log();

  if (!topicTranslation) {
    console.log("ISSUE: No topic_translations record exists for the new topic.");
    console.log("IMPACT: The UI likely falls back to 'Untitled' when no translation is found.");
    console.log("FIX: Create topic_translations record when creating a new topic.");
  } else if (!topicTranslation.title) {
    console.log("ISSUE: topic_translations.title is NULL or empty.");
    console.log("IMPACT: The UI displays 'Untitled' when title is missing.");
    console.log("FIX: Ensure title is set when creating topic_translations.");
  } else {
    console.log("ISSUE: The topics table may not have a 'name' field for display.");
    console.log("IMPACT: The UI might be using the wrong field for title.");
    console.log("FIX: Check UI code to see which field is being used for title display.");
  }

  console.log();
  console.log("=".repeat(80));
}

traceTopicMetadata()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
