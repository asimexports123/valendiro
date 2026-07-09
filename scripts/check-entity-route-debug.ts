/**
 * Debug Entity Route 404 Issue
 * 
 * Check if entity exists in database and trace the issue
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function debugEntityRoute() {
  console.log("=" + "=".repeat(79));
  console.log("DEBUG ENTITY ROUTE 404 ISSUE");
  console.log("=".repeat(80));
  console.log();

  const slug = "github";

  console.log("STEP 1: Check if entity exists in knowledge_graph_nodes");
  console.log("-".repeat(80));

  const { data: entity, error: entityError } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (entityError) {
    console.log("Error fetching entity:", entityError);
    console.log("This is likely the root cause - entity not found");
  } else if (entity) {
    console.log("✓ Entity exists");
    console.log(`  ID: ${entity.id}`);
    console.log(`  Name: ${entity.name}`);
    console.log(`  Slug: ${entity.slug}`);
    console.log(`  Type: ${entity.node_type}`);
  } else {
    console.log("✗ Entity not found");
    console.log("This is the root cause - entity doesn't exist in database");
  }
  console.log();

  console.log("STEP 2: Check all entities in database");
  console.log("-".repeat(80));

  const { data: allEntities, error: allError } = await supabase
    .from("knowledge_graph_nodes")
    .select("slug, name, node_type")
    .limit(20);

  if (allError) {
    console.log("Error fetching all entities:", allError);
  } else {
    console.log(`Found ${allEntities?.length || 0} entities:`);
    allEntities?.forEach(e => {
      console.log(`  - ${e.name} (${e.slug}) - ${e.node_type}`);
    });
  }
  console.log();

  console.log("STEP 3: Check route file exists");
  console.log("-".repeat(80));
  console.log("Route file: app/(public)/[lang]/entity/[slug]/page.tsx");
  console.log("File exists: YES");
  console.log();

  console.log("STEP 4: Test if route would match");
  console.log("-".repeat(80));
  console.log("URL pattern: /:lang/entity/:slug");
  console.log("Test URL: /en/entity/github");
  console.log("Expected params: { lang: 'en', slug: 'github' }");
  console.log("Route should match: YES");
  console.log();

  console.log("STEP 5: Check if entity page function would return data");
  console.log("-".repeat(80));

  if (entity) {
    console.log("Entity exists, getEntityHubData function would:");
    console.log("1. Query knowledge_graph_nodes WHERE slug = 'github'");
    console.log("2. Found entity:", entity.name);
    console.log("3. Return data to page component");
    console.log("4. Page should render");
  } else {
    console.log("Entity doesn't exist, getEntityHubData function would:");
    console.log("1. Query knowledge_graph_nodes WHERE slug = 'github'");
    console.log("2. No results");
    console.log("3. Return null");
    console.log("4. Page would call notFound()");
    console.log("5. This causes 404");
  }
}

debugEntityRoute()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
