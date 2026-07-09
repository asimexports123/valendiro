/**
 * Test the exact query used in getEntityHubData
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function testExactQuery() {
  console.log('Testing exact query from getEntityHubData...');
  
  const slug = "github";
  
  // Exact query from page
  const { data: entity, error: entityError } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", slug)
    .single();
  
  console.log('Query: SELECT * FROM knowledge_graph_nodes WHERE slug = "github"');
  console.log();
  
  if (entityError) {
    console.log('❌ QUERY FAILED');
    console.log('Error:', entityError);
    console.log('Error code:', entityError.code);
    console.log('Error message:', entityError.message);
  } else if (entity) {
    console.log('✅ QUERY SUCCESS');
    console.log('Entity found:', entity.name);
    console.log('Slug:', entity.slug);
    console.log('This query should work in the page component');
  } else {
    console.log('❌ NO RESULTS');
    console.log('Query returned no results');
  }
}

testExactQuery();
