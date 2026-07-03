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

async function testInsert() {
  const htmlId = topicMap.get("html-fundamentals");
  const cssId = topicMap.get("css-fundamentals");
  
  if (!htmlId || !cssId) {
    console.error("Topic IDs not found");
    return;
  }
  
  console.log("Testing single relationship insert...");
  console.log(`HTML ID: ${htmlId}`);
  console.log(`CSS ID: ${cssId}`);
  
  const testRel = {
    source_id: htmlId,
    target_id: cssId,
    relationship_type: "next_topic",
    source_level: "topic",
    target_level: "topic",
    strength: "medium",
    bidirectional: false,
  };
  
  const { data, error } = await supabase
    .from("knowledge_relationships")
    .insert(testRel)
    .select();
  
  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Insert successful:", data);
  }
  
  // Check count
  const { count } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true });
  
  console.log(`Total relationships in database: ${count}`);
}

testInsert().catch(console.error);
