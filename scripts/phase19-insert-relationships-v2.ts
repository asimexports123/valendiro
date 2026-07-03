/**
 * Phase 19 - Insert semantic relationships using Supabase client
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

const relationships = JSON.parse(readFileSync(resolve(__dirname, "phase19-relationships.json"), "utf-8"));

console.log(`Inserting ${relationships.length} relationships into database...\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function insertRelationships() {
  let successCount = 0;
  let errorCount = 0;
  
  for (const rel of relationships) {
    try {
      const relationshipWithLevels = {
        source_id: rel.source_id,
        target_id: rel.target_id,
        relationship_type: rel.relationship_type,
        source_level: "topic",
        target_level: "topic",
        strength: "medium",
        bidirectional: false,
      };
      
      const { error } = await supabase
        .from("knowledge_relationships")
        .insert(relationshipWithLevels);
      
      if (error) {
        errorCount++;
        console.error(`Failed to insert: ${rel.source_id.substring(0,8)} -> ${rel.target_id.substring(0,8)} (${rel.relationship_type}): ${error.message}`);
      } else {
        successCount++;
      }
    } catch (error) {
      errorCount++;
      console.error(`Error inserting: ${rel.source_id.substring(0,8)} -> ${rel.target_id.substring(0,8)}`, error);
    }
  }
  
  console.log(`\nInserted ${successCount} relationships successfully`);
  console.log(`Failed: ${errorCount}`);
}

insertRelationships().catch(console.error);
