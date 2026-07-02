/**
 * Phase 15 Data Integrity Audit
 * 
 * Verifies actual database schema, storage locations, and counts
 * No estimates, no inferences - only actual SQL results
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function audit() {
  console.log("=".repeat(80));
  console.log("PHASE 15 DATA INTEGRITY AUDIT");
  console.log("=".repeat(80));

  // ========================================================================
  // 1. MACHINE LEARNING BASICS - COMPLETE PIPELINE
  // ========================================================================
  console.log("\n" + "=".repeat(80));
  console.log("1. MACHINE LEARNING BASICS - COMPLETE PIPELINE");
  console.log("=".repeat(80));

  // Step 1: Topic
  console.log("\n[STEP 1] TOPIC");
  console.log("-".repeat(80));
  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", "machine-learning-basics")
    .single();

  console.log("Topic ID:", topic.id);
  console.log("Slug:", topic.slug);
  console.log("Status:", topic.status);

  // Step 2: Knowledge Package
  console.log("\n[STEP 2] KNOWLEDGE PACKAGE");
  console.log("-".repeat(80));
  const { data: pkg } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("topic_id", topic.id)
    .single();

  console.log("Package ID:", pkg.id);
  console.log("Topic ID:", pkg.topic_id);
  console.log("Status:", pkg.status);
  console.log("Fact Count:", pkg.fact_count);
  console.log("Citation Count:", pkg.citation_count);
  console.log("Relationship Count:", pkg.relationship_count);

  // Step 3: Facts - Check knowledge_facts table
  console.log("\n[STEP 3] FACTS - STORAGE LOCATION");
  console.log("-".repeat(80));
  const { data: knowledgeFacts, count: kfCount } = await supabase
    .from("knowledge_facts")
    .select("*")
    .eq("package_id", pkg.id);

  console.log("Facts in knowledge_facts table:", kfCount);
  if (knowledgeFacts && knowledgeFacts.length > 0) {
    console.log("Sample fact:");
    console.log(JSON.stringify(knowledgeFacts[0], null, 2));
  }

  // Step 4: Citations - Check knowledge_citations table
  console.log("\n[STEP 4] CITATIONS - STORAGE LOCATION");
  console.log("-".repeat(80));
  const { data: knowledgeCitations, count: kcCount } = await supabase
    .from("knowledge_citations")
    .select("*")
    .eq("package_id", pkg.id);

  console.log("Citations in knowledge_citations table:", kcCount);
  if (knowledgeCitations && knowledgeCitations.length > 0) {
    console.log("Sample citation:");
    console.log(JSON.stringify(knowledgeCitations[0], null, 2));
  }

  // Step 5: Relationships
  console.log("\n[STEP 5] RELATIONSHIPS");
  console.log("-".repeat(80));
  const { count: relCount } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true })
    .eq("source_id", topic.id)
    .eq("source_level", "topic");

  console.log("Relationships count:", relCount);

  // Step 6: Rendered Output
  console.log("\n[STEP 6] RENDERED OUTPUT");
  console.log("-".repeat(80));
  const { data: rendered } = await supabase
    .from("rendered_outputs")
    .select("*")
    .eq("package_id", pkg.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rendered) {
    console.log("Rendered Output ID:", rendered.id);
    console.log("Renderer ID:", rendered.renderer_id);
    console.log("Status:", rendered.status);
    console.log("Quality Score:", rendered.quality_score.overall);
  }

  // Step 7: Topic Translation
  console.log("\n[STEP 7] TOPIC TRANSLATION (CONTENT STORAGE)");
  console.log("-".repeat(80));
  const { data: translation } = await supabase
    .from("topic_translations")
    .select("*")
    .eq("topic_id", topic.id)
    .eq("language_code", "en")
    .maybeSingle();

  if (translation) {
    console.log("Translation ID:", translation.id);
    console.log("Content Length:", translation.content?.length || 0);
  }

  // ========================================================================
  // 2. VERIFIED COUNTS FROM SQL
  // ========================================================================
  console.log("\n" + "=".repeat(80));
  console.log("2. VERIFIED COUNTS FROM SQL");
  console.log("=".repeat(80));

  const [
    { count: kpCount },
    { count: knowledgeFactsCount },
    { count: knowledgeCitationsCount },
    { count: relationshipsCount },
    { count: articlesCount },
    { count: renderedOutputsCount },
    { count: topicTranslationsCount },
  ] = await Promise.all([
    supabase.from("knowledge_packages").select("*", { count: "exact", head: true }),
    supabase.from("knowledge_facts").select("*", { count: "exact", head: true }),
    supabase.from("knowledge_citations").select("*", { count: "exact", head: true }),
    supabase.from("knowledge_relationships").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("rendered_outputs").select("*", { count: "exact", head: true }),
    supabase.from("topic_translations").select("*", { count: "exact", head: true }),
  ]);

  console.log("Knowledge Packages:", kpCount);
  console.log("Knowledge Facts:", knowledgeFactsCount);
  console.log("Knowledge Citations:", knowledgeCitationsCount);
  console.log("Relationships:", relationshipsCount);
  console.log("Articles:", articlesCount);
  console.log("Rendered Outputs:", renderedOutputsCount);
  console.log("Topic Translations:", topicTranslationsCount);

  // ========================================================================
  // 3. STORAGE LOCATION SUMMARY
  // ========================================================================
  console.log("\n" + "=".repeat(80));
  console.log("3. STORAGE LOCATION SUMMARY");
  console.log("=".repeat(80));

  console.log("\nFACTS STORAGE:");
  console.log("  Table: knowledge_facts");
  console.log("  Total count:", knowledgeFactsCount);
  console.log("  For ML Basics:", kfCount);

  console.log("\nCITATIONS STORAGE:");
  console.log("  Table: knowledge_citations");
  console.log("  Total count:", knowledgeCitationsCount);
  console.log("  For ML Basics:", kcCount);

  console.log("\n" + "=".repeat(80));
  console.log("AUDIT COMPLETE");
  console.log("=".repeat(80));
}

audit().catch(console.error);
