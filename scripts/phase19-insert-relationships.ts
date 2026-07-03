/**
 * Phase 19 - Insert semantic relationships into database
 */

import { readFileSync } from "fs";
import { resolve } from "path";

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

async function insertRelationships() {
  let successCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;
  
  for (const rel of relationships) {
    try {
      // Add required source_level and target_level columns
      const relationshipWithLevels = {
        ...rel,
        source_type: "topic",
        target_type: "topic",
        source_level: "beginner",
        target_level: "beginner",
      };
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_relationships`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=ignore-duplicates",
        },
        body: JSON.stringify(relationshipWithLevels),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        successCount++;
      } else {
        errorCount++;
        const error = data.error || data.message || response.statusText;
        console.error(`Failed to insert: ${rel.source_id.substring(0,8)} -> ${rel.target_id.substring(0,8)} (${rel.relationship_type}): ${error}`);
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
