/**
 * Check if entity exists in production database
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function checkProductionEntity() {
  console.log('Checking production database for entity: github');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log();
  
  const { data: entity, error } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .eq("slug", "github")
    .single();
  
  if (error) {
    console.log('❌ QUERY FAILED');
    console.log('Error:', error);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
  } else if (entity) {
    console.log('✅ ENTITY EXISTS IN DATABASE');
    console.log('ID:', entity.id);
    console.log('Name:', entity.name);
    console.log('Slug:', entity.slug);
    console.log('Type:', entity.node_type);
    console.log('Description:', entity.description);
  } else {
    console.log('❌ ENTITY NOT FOUND IN DATABASE');
    console.log('This is the root cause - entity missing from production database');
  }
}

checkProductionEntity().catch(console.error);
