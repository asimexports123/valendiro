/**
 * Step 5: Immediately verify those 5 rows with SQL
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

async function verifyInserted() {
  console.log("=== Step 5: Verifying 5 Inserted Rows ===\n");
  
  const testTopicIds = [
    topicMap.get("html-fundamentals"),
    topicMap.get("css-fundamentals"),
    topicMap.get("javascript-fundamentals"),
    topicMap.get("typescript-language"),
    topicMap.get("react-library"),
    topicMap.get("nextjs-framework"),
  ];
  
  // Query relationships involving these topics
  const { data: relationships, error } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .or(`source_id.in.(${testTopicIds.join(",")}),target_id.in.(${testTopicIds.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(10);
  
  if (error) {
    console.error("Error querying relationships:", error);
    return;
  }
  
  console.log(`Found ${relationships.length} recent relationships involving test topics:`);
  relationships.forEach(rel => {
    console.log(`  ${rel.source_id.substring(0,8)} -> ${rel.target_id.substring(0,8)} (${rel.relationship_type}, ${rel.strength}, bidirectional: ${rel.bidirectional})`);
  });
  
  // Check for NULL values
  const nullErrors = relationships.filter(r => 
    !r.source_id || !r.target_id || !r.relationship_type || !r.source_level || !r.target_level || !r.strength || r.bidirectional === null
  );
  
  if (nullErrors.length > 0) {
    console.log(`\n❌ NULL ERRORS: ${nullErrors.length} rows have NULL values`);
  } else {
    console.log(`\n✓ No NULL values in inserted rows`);
  }
  
  // Get total count before and after
  const { count: totalCount } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true });
  
  console.log(`\nTotal relationships in database: ${totalCount}`);
  console.log(`Expected: 1047 (original) + 5 (new) = 1052`);
  
  if (totalCount === 1052) {
    console.log("✓ Relationship count increased correctly");
  } else {
    console.log(`❌ Relationship count mismatch. Expected 1052, got ${totalCount}`);
  }
}

verifyInserted().catch(console.error);
