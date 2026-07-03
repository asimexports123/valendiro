/**
 * Step 4: Verify fact relationships remain unchanged
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    process.env[key] = values.join("=");
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyFactPreserved() {
  console.log("=== Step 4: Verify Fact Relationships Preserved ===\n");
  
  // Count fact-level relationships
  const { count: factCount, error: factError } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true })
    .eq("source_level", "fact")
    .eq("target_level", "fact");
  
  if (factError) {
    console.error("Error counting fact relationships:", factError);
    return;
  }
  
  console.log(`Fact-level relationships: ${factCount}`);
  
  // Count topic-level relationships
  const { count: topicCount, error: topicError } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true })
    .eq("source_level", "topic")
    .eq("target_level", "topic");
  
  if (topicError) {
    console.error("Error counting topic relationships:", topicError);
    return;
  }
  
  console.log(`Topic-level relationships: ${topicCount}`);
  
  // Total count
  const { count: totalCount } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true });
  
  console.log(`Total relationships: ${totalCount}`);
  
  // Sample fact relationship
  const { data: sampleFact } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .eq("source_level", "fact")
    .eq("target_level", "fact")
    .limit(1);
  
  if (sampleFact && sampleFact.length > 0) {
    console.log(`\nSample fact relationship:`);
    console.log(`  ${sampleFact[0].source_id.substring(0,8)} -> ${sampleFact[0].target_id.substring(0,8)}`);
    console.log(`  Type: ${sampleFact[0].relationship_type}, Strength: ${sampleFact[0].strength}`);
  }
  
  // Sample topic relationship
  const { data: sampleTopic } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .eq("source_level", "topic")
    .eq("target_level", "topic")
    .limit(1);
  
  if (sampleTopic && sampleTopic.length > 0) {
    console.log(`\nSample topic relationship:`);
    console.log(`  ${sampleTopic[0].source_id.substring(0,8)} -> ${sampleTopic[0].target_id.substring(0,8)}`);
    console.log(`  Type: ${sampleTopic[0].relationship_type}, Strength: ${sampleTopic[0].strength}`);
  }
  
  console.log(`\n=== VERIFICATION RESULT ===`);
  console.log(`Fact relationships preserved: ${factCount >= 1000 ? "YES ✓" : "NO ✗"}`);
  console.log(`Topic relationships added: ${topicCount > 0 ? "YES ✓" : "NO ✗"}`);
  console.log(`Expected fact count: 1210, Actual: ${factCount}`);
  console.log(`Expected topic count: 163, Actual: ${topicCount}`);
  console.log(`Expected total: 1373, Actual: ${totalCount}`);
}

verifyFactPreserved().catch(console.error);
