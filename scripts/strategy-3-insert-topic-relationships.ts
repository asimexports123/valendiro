/**
 * Step 3: Add topic-level relationships (preserve existing fact relationships)
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
      return { type: "requires", bidirectional: false, strength: "strong" };
    case "next_topic":
      return { type: "precedes", bidirectional: false, strength: "strong" };
    case "previous_topic":
      return { type: "precedes", bidirectional: false, strength: "strong" };
    case "related_topic":
      return { type: "related_to", bidirectional: true, strength: "weak" };
    case "application":
      return { type: "related_to", bidirectional: false, strength: "moderate" };
    case "broader_topic":
      return { type: "generalizes", bidirectional: false, strength: "strong" };
    case "narrower_topic":
      return { type: "generalizes", bidirectional: false, strength: "strong" };
    default:
      return { type: "related_to", bidirectional: false, strength: "weak" };
  }
}

async function insertTopicRelationships() {
  console.log("=== Step 3: Inserting Topic-Level Relationships ===\n");
  console.log(`Total relationships to insert: ${relationships.length}`);
  console.log("Preserving existing 1000 fact-level relationships\n");
  
  // Count fact relationships before
  const { count: factCountBefore } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true })
    .eq("source_level", "fact")
    .eq("target_level", "fact");
  
  console.log(`Fact-level relationships before: ${factCountBefore}`);
  
  let successCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;
  
  for (let i = 0; i < relationships.length; i++) {
    const rel = relationships[i];
    
    const sourceId = rel.source_id;
    const targetId = rel.target_id;
    
    if (!sourceId || !targetId) {
      console.error(`Missing ID for relationship ${i + 1}`);
      errorCount++;
      continue;
    }
    
    const mapped = mapRelationshipType(rel.relationship_type);
    
    // Use TOPIC level, not fact level
    const insertData = {
      source_id: sourceId,
      target_id: targetId,
      source_level: "topic",
      target_level: "topic",
      relationship_type: mapped.type,
      strength: mapped.strength,
      bidirectional: mapped.bidirectional,
      explanation: `${rel.relationship_type} relationship between topics`,
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
        console.log(`Progress: ${successCount}/${relationships.length} inserted`);
      }
    }
  }
  
  console.log(`\n=== Insertion Results ===`);
  console.log(`Successfully inserted: ${successCount}`);
  console.log(`Failed: ${errorCount} (duplicates: ${duplicateCount})`);
  
  // Count fact relationships after
  const { count: factCountAfter } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true })
    .eq("source_level", "fact")
    .eq("target_level", "fact");
  
  console.log(`\nFact-level relationships after: ${factCountAfter}`);
  console.log(`Fact relationships preserved: ${factCountBefore === factCountAfter ? "YES ✓" : "NO ✗"}`);
  
  // Count topic relationships
  const { count: topicCount } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true })
    .eq("source_level", "topic")
    .eq("target_level", "topic");
  
  console.log(`Topic-level relationships: ${topicCount}`);
  
  // Total count
  const { count: totalCount } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true });
  
  console.log(`Total relationships: ${totalCount}`);
}

insertTopicRelationships().catch(console.error);
