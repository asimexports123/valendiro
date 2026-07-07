/**
 * Test database queries for all entity slugs
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function testEntityQueries() {
  console.log("=" + "=".repeat(79));
  console.log("TEST ENTITY QUERIES");
  console.log("=".repeat(80));
  console.log();

  const slugs = [
    "github",
    "hugging-face",
    "mozilla-corporation",
    "black-forest-labs",
    "ai-act",
    "sb-942",
    "sb-1000",
  ];

  console.log("STEP 1: QUERY EACH ENTITY FROM DATABASE");
  console.log("-".repeat(80));

  for (const slug of slugs) {
    const { data: entity, error } = await supabase
      .from("knowledge_graph_nodes")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.log(`✗ /entity/${slug} - ERROR: ${error.message}`);
    } else if (entity) {
      console.log(`✓ /entity/${slug} - FOUND: ${entity.name} (${entity.node_type})`);
      console.log(`  ID: ${entity.id}`);
      console.log(`  Description: ${entity.description?.substring(0, 50)}...`);
    } else {
      console.log(`✗ /entity/${slug} - NOT FOUND`);
    }
    console.log();
  }

  console.log("STEP 2: COUNT TOTAL ENTITIES IN DATABASE");
  console.log("-".repeat(80));

  const { data: allEntities, error: countError } = await supabase
    .from("knowledge_graph_nodes")
    .select("slug, name, node_type");

  if (countError) {
    console.log(`Error counting entities: ${countError.message}`);
  } else {
    console.log(`Total entities in database: ${allEntities?.length || 0}`);
    console.log();
    console.log("All entity slugs:");
    allEntities?.forEach(e => {
      console.log(`  - /entity/${e.slug} (${e.name})`);
    });
  }
}

testEntityQueries()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
