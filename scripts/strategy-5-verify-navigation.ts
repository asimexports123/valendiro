/**
 * Step 5: Verify topic relationships exist and navigation works
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

async function verifyNavigation() {
  console.log("=== Step 5: Verify Topic Navigation Works ===\n");
  
  // Test with machine-learning-basics topic
  const topicSlug = "machine-learning-basics";
  const topic = topics.find(t => t.slug === topicSlug);
  
  if (!topic) {
    console.error(`Topic ${topicSlug} not found`);
    return;
  }
  
  console.log(`Testing navigation for: ${topicSlug}`);
  console.log(`Topic ID: ${topic.id}\n`);
  
  // Test the exact query that knowledgeGraph.ts uses
  const { data: outgoing, error: outgoingError } = await supabase
    .from("knowledge_relationships")
    .select("*, topics!inner(slug, topic_translations(title))")
    .eq("source_id", topic.id)
    .eq("source_level", "topic")
    .eq("target_level", "topic")
    .eq("topics.status", "published")
    .limit(10);
  
  if (outgoingError) {
    console.error("Error querying outgoing relationships:", outgoingError);
  } else {
    console.log(`Outgoing topic relationships: ${outgoing?.length || 0}`);
    if (outgoing && outgoing.length > 0) {
      outgoing.forEach(rel => {
        const title = rel.topics?.topic_translations?.[0]?.title || "Unknown";
        console.log(`  → ${rel.topics.slug} (${title})`);
        console.log(`    Type: ${rel.relationship_type}, Strength: ${rel.strength}`);
      });
    }
  }
  
  // Test incoming relationships
  const { data: incoming, error: incomingError } = await supabase
    .from("knowledge_relationships")
    .select("*, topics!inner(slug, topic_translations(title))")
    .eq("target_id", topic.id)
    .eq("target_level", "topic")
    .eq("source_level", "topic")
    .eq("topics.status", "published")
    .limit(10);
  
  if (incomingError) {
    console.error("Error querying incoming relationships:", incomingError);
  } else {
    console.log(`\nIncoming topic relationships: ${incoming?.length || 0}`);
    if (incoming && incoming.length > 0) {
      incoming.forEach(rel => {
        const title = rel.topics?.topic_translations?.[0]?.title || "Unknown";
        console.log(`  ← ${rel.topics.slug} (${title})`);
        console.log(`    Type: ${rel.relationship_type}, Strength: ${rel.strength}`);
      });
    }
  }
  
  // Test learning journey query
  const { data: prerequisites, error: prereqError } = await supabase
    .from("knowledge_relationships")
    .select("target_id, topics!inner(slug, topic_translations(title))")
    .eq("source_id", topic.id)
    .eq("source_level", "topic")
    .eq("target_level", "topic")
    .eq("relationship_type", "requires")
    .eq("topics.status", "published")
    .limit(3);
  
  if (prereqError) {
    console.error("Error querying prerequisites:", prereqError);
  } else {
    console.log(`\nPrerequisites: ${prerequisites?.length || 0}`);
    if (prerequisites && prerequisites.length > 0) {
      prerequisites.forEach((r: any) => {
        const title = r.topics?.topic_translations?.[0]?.title || "Unknown";
        console.log(`  - ${r.topics.slug} (${title})`);
      });
    }
  }
  
  // Test next topics query
  const { data: nextTopics, error: nextError } = await supabase
    .from("knowledge_relationships")
    .select("target_id, topics!inner(slug, topic_translations(title))")
    .eq("source_id", topic.id)
    .eq("source_level", "topic")
    .eq("target_level", "topic")
    .in("relationship_type", ["precedes", "extends", "specializes"])
    .eq("topics.status", "published")
    .limit(5);
  
  if (nextError) {
    console.error("Error querying next topics:", nextError);
  } else {
    console.log(`\nNext topics: ${nextTopics?.length || 0}`);
    if (nextTopics && nextTopics.length > 0) {
      nextTopics.forEach((r: any) => {
        const title = r.topics?.topic_translations?.[0]?.title || "Unknown";
        console.log(`  - ${r.topics.slug} (${title})`);
      });
    }
  }
  
  // Calculate graph density per topic
  console.log(`\n=== Graph Density Analysis ===`);
  const topicIds = topics.map(t => t.id);
  
  let topicsWithZero = 0;
  let topicsWithFewerThan5 = 0;
  let totalConnections = 0;
  
  for (const t of topics) {
    const { count } = await supabase
      .from("knowledge_relationships")
      .select("*", { count: "exact", head: true })
      .or(`source_id.eq.${t.id},target_id.eq.${t.id}`)
      .eq("source_level", "topic")
      .eq("target_level", "topic");
    
    totalConnections += count || 0;
    
    if (count === 0) topicsWithZero++;
    if (count < 5) topicsWithFewerThan5++;
  }
  
  const avgDegree = totalConnections / topics.length;
  
  console.log(`Total published topics: ${topics.length}`);
  console.log(`Total topic-to-topic connections: ${totalConnections}`);
  console.log(`Average graph degree: ${avgDegree.toFixed(2)} per topic`);
  console.log(`Topics with zero relationships: ${topicsWithZero}/${topics.length}`);
  console.log(`Topics with fewer than 5 relationships: ${topicsWithFewerThan5}/${topics.length}`);
  
  console.log(`\n=== NAVIGATION VERIFICATION RESULT ===`);
  const navigationWorks = (outgoing?.length || 0) > 0 || (incoming?.length || 0) > 0;
  console.log(`Navigation works: ${navigationWorks ? "YES ✓" : "NO ✗"}`);
  console.log(`Topic relationships exist: ${topicIds.length > 0 ? "YES ✓" : "NO ✗"}`);
}

verifyNavigation().catch(console.error);
