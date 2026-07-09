/**
 * Trace Entity Route Request Pipeline
 * 
 * Simulate the exact request flow to identify where 404 occurs
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function traceEntityRoute() {
  console.log("=" + "=".repeat(79));
  console.log("TRACE ENTITY ROUTE REQUEST PIPELINE");
  console.log("=".repeat(80));
  console.log();

  const lang = "en";
  const slug = "github";

  console.log("STEP 1: Browser Request");
  console.log("-".repeat(80));
  console.log("URL: https://valendiro.com/en/entity/github");
  console.log("Pattern: /:lang/entity/:slug");
  console.log("Expected params: { lang: 'en', slug: 'github' }");
  console.log();

  console.log("STEP 2: Next.js Route Matching");
  console.log("-".repeat(80));
  console.log("Route file: app/(public)/[lang]/entity/[slug]/page.tsx");
  console.log("Route group: (public)");
  console.log("Dynamic segments: [lang], [slug]");
  console.log("Match: SHOULD MATCH");
  console.log();

  console.log("STEP 3: Dynamic Params Extraction");
  console.log("-".repeat(80));
  console.log("params.lang:", lang);
  console.log("params.slug:", slug);
  console.log("Type check: lang is string, slug is string");
  console.log();

  console.log("STEP 4: Supabase Query (getEntityHubData)");
  console.log("-".repeat(80));
  console.log("Query: SELECT * FROM knowledge_graph_nodes WHERE slug = 'github'");
  console.log("Table: knowledge_graph_nodes");
  console.log("Filter: slug = 'github'");
  console.log("Limit: 1 (single)");
  console.log();

  const { data: entity, error: entityError } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (entityError) {
    console.log("✗ QUERY FAILED");
    console.log("Error:", entityError);
    console.log("This would cause getEntityHubData to return null");
    console.log("Then EntityPage would call notFound()");
    console.log("This causes 404");
    return;
  }

  if (!entity) {
    console.log("✗ NO RESULTS");
    console.log("Query returned no results");
    console.log("This would cause getEntityHubData to return null");
    console.log("Then EntityPage would call notFound()");
    console.log("This causes 404");
    return;
  }

  console.log("✓ QUERY SUCCESS");
  console.log("Entity found:");
  console.log("  ID:", entity.id);
  console.log("  Name:", entity.name);
  console.log("  Slug:", entity.slug);
  console.log("  Type:", entity.node_type);
  console.log();

  console.log("STEP 5: Additional Queries");
  console.log("-".repeat(80));

  // Get related entities
  const { data: edges, error: edgesError } = await supabase
    .from("knowledge_graph_edges")
    .select("*")
    .eq("source_id", entity.id)
    .limit(20);

  if (edgesError) {
    console.log("Edges query error:", edgesError);
  } else {
    console.log("✓ Edges found:", edges?.length || 0);
  }

  // Get latest articles
  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("*")
    .ilike("content", `%${entity.name}%`)
    .order("created_at", { ascending: false })
    .limit(10);

  if (topicsError) {
    console.log("Topics query error:", topicsError);
  } else {
    console.log("✓ Topics found:", topics?.length || 0);
  }

  // Get knowledge packages
  const { data: packages, error: packagesError } = await supabase
    .from("knowledge_packages")
    .select("*")
    .limit(10);

  if (packagesError) {
    console.log("Packages query error:", packagesError);
  } else {
    console.log("✓ Packages found:", packages?.length || 0);
  }
  console.log();

  console.log("STEP 6: React Component Rendering");
  console.log("-".repeat(80));
  console.log("Component: EntityPage");
  console.log("Props: { params: { lang: 'en', slug: 'github' } }");
  console.log("Data: getEntityHubData('github')");
  console.log("Data exists: YES");
  console.log("Component should render: YES");
  console.log();

  console.log("STEP 7: Deployment Check");
  console.log("-".repeat(80));
  console.log("Platform: Vercel");
  console.log("Build: Should include app/(public)/[lang]/entity/[slug]/page.tsx");
  console.log("Environment: Production");
  console.log();

  console.log("SUMMARY");
  console.log("-".repeat(80));
  console.log("All pipeline steps should succeed:");
  console.log("✓ Route matching");
  console.log("✓ Params extraction");
  console.log("✓ Supabase query");
  console.log("✓ Data retrieval");
  console.log("✓ Component rendering");
  console.log();
  console.log("If browser shows 404, possible causes:");
  console.log("1. Route not deployed to production");
  console.log("2. Build error not caught");
  console.log("3. Runtime error in component");
  console.log("4. Environment variable missing in production");
  console.log("5. RLS policy blocking query in production");
}

traceEntityRoute()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
