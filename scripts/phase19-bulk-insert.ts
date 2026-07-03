/**
 * Step 6: Bulk insert remaining relationships
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

const topics = JSON.parse(readFileSync(resolve(__dirname, "phase19-published-topics.json"), "utf-8"));
const relationships = JSON.parse(readFileSync(resolve(__dirname, "phase19-relationships.json"), "utf-8"));

const topicMap = new Map();
for (const topic of topics) {
  topicMap.set(topic.slug, topic.id);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Map my relationship types to production schema values
function mapRelationshipType(type: string): { type: string; bidirectional: boolean; strength: string } {
  switch (type) {
    case "prerequisite":
      return { type: "related_to", bidirectional: false, strength: "strong" };
    case "next_topic":
      return { type: "related_to", bidirectional: false, strength: "weak" };
    case "previous_topic":
      return { type: "related_to", bidirectional: false, strength: "weak" };
    case "related_topic":
      return { type: "related_to", bidirectional: true, strength: "weak" };
    case "application":
      return { type: "related_to", bidirectional: false, strength: "weak" };
    case "broader_topic":
      return { type: "generalizes", bidirectional: false, strength: "strong" };
    case "narrower_topic":
      return { type: "generalizes", bidirectional: false, strength: "strong" };
    default:
      return { type: "related_to", bidirectional: false, strength: "weak" };
  }
}

async function bulkInsert() {
  console.log("=== Step 6: Bulk Inserting Remaining Relationships ===\n");
  console.log(`Total relationships to insert: ${relationships.length}`);
  
  let successCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;
  
  // Skip the first 5 that were already inserted (HTML → CSS → JS → TS → React → Next.js)
  const skipIds = new Set([
    "b5282190-904a-480a-be1a-d5b611156a0f",
    "194839eb-a9b4-4107-b277-4ad760468460",
    "a1f31d5f-2259-45cb-91a4-aedf9bad6845",
    "aa7d2022-25dd-4162-ae16-9bc68be38dec",
    "d3c5011a-bf34-4907-966a-0d1ce73da2ee",
  ]);
  
  for (let i = 0; i < relationships.length; i++) {
    const rel = relationships[i];
    
    // Skip the 5 test relationships (first 5 in order)
    if (i < 5) {
      console.log(`Skipping test relationship ${i + 1}/${relationships.length}`);
      continue;
    }
    
    const sourceId = rel.source_id;
    const targetId = rel.target_id;
    
    if (!sourceId || !targetId) {
      console.error(`Missing ID for relationship ${i + 1}`);
      errorCount++;
      continue;
    }
    
    const mapped = mapRelationshipType(rel.relationship_type);
    
    const insertData = {
      source_id: sourceId,
      target_id: targetId,
      source_level: "fact",
      target_level: "fact",
      relationship_type: mapped.type,
      strength: mapped.strength,
      bidirectional: mapped.bidirectional,
      explanation: `${rel.relationship_type} relationship`,
    };
    
    const { data, error } = await supabase
      .from("knowledge_relationships")
      .insert(insertData)
      .select();
    
    if (error) {
      errorCount++;
      if (error.message.includes("duplicate")) {
        duplicateCount++;
      }
      if (errorCount <= 10) {
        console.error(`Failed ${i + 1}/${relationships.length}: ${error.message}`);
      }
    } else {
      successCount++;
      if (successCount % 50 === 0) {
        console.log(`Progress: ${successCount}/${relationships.length - 5} inserted`);
      }
    }
  }
  
  console.log(`\n=== Bulk Insert Results ===`);
  console.log(`Successfully inserted: ${successCount}`);
  console.log(`Failed: ${errorCount} (duplicates: ${duplicateCount})`);
  
  // Get final count
  const { count: finalCount } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true });
  
  console.log(`\nTotal relationships in database: ${finalCount}`);
}

bulkInsert().catch(console.error);
