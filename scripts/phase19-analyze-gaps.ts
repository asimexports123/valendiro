/**
 * Phase 19 Step 1: Analyze current graph gaps
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

interface TopicAnalysis {
  id: string;
  slug: string;
  title: string;
  subcategory: string;
  category: string;
  totalRelationships: number;
  outgoingCount: number;
  incomingCount: number;
  prerequisites: number;
  nextTopics: number;
  applications: number;
  related: number;
  hasPrerequisites: boolean;
  hasNextTopics: boolean;
  hasApplications: boolean;
  hasRelated: boolean;
  isOrphan: boolean;
  isWeak: boolean;
}

async function analyzeGraphGaps() {
  console.log("=== Phase 19: Graph Gap Analysis ===\n");
  
  const topicDetails = new Map();
  const { data: topicTranslations } = await supabase
    .from("topics")
    .select("id, slug, subcategory_id, subcategories(name, category_id), categories(name)")
    .eq("status", "published");
  
  const { data: translations } = await supabase
    .from("topic_translations")
    .select("topic_id, title")
    .eq("language_code", "en");
  
  const titleMap = new Map();
  translations?.forEach(t => titleMap.set(t.topic_id, t.title));
  
  const subcategoryMap = new Map();
  const categoryMap = new Map();
  topicDetails?.forEach((t: any) => {
    subcategoryMap.set(t.id, t.subcategories?.name || "Unknown");
    categoryMap.set(t.id, t.categories?.name || "Unknown");
  });
  
  const analyses: TopicAnalysis[] = [];
  
  for (const topic of topics) {
    // Get all topic-level relationships
    const { data: outgoing } = await supabase
      .from("knowledge_relationships")
      .select("*")
      .eq("source_id", topic.id)
      .eq("source_level", "topic")
      .eq("target_level", "topic");
    
    const { data: incoming } = await supabase
      .from("knowledge_relationships")
      .select("*")
      .eq("target_id", topic.id)
      .eq("target_level", "topic")
      .eq("source_level", "topic");
    
    const total = (outgoing?.length || 0) + (incoming?.length || 0);
    
    // Categorize by relationship type
    let prerequisites = 0;
    let nextTopics = 0;
    let applications = 0;
    let related = 0;
    
    const allRels = [...(outgoing || []), ...(incoming || [])];
    for (const rel of allRels) {
      if (rel.relationship_type === "requires") prerequisites++;
      else if (["precedes", "extends", "specializes"].includes(rel.relationship_type)) nextTopics++;
      else if (["part_of", "causes"].includes(rel.relationship_type)) applications++;
      else if (rel.relationship_type === "related_to") related++;
    }
    
    const analysis: TopicAnalysis = {
      id: topic.id,
      slug: topic.slug,
      title: titleMap.get(topic.id) || topic.slug,
      subcategory: subcategoryMap.get(topic.id) || "Unknown",
      category: categoryMap.get(topic.id) || "Unknown",
      totalRelationships: total,
      outgoingCount: outgoing?.length || 0,
      incomingCount: incoming?.length || 0,
      prerequisites,
      nextTopics,
      applications,
      related,
      hasPrerequisites: prerequisites > 0,
      hasNextTopics: nextTopics > 0,
      hasApplications: applications > 0,
      hasRelated: related > 0,
      isOrphan: total === 0,
      isWeak: total < 5,
    };
    
    analyses.push(analysis);
  }
  
  // Statistics
  const orphans = analyses.filter(a => a.isOrphan);
  const weakTopics = analyses.filter(a => a.isWeak);
  const missingPrereqs = analyses.filter(a => !a.hasPrerequisites);
  const missingNext = analyses.filter(a => !a.hasNextTopics);
  const missingApps = analyses.filter(a => !a.hasApplications);
  const missingRelated = analyses.filter(a => !a.hasRelated);
  
  const totalConnections = analyses.reduce((sum, a) => sum + a.totalRelationships, 0);
  const avgDegree = totalConnections / analyses.length;
  
  console.log(`=== GRAPH STATISTICS ===`);
  console.log(`Total published topics: ${analyses.length}`);
  console.log(`Total topic-to-topic connections: ${totalConnections}`);
  console.log(`Average graph degree: ${avgDegree.toFixed(2)}`);
  console.log(`Orphan topics (0 relationships): ${orphans.length}/${analyses.length}`);
  console.log(`Weak topics (<5 relationships): ${weakTopics.length}/${analyses.length}`);
  console.log(`Missing prerequisites: ${missingPrereqs.length}/${analyses.length}`);
  console.log(`Missing next topics: ${missingNext.length}/${analyses.length}`);
  console.log(`Missing applications: ${missingApps.length}/${analyses.length}`);
  console.log(`Missing related topics: ${missingRelated.length}/${analyses.length}`);
  
  console.log(`\n=== ORPHAN TOPICS (0 relationships) ===`);
  if (orphans.length === 0) {
    console.log("None ✓");
  } else {
    orphans.forEach(t => {
      console.log(`- ${t.slug} (${t.title})`);
      console.log(`  Category: ${t.category} → ${t.subcategory}`);
    });
  }
  
  console.log(`\n=== WEAK TOPICS (<5 relationships) ===`);
  if (weakTopics.length === 0) {
    console.log("None ✓");
  } else {
    weakTopics.forEach(t => {
      console.log(`- ${t.slug} (${t.title}) - ${t.totalRelationships} relationships`);
      console.log(`  Prereqs: ${t.prerequisites}, Next: ${t.nextTopics}, Apps: ${t.applications}, Related: ${t.related}`);
    });
  }
  
  console.log(`\n=== TOPICS MISSING PREREQUISITES ===`);
  if (missingPrereqs.length <= 10) {
    console.log("All topics have prerequisites ✓");
  } else {
    console.log(`${missingPrereqs.length} topics missing prerequisites`);
    missingPrereqs.slice(0, 10).forEach(t => {
      console.log(`- ${t.slug} (${t.title})`);
    });
  }
  
  console.log(`\n=== TOPICS MISSING NEXT TOPICS ===`);
  if (missingNext.length <= 10) {
    console.log("All topics have next topics ✓");
  } else {
    console.log(`${missingNext.length} topics missing next topics`);
    missingNext.slice(0, 10).forEach(t => {
      console.log(`- ${t.slug} (${t.title})`);
    });
  }
  
  console.log(`\n=== TOPICS MISSING APPLICATIONS ===`);
  if (missingApps.length <= 10) {
    console.log("All topics have applications ✓");
  } else {
    console.log(`${missingApps.length} topics missing applications`);
    missingApps.slice(0, 10).forEach(t => {
      console.log(`- ${t.slug} (${t.title})`);
    });
  }
  
  console.log(`\n=== TOPICS MISSING RELATED TOPICS ===`);
  if (missingRelated.length <= 10) {
    console.log("All topics have related topics ✓");
  } else {
    console.log(`${missingRelated.length} topics missing related topics`);
    missingRelated.slice(0, 10).forEach(t => {
      console.log(`- ${t.slug} (${t.title})`);
    });
  }
  
  // Save detailed analysis
  const report = {
    statistics: {
      totalTopics: analyses.length,
      totalConnections,
      avgDegree,
      orphanCount: orphans.length,
      weakCount: weakTopics.length,
      missingPrerequisites: missingPrereqs.length,
      missingNextTopics: missingNext.length,
      missingApplications: missingApps.length,
      missingRelated: missingRelated.length,
    },
    orphans: orphans.map(t => ({ slug: t.slug, title: t.title, category: t.category, subcategory: t.subcategory })),
    weakTopics: weakTopics.map(t => ({ slug: t.slug, title: t.title, totalRelationships: t.totalRelationships, prerequisites: t.prerequisites, nextTopics: t.nextTopics, applications: t.applications, related: t.related })),
    missingPrerequisites: missingPrereqs.map(t => ({ slug: t.slug, title: t.title })),
    missingNext: missingNext.map(t => ({ slug: t.slug, title: t.title })),
    missingApplications: missingApps.map(t => ({ slug: t.slug, title: t.title })),
    missingRelated: missingRelated.map(t => ({ slug: t.slug, title: t.title })),
    allTopics: analyses,
  };
  
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase19-gap-analysis.json"),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\nDetailed report saved to: phase19-gap-analysis.json`);
}

analyzeGraphGaps().catch(console.error);
