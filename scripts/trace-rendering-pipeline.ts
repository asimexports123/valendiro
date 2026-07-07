/**
 * Trace Rendering Pipeline
 * 
 * Trace: URL → Route → Topic lookup → Canonical topic → Topic translation → 
 * Knowledge package → Published article → Frontend
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function traceRenderingPipeline() {
  console.log("=" + "=".repeat(79));
  console.log("RENDERING PIPELINE TRACE");
  console.log("=".repeat(80));
  console.log();

  const canonicalSlug = "github-joins-coalition-advocating-for-fixes-to-california-ai-transparency-act-to-protect-open-source";
  const canonicalUrl = `https://valendiro.com/en/topics/${canonicalSlug}`;

  console.log("STEP 1: URL");
  console.log("-".repeat(80));
  console.log(`✓ URL: ${canonicalUrl}`);
  console.log(`✓ Slug: ${canonicalSlug}`);
  console.log();

  console.log("STEP 2: ROUTE");
  console.log("-".repeat(80));
  console.log(`✓ Route: /en/topics/[slug]`);
  console.log(`✓ Parameter: slug = ${canonicalSlug}`);
  console.log();

  console.log("STEP 3: TOPIC LOOKUP");
  console.log("-".repeat(80));
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", canonicalSlug)
    .single();

  if (topicError) {
    console.log(`✗ Topic lookup failed: ${topicError.message}`);
    return;
  }

  console.log(`✓ Topic ID: ${topic.id}`);
  console.log(`✓ Topic Slug: ${topic.slug}`);
  console.log(`✓ Canonical Path: ${topic.canonical_path}`);
  console.log(`✓ Status: ${topic.status}`);
  console.log(`✓ Content Length: ${(topic.content || '').length} characters`);
  console.log(`✓ HTML Content Length: ${(topic.html_content || '').length} characters`);
  console.log();

  console.log("STEP 4: TOPIC TRANSLATION");
  console.log("-".repeat(80));
  const { data: translation, error: transError } = await supabase
    .from("topic_translations")
    .select("*")
    .eq("topic_id", topic.id)
    .eq("language_code", "en")
    .single();

  if (transError) {
    console.log(`✗ Translation lookup failed: ${transError.message}`);
    return;
  }

  console.log(`✓ Translation ID: ${translation.id}`);
  console.log(`✓ Translation Title: ${translation.title}`);
  console.log(`✓ Translation Subtitle: ${translation.subtitle}`);
  console.log(`✓ Translation Content Length: ${(translation.content || '').length} characters`);
  console.log(`✓ Meta Title: ${translation.meta_title}`);
  console.log(`✓ Meta Description: ${translation.meta_description}`);
  console.log();

  console.log("STEP 5: KNOWLEDGE PACKAGE");
  console.log("-".repeat(80));
  const { data: knowledgePackage, error: kpError } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("topic_id", topic.id)
    .single();

  if (kpError) {
    console.log(`✗ Knowledge package lookup failed: ${kpError.message}`);
    return;
  }

  console.log(`✓ Knowledge Package ID: ${knowledgePackage.id}`);
  console.log(`✓ Knowledge Package Slug: ${knowledgePackage.slug}`);
  console.log(`✓ Fact Count: ${knowledgePackage.fact_count}`);
  console.log(`✓ Relationship Count: ${knowledgePackage.relationship_count}`);
  console.log();

  console.log("STEP 6: PUBLISHED ARTICLE");
  console.log("-".repeat(80));
  console.log(`✓ Article Content in Topic: ${(topic.content || '').length} characters`);
  console.log(`✓ Article Content in Translation: ${(translation.content || '').length} characters`);
  console.log(`✓ Article HTML Content: ${(topic.html_content || '').length} characters`);
  console.log();

  console.log("STEP 7: FRONTEND DATA");
  console.log("-".repeat(80));
  console.log(`✓ Title available: ${translation.title ? "YES" : "NO"}`);
  console.log(`✓ Subtitle available: ${translation.subtitle ? "YES" : "NO"}`);
  console.log(`✓ Content available: ${translation.content ? "YES" : "NO"}`);
  console.log(`✓ HTML Content available: ${topic.html_content ? "YES" : "NO"}`);
  console.log();

  console.log("=" + "=".repeat(79));
  console.log("ROOT CAUSE ANALYSIS");
  console.log("=".repeat(80));
  console.log();

  if (!translation.title) {
    console.log("ISSUE: Translation title is NULL or empty");
    console.log("IMPACT: Frontend displays 'Untitled'");
  }

  if (!translation.content) {
    console.log("ISSUE: Translation content is NULL or empty");
    console.log("IMPACT: Frontend displays empty article");
  }

  if (!topic.html_content) {
    console.log("ISSUE: Topic html_content is NULL or empty");
    console.log("IMPACT: Frontend cannot render article");
  }

  if (translation.title && translation.content && topic.html_content) {
    console.log("✓ All data appears to be present in database");
    console.log("ISSUE: Frontend lookup logic may be incorrect");
  }

  console.log();
  console.log("=" + "=".repeat(79));
  console.log("DATABASE TRACE");
  console.log("=".repeat(80));
  console.log();
  console.log(`Topic ID: ${topic.id}`);
  console.log(`Translation ID: ${translation.id}`);
  console.log(`Knowledge Package ID: ${knowledgePackage.id}`);
  console.log();
}

traceRenderingPipeline()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
