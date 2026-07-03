/**
 * Step 3 & 4: Insert only 5 relationships first using actual production schema
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

async function insert5Test() {
  console.log("=== Step 3 & 4: Inserting 5 Test Relationships ===\n");
  
  // Test with 5 relationships from the HTML → CSS → JavaScript learning path
  const testRelationships = [
    { source: "html-fundamentals", target: "css-fundamentals", type: "next_topic", explanation: "HTML is prerequisite for CSS" },
    { source: "css-fundamentals", target: "javascript-fundamentals", type: "next_topic", explanation: "CSS is prerequisite for JavaScript" },
    { source: "javascript-fundamentals", target: "typescript-language", type: "next_topic", explanation: "JavaScript is prerequisite for TypeScript" },
    { source: "typescript-language", target: "react-library", type: "next_topic", explanation: "TypeScript is prerequisite for React" },
    { source: "react-library", target: "nextjs-framework", type: "next_topic", explanation: "React is prerequisite for Next.js" },
  ];
  
  for (const rel of testRelationships) {
    const sourceId = topicMap.get(rel.source);
    const targetId = topicMap.get(rel.target);
    
    if (!sourceId || !targetId) {
      console.error(`Topic ID not found for ${rel.source} or ${rel.target}`);
      continue;
    }
    
    const mapped = mapRelationshipType(rel.type);
    
    const insertData = {
      source_id: sourceId,
      target_id: targetId,
      source_level: "fact",
      target_level: "fact",
      relationship_type: mapped.type,
      strength: mapped.strength,
      bidirectional: mapped.bidirectional,
      explanation: rel.explanation,
    };
    
    console.log(`Inserting: ${rel.source} -> ${rel.target} (${rel.type} → ${mapped.type})`);
    
    const { data, error } = await supabase
      .from("knowledge_relationships")
      .insert(insertData)
      .select();
    
    if (error) {
      console.error(`Failed: ${error.message}`);
    } else {
      console.log(`Success: ${data[0].id}`);
    }
  }
}

insert5Test().catch(console.error);
