/**
 * Test navigation logic after code fix
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

async function testNavigation() {
  console.log("=== Testing Navigation Logic (Fixed Code) ===\n");
  
  const topicSlug = "machine-learning-basics";
  const topic = topics.find(t => t.slug === topicSlug);
  
  if (!topic) {
    console.error(`Topic ${topicSlug} not found`);
    return;
  }
  
  console.log(`Testing: ${topicSlug} (${topic.id})\n`);
  
  // Simulate getSemanticRecommendations logic
  const { data: outgoing } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .eq("source_id", topic.id)
    .eq("source_level", "topic")
    .eq("target_level", "topic")
    .limit(20);

  const { data: incoming } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .eq("target_id", topic.id)
    .eq("target_level", "topic")
    .eq("source_level", "topic")
    .limit(20);

  const topicIds = new Set<string>();
  outgoing?.forEach(rel => topicIds.add(rel.target_id));
  incoming?.forEach(rel => topicIds.add(rel.source_id));

  const { data: relatedTopics } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("status", "published")
    .in("id", Array.from(topicIds));

  const topicMap = new Map();
  relatedTopics?.forEach(t => {
    topicMap.set(t.id, {
      slug: t.slug,
      title: t.topic_translations?.[0]?.title || t.slug,
    });
  });

  const recommendations = {
    prerequisites: [] as any[],
    nextTopics: [] as any[],
    applications: [] as any[],
    related: [] as any[],
  };

  for (const rel of outgoing || []) {
    const topicInfo = topicMap.get(rel.target_id);
    if (!topicInfo) continue;

    const rec = {
      topicSlug: topicInfo.slug,
      topicTitle: topicInfo.title,
      relationshipType: rel.relationship_type,
      strength: rel.strength,
    };

    if (['requires', 'depends_on'].includes(rel.relationship_type)) {
      recommendations.prerequisites.push(rec);
    } else if (['precedes', 'extends', 'specializes'].includes(rel.relationship_type)) {
      recommendations.nextTopics.push(rec);
    } else if (['part_of', 'causes', 'related_to'].includes(rel.relationship_type)) {
      recommendations.applications.push(rec);
    } else {
      recommendations.related.push(rec);
    }
  }

  for (const rel of incoming || []) {
    const topicInfo = topicMap.get(rel.source_id);
    if (!topicInfo) continue;

    const rec = {
      topicSlug: topicInfo.slug,
      topicTitle: topicInfo.title,
      relationshipType: rel.relationship_type,
      strength: rel.strength,
    };

    if (['requires', 'depends_on'].includes(rel.relationship_type)) {
      recommendations.nextTopics.push(rec);
    } else if (['precedes', 'extends', 'specializes'].includes(rel.relationship_type)) {
      recommendations.prerequisites.push(rec);
    } else if (['part_of', 'causes', 'related_to'].includes(rel.relationship_type)) {
      recommendations.applications.push(rec);
    } else {
      recommendations.related.push(rec);
    }
  }

  console.log(`PREREQUISITES: ${recommendations.prerequisites.length}`);
  recommendations.prerequisites.forEach(r => {
    console.log(`  - ${r.topicSlug} (${r.topicTitle})`);
  });

  console.log(`\nNEXT TOPICS: ${recommendations.nextTopics.length}`);
  recommendations.nextTopics.forEach(r => {
    console.log(`  - ${r.topicSlug} (${r.topicTitle})`);
  });

  console.log(`\nAPPLICATIONS: ${recommendations.applications.length}`);
  recommendations.applications.forEach(r => {
    console.log(`  - ${r.topicSlug} (${r.topicTitle})`);
  });

  console.log(`\nRELATED: ${recommendations.related.length}`);
  recommendations.related.forEach(r => {
    console.log(`  - ${r.topicSlug} (${r.topicTitle})`);
  });

  // Test learning journey logic
  const { data: prerequisites } = await supabase
    .from("knowledge_relationships")
    .select("target_id")
    .eq("source_id", topic.id)
    .eq("source_level", "topic")
    .eq("target_level", "topic")
    .eq("relationship_type", "requires")
    .limit(3);

  const { data: nextTopics } = await supabase
    .from("knowledge_relationships")
    .select("target_id")
    .eq("source_id", topic.id)
    .eq("source_level", "topic")
    .eq("target_level", "topic")
    .in("relationship_type", ["precedes", "extends", "specializes"])
    .limit(5);

  const allTopicIds = [
    ...(prerequisites || []).map((r: any) => r.target_id),
    ...(nextTopics || []).map((r: any) => r.target_id),
  ];

  let continueWith: string[] = [];
  if (allTopicIds.length > 0) {
    const { data: journeyTopics } = await supabase
      .from("topics")
      .select("id, slug")
      .eq("status", "published")
      .in("id", allTopicIds);

    const topicSlugMap = new Map();
    journeyTopics?.forEach(t => topicSlugMap.set(t.id, t.slug));

    continueWith = [
      ...(prerequisites || []).map((r: any) => topicSlugMap.get(r.target_id)).filter(Boolean),
      ...(nextTopics || []).map((r: any) => topicSlugMap.get(r.target_id)).filter(Boolean),
    ];
  }

  console.log(`\n=== LEARNING JOURNEY ===`);
  console.log(`Continue with: ${continueWith.join(", ")}`);

  console.log(`\n=== VERIFICATION RESULT ===`);
  const totalRecs = recommendations.prerequisites.length + 
                    recommendations.nextTopics.length + 
                    recommendations.applications.length + 
                    recommendations.related.length;
  const navigationWorks = totalRecs > 0 || continueWith.length > 0;
  
  console.log(`Navigation works: ${navigationWorks ? "YES ✓" : "NO ✗"}`);
  console.log(`Total recommendations: ${totalRecs}`);
  console.log(`Learning journey topics: ${continueWith.length}`);
}

testNavigation().catch(console.error);
