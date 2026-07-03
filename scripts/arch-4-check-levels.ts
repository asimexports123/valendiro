/**
 * Step 4: Check if any topic-level relationships exist
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

async function checkLevels() {
  console.log("=== Step 4: Checking Relationship Levels ===\n");
  
  // Check topic-level relationships
  const { data: topicLevel, error: topicError } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .eq("source_level", "topic")
    .eq("target_level", "topic");
  
  if (topicError) {
    console.log("Error:", topicError);
  } else {
    console.log(`Topic-level relationships: ${topicLevel.length}`);
    if (topicLevel.length > 0) {
      console.log("Sample:", topicLevel[0]);
    }
  }
  
  // Check fact-level relationships
  const { data: factLevel, error: factError } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .eq("source_level", "fact")
    .eq("target_level", "fact");
  
  if (factError) {
    console.log("Error:", factError);
  } else {
    console.log(`\nFact-level relationships: ${factLevel.length}`);
  }
  
  // Check all unique level values
  const { data: allLevels } = await supabase
    .from("knowledge_relationships")
    .select("source_level, target_level");
  
  if (allLevels) {
    const levels = new Set();
    allLevels.forEach(r => {
      levels.add(`${r.source_level}/${r.target_level}`);
    });
    console.log(`\nAll level combinations: ${Array.from(levels).join(", ")}`);
  }
}

checkLevels().catch(console.error);
