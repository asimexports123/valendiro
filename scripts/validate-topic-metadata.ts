/**
 * Validate Topic Metadata
 * Verify all metadata is correctly stored for the new topic
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function validateTopicMetadata() {
  console.log("=" + "=".repeat(79));
  console.log("VALIDATE TOPIC METADATA");
  console.log("=".repeat(80));
  console.log();

  const topicSlug = "github-joins-coalition-advocating-for-fixes-to-california-ai-transparency-act-to-protect-open-source-1783435707574";

  console.log("STEP 1: GET EXTRACTED RSS ARTICLE");
  console.log("-".repeat(80));
  const { data: extractedArticle } = await supabase
    .from("discovered_content")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!extractedArticle) {
    console.log("✗ No extracted article found");
    return;
  }

  console.log(`✓ RSS URL: ${extractedArticle.url}`);
  console.log(`✓ Extracted Title: ${extractedArticle.title}`);
  console.log();

  console.log("STEP 2: GET KNOWLEDGE PACKAGE");
  console.log("-".repeat(80));
  const { data: knowledgePackage } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("slug", topicSlug)
    .single();

  if (!knowledgePackage) {
    console.log("✗ No knowledge package found");
    return;
  }

  console.log(`✓ Knowledge Package ID: ${knowledgePackage.id}`);
  console.log();

  console.log("STEP 3: GET TOPIC");
  console.log("-".repeat(80));
  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", topicSlug)
    .single();

  if (!topic) {
    console.log("✗ No topic found");
    return;
  }

  console.log(`✓ Topic ID: ${topic.id}`);
  console.log(`✓ Topic Slug: ${topic.slug}`);
  console.log(`✓ Topic Status: ${topic.status}`);
  console.log();

  console.log("STEP 4: GET TOPIC TRANSLATION");
  console.log("-".repeat(80));
  const { data: topicTranslation } = await supabase
    .from("topic_translations")
    .select("*")
    .eq("topic_id", topic.id)
    .eq("language_code", "en")
    .single();

  if (!topicTranslation) {
    console.log("✗ No topic translation found");
    return;
  }

  console.log(`✓ Topic Translation ID: ${topicTranslation.id}`);
  console.log(`✓ Stored Title in Database: ${topicTranslation.title}`);
  console.log(`✓ SEO Title (meta_title): ${topicTranslation.meta_title}`);
  console.log(`✓ SEO Description (meta_description): ${topicTranslation.meta_description}`);
  console.log(`✓ Subtitle: ${topicTranslation.subtitle}`);
  console.log();

  console.log("STEP 5: VALIDATION");
  console.log("-".repeat(80));
  console.log(`✓ Original RSS URL: ${extractedArticle.url}`);
  console.log(`✓ Knowledge Package ID: ${knowledgePackage.id}`);
  console.log(`✓ Topic ID: ${topic.id}`);
  console.log(`✓ Topic Translation ID: ${topicTranslation.id}`);
  console.log(`✓ Stored Title in Database: ${topicTranslation.title}`);
  console.log(`✓ SEO Title: ${topicTranslation.meta_title}`);
  console.log(`✓ Live URL: https://valendiro.com${topic.canonical_path}`);
  console.log();

  console.log("=" + "=".repeat(79));
  console.log("CHECK FOR 'UNTITLED'");
  console.log("=".repeat(80));
  
  const hasUntitled = 
    topicTranslation.title === "Untitled" ||
    topicTranslation.title === null ||
    topicTranslation.title === "" ||
    topicTranslation.meta_title === "Untitled" ||
    topicTranslation.meta_title === null ||
    topicTranslation.meta_title === "";

  if (hasUntitled) {
    console.log("✗ FAILED: 'Untitled' found in metadata");
  } else {
    console.log("✓ PASSED: No 'Untitled' found in metadata");
  }

  console.log("=".repeat(80));
}

validateTopicMetadata()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
