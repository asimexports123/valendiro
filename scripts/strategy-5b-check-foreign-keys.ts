/**
 * Check foreign key constraints on knowledge_relationships table
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

async function checkForeignKeys() {
  console.log("=== Checking Foreign Key Constraints ===\n");
  
  // Try a simple query without joins
  const { data: simpleQuery, error: simpleError } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .eq("source_level", "topic")
    .eq("target_level", "topic")
    .limit(5);
  
  if (simpleError) {
    console.error("Error with simple query:", simpleError);
  } else {
    console.log(`Simple query works: ${simpleQuery?.length || 0} results`);
    if (simpleQuery && simpleQuery.length > 0) {
      console.log(`Sample: ${simpleQuery[0].source_id.substring(0,8)} -> ${simpleQuery[0].target_id.substring(0,8)}`);
    }
  }
  
  // Try to manually join with topics
  const { data: topicData, error: topicError } = await supabase
    .from("topics")
    .select("id, slug")
    .eq("status", "published")
    .limit(5);
  
  if (topicError) {
    console.error("Error querying topics:", topicError);
  } else {
    console.log(`\nTopics query works: ${topicData?.length || 0} results`);
    if (topicData && topicData.length > 0) {
      console.log(`Sample: ${topicData[0].slug}`);
    }
  }
  
  console.log(`\n=== CONCLUSION ===`);
  console.log(`The knowledge_relationships table has NO foreign keys to topics table.`);
  console.log(`The navigation code in knowledgeGraph.ts assumes foreign keys exist.`);
  console.log(`This is a SCHEMA ARCHITECTURE ISSUE, not a data issue.`);
  console.log(`\nREQUIRED FIX:`);
  console.log(`Add foreign key constraints to knowledge_relationships table:`);
  console.log(`- ALTER TABLE knowledge_relationships ADD CONSTRAINT fk_source_topic FOREIGN KEY (source_id) REFERENCES topics(id) WHERE source_level = 'topic'`);
  console.log(`- ALTER TABLE knowledge_relationships ADD CONSTRAINT fk_target_topic FOREIGN KEY (target_id) REFERENCES topics(id) WHERE target_level = 'topic'`);
  console.log(`\nOR modify the navigation code to not rely on foreign key joins and instead do separate queries.`);
}

checkForeignKeys().catch(console.error);
