/**
 * Test Entity Knowledge Pipeline
 * 
 * Simulate article processing and automatic entity knowledge update
 */

import { createAdminClient } from "../lib/supabase/admin";
import { EntityKnowledgeService } from "../services/discovery/entityKnowledgeService";

const supabase = createAdminClient();
const entityKnowledgeService = new EntityKnowledgeService();

async function testEntityKnowledgePipeline() {
  console.log("=" + "=".repeat(79));
  console.log("TEST ENTITY KNOWLEDGE PIPELINE");
  console.log("=".repeat(80));
  console.log();

  const articleId = "6e0c7adb-be18-4dbc-9c46-86b0e59cf89e";
  const entitySlug = "github";

  console.log("STEP 1: Get article content");
  console.log("-".repeat(80));

  const { data: article, error: articleError } = await supabase
    .from("topics")
    .select("id, content, slug")
    .eq("id", articleId)
    .single();

  if (articleError || !article) {
    console.log("Error fetching article:", articleError?.message);
    return;
  }

  console.log(`Article: ${article.slug}`);
  console.log(`Content length: ${article.content?.length || 0} characters`);
  console.log();

  console.log("STEP 2: Get entity from knowledge graph");
  console.log("-".repeat(80));

  const { data: entity, error: entityError } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", entitySlug)
    .single();

  if (entityError || !entity) {
    console.log("Error fetching entity:", entityError?.message);
    return;
  }

  console.log(`Entity: ${entity.name}`);
  console.log(`Type: ${entity.node_type}`);
  console.log(`ID: ${entity.id}`);
  console.log();

  console.log("STEP 3: Check if entity knowledge exists in metadata");
  console.log("-".repeat(80));

  const existingKnowledge = await entityKnowledgeService.getEntityKnowledge(entitySlug);

  if (existingKnowledge && Object.keys(existingKnowledge).length > 0) {
    console.log("✓ Entity knowledge exists in metadata");
    console.log(`  Version: ${existingKnowledge.knowledge_version || 1}`);
    console.log(`  Fact count: ${existingKnowledge.entity_fact_count || 0}`);
    console.log(`  Source count: ${existingKnowledge.entity_source_count || 0}`);
    console.log(`  Last updated: ${existingKnowledge.last_knowledge_update}`);
    console.log(`  Overview: ${existingKnowledge.overview?.substring(0, 100) || "None"}...`);
  } else {
    console.log("✗ Entity knowledge does not exist in metadata");
  }
  console.log();

  console.log("STEP 4: Process entity knowledge update");
  console.log("-".repeat(80));

  try {
    await entityKnowledgeService.updateEntityKnowledge(
      entity,
      article.id,
      article.content || ""
    );
    console.log("✓ Entity knowledge updated successfully");
  } catch (error) {
    console.log("✗ Error updating entity knowledge:", (error as Error).message);
  }
  console.log();

  console.log("STEP 5: Verify entity knowledge after update");
  console.log("-".repeat(80));

  const updatedKnowledge = await entityKnowledgeService.getEntityKnowledge(entitySlug);

  if (updatedKnowledge && Object.keys(updatedKnowledge).length > 0) {
    console.log("✓ Entity knowledge after update");
    console.log(`  Version: ${updatedKnowledge.knowledge_version || 1}`);
    console.log(`  Fact count: ${updatedKnowledge.entity_fact_count || 0}`);
    console.log(`  Source count: ${updatedKnowledge.entity_source_count || 0}`);
    console.log(`  Last updated: ${updatedKnowledge.last_knowledge_update}`);
    console.log(`  Overview: ${updatedKnowledge.overview?.substring(0, 100) || "None"}...`);
    console.log(`  Latest news: ${updatedKnowledge.latest_news_summary?.substring(0, 100) || "None"}...`);
    console.log(`  Facts count: ${updatedKnowledge.facts?.length || 0}`);
  } else {
    console.log("✗ Entity knowledge still does not exist");
  }
  console.log();

  console.log("STEP 6: Display facts from knowledge package");
  console.log("-".repeat(80));

  if (updatedKnowledge && updatedKnowledge.facts && updatedKnowledge.facts.length > 0) {
    console.log(`Found ${updatedKnowledge.facts.length} facts:`);
    updatedKnowledge.facts.forEach((fact: string, index: number) => {
      console.log(`  ${index + 1}. ${fact.substring(0, 150)}...`);
    });
  } else {
    console.log("No facts found in knowledge package");
  }
}

testEntityKnowledgePipeline()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
