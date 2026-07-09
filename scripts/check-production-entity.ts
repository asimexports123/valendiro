/**
 * Check if entity exists in production database
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function checkProductionEntity() {
  console.log('Checking production database for entity: github');
  
  const { data: entity, error } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", "github")
    .single();
  
  if (error) {
    console.log('❌ QUERY FAILED');
    console.log('Error:', error);
    console.log('This is the root cause - Supabase query fails in production');
  } else if (entity) {
    console.log('✅ ENTITY EXISTS');
    console.log('ID:', entity.id);
    console.log('Name:', entity.name);
    console.log('Slug:', entity.slug);
  } else {
    console.log('❌ ENTITY NOT FOUND');
    console.log('Entity does not exist in production database');
    console.log('This is the root cause - entity missing from database');
  }
}

checkProductionEntity().catch(console.error);
