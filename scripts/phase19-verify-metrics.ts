/**
 * Step 6 Verification: Analyze graph metrics after bulk insert
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function analyzeMetrics() {
  console.log("=== Step 6 Verification: Graph Metrics ===\n");
  
  // Get all relationships
  const { data: allRelationships, error } = await supabase
    .from("knowledge_relationships")
    .select("source_id, target_id");
  
  if (error) {
    console.error("Error fetching relationships:", error);
    return;
  }
  
  console.log(`Total relationships in database: ${allRelationships.length}`);
  
  // Count relationships per topic (both incoming and outgoing)
  const topicCounts = new Map();
  
  for (const topic of topics) {
    topicCounts.set(topic.id, { incoming: 0, outgoing: 0, total: 0, title: topic.title });
  }
  
  for (const rel of allRelationships) {
    if (topicCounts.has(rel.source_id)) {
      const count = topicCounts.get(rel.source_id);
      count.outgoing++;
      count.total++;
    }
    if (topicCounts.has(rel.target_id)) {
      const count = topicCounts.get(rel.target_id);
      count.incoming++;
      count.total++;
    }
  }
  
  // Calculate statistics
  const topicStats = Array.from(topicCounts.values());
  const totalRelationships = topicStats.reduce((sum, t) => sum + t.total, 0);
  const avgGraphDegree = totalRelationships / topicStats.length;
  
  const topicsWithZero = topicStats.filter(t => t.total === 0);
  const topicsWithFewerThan5 = topicStats.filter(t => t.total < 5);
  
  console.log(`\n=== Graph Statistics ===`);
  console.log(`Total published topics: ${topics.length}`);
  console.log(`Total relationships: ${totalRelationships}`);
  console.log(`Average graph degree: ${avgGraphDegree.toFixed(2)} relationships per topic`);
  
  console.log(`\n=== Topics with Zero Relationships ===`);
  console.log(`Count: ${topicsWithZero.length}`);
  if (topicsWithZero.length > 0) {
    topicsWithZero.forEach(t => console.log(`  - ${t.title}`));
  }
  
  console.log(`\n=== Topics with Fewer than 5 Relationships ===`);
  console.log(`Count: ${topicsWithFewerThan5.length}`);
  if (topicsWithFewerThan5.length > 0) {
    topicsWithFewerThan5.forEach(t => console.log(`  - ${t.title}: ${t.total} relationships`));
  }
  
  console.log(`\n=== Relationships Per Topic (Sorted) ===`);
  const sorted = topicStats.sort((a, b) => b.total - a.total);
  sorted.forEach(t => {
    console.log(`  ${t.title}: ${t.total} (in: ${t.incoming}, out: ${t.outgoing})`);
  });
  
  console.log(`\n=== Summary ===`);
  console.log(`Topics with zero relationships: ${topicsWithZero.length}/${topics.length} (${((topicsWithZero.length/topics.length)*100).toFixed(1)}%)`);
  console.log(`Topics with fewer than 5 relationships: ${topicsWithFewerThan5.length}/${topics.length} (${((topicsWithFewerThan5.length/topics.length)*100).toFixed(1)}%)`);
  console.log(`Topics with 5+ relationships: ${topics.length - topicsWithFewerThan5.length}/${topics.length} (${(((topics.length - topicsWithFewerThan5.length)/topics.length)*100).toFixed(1)}%)`);
}

analyzeMetrics().catch(console.error);
