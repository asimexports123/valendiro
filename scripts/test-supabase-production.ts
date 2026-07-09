/**
 * Test if Supabase admin client works in production
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function testSupabaseConnection() {
  console.log('Testing Supabase admin client...');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log();
  
  // Test simple query
  const { data, error } = await supabase
    .from("knowledge_graph_nodes")
    .select("count")
    .single();
  
  if (error) {
    console.log('❌ SUPABASE QUERY FAILED');
    console.log('Error:', error);
    console.log('This is the root cause - Supabase connection fails in production');
  } else {
    console.log('✅ SUPABASE CONNECTION WORKS');
    console.log('Count:', data);
  }
}

testSupabaseConnection();
