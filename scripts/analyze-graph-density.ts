/**
 * Knowledge Graph Density Analysis
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    process.env[key] = values.join("=");
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface SubcategoryAnalysis {
  subcategoryId: string;
  subcategorySlug: string;
  categoryId: string;
  categoryName: string;
  totalTopics: number;
  topicsWithIncomingLinks: number;
  topicsWithOutgoingLinks: number;
  topicsWithNoIncomingLinks: number;
  topicsWithNoOutgoingLinks: number;
  topicsWithBothLinks: number;
  topicsWithNoLinks: number;
  totalRelationships: number;
  canProducePreviousNext: boolean;
  canProduceContinueLearning: boolean;
  canProduceRelatedGuides: boolean;
  canProduceKnowledgeGraph: boolean;
  topics: Array<{
    id: string;
    slug: string;
    title: string;
    incomingCount: number;
    outgoingCount: number;
    totalConnections: number;
  }>;
}

async function fetchSubcategories(): Promise<any[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/subcategories?select=*&order=slug`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function fetchCategories(): Promise<Map<string, { id: string; name: string; slug: string }>> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/categories?select=id,name,slug`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const data = await response.json();
  const map = new Map();
  if (Array.isArray(data)) {
    data.forEach(cat => map.set(cat.id, cat));
  }
  return map;
}

async function fetchTopicsBySubcategory(subcategoryId: string): Promise<any[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/topics?select=id,slug,topic_translations(title)&subcategory_id=eq.${subcategoryId}&status=eq.published`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function fetchRelationshipsForTopics(topicIds: string[]): Promise<any[]> {
  if (topicIds.length === 0) return [];
  
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/knowledge_relationships?select=source_id,target_id,relationship_type&or=(source_id.in.${topicIds.join(",")},target_id.in.${topicIds.join(",")})`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function fetchArticlesForTopics(topicIds: string[]): Promise<any[]> {
  if (topicIds.length === 0) return [];
  
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/topic_articles?select=topic_id,article_id&topic_id=in.(${topicIds.join(",")})`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

function analyzeSubcategory(
  subcategory: any,
  topics: any[],
  relationships: any[],
  articles: any[],
  categoryMap: Map<string, { id: string; name: string; slug: string }>
): SubcategoryAnalysis {
  const topicIdSet = new Set(topics.map(t => t.id));
  
  const category = categoryMap.get(subcategory.category_id) || { name: "Unknown", slug: "unknown" };
  
  const incomingCounts = new Map<string, number>();
  const outgoingCounts = new Map<string, number>();
  
  topics.forEach(t => {
    incomingCounts.set(t.id, 0);
    outgoingCounts.set(t.id, 0);
  });
  
  relationships.forEach(rel => {
    if (topicIdSet.has(rel.source_id)) {
      outgoingCounts.set(rel.source_id, (outgoingCounts.get(rel.source_id) || 0) + 1);
    }
    if (topicIdSet.has(rel.target_id)) {
      incomingCounts.set(rel.target_id, (incomingCounts.get(rel.target_id) || 0) + 1);
    }
  });
  
  let topicsWithIncoming = 0;
  let topicsWithOutgoing = 0;
  let topicsWithNoIncoming = 0;
  let topicsWithNoOutgoing = 0;
  let topicsWithBoth = 0;
  let topicsWithNoLinks = 0;
  
  const topicDetails = topics.map(topic => {
    const incoming = incomingCounts.get(topic.id) || 0;
    const outgoing = outgoingCounts.get(topic.id) || 0;
    const total = incoming + outgoing;
    
    if (incoming > 0) topicsWithIncoming++;
    if (outgoing > 0) topicsWithOutgoing++;
    if (incoming === 0) topicsWithNoIncoming++;
    if (outgoing === 0) topicsWithNoOutgoing++;
    if (incoming > 0 && outgoing > 0) topicsWithBoth++;
    if (total === 0) topicsWithNoLinks++;
    
    return {
      id: topic.id,
      slug: topic.slug,
      title: topic.topic_translations?.[0]?.title || topic.slug,
      incomingCount: incoming,
      outgoingCount: outgoing,
      totalConnections: total,
    };
  });
  
  const canProducePreviousNext = topics.length >= 2 && topicsWithOutgoing >= topics.length * 0.5;
  const canProduceContinueLearning = topics.length >= 3 && relationships.length >= topics.length * 2;
  const canProduceRelatedGuides = articles.length > 0;
  const canProduceKnowledgeGraph = relationships.length > 0 && topicsWithBoth > 0;
  
  return {
    subcategoryId: subcategory.id,
    subcategorySlug: subcategory.slug,
    categoryId: subcategory.category_id,
    categoryName: category.name,
    totalTopics: topics.length,
    topicsWithIncomingLinks: topicsWithIncoming,
    topicsWithOutgoingLinks: topicsWithOutgoing,
    topicsWithNoIncomingLinks: topicsWithNoIncoming,
    topicsWithNoOutgoingLinks: topicsWithNoOutgoing,
    topicsWithBothLinks: topicsWithBoth,
    topicsWithNoLinks: topicsWithNoLinks,
    totalRelationships: relationships.length,
    canProducePreviousNext,
    canProduceContinueLearning,
    canProduceRelatedGuides,
    canProduceKnowledgeGraph,
    topics: topicDetails,
  };
}

async function runAnalysis() {
  console.log("Knowledge Graph Density Analysis\n");
  console.log("=".repeat(60));
  
  const subcategories = await fetchSubcategories();
  const categoryMap = await fetchCategories();
  console.log(`Found ${subcategories.length} subcategories\n`);
  
  const analyses: SubcategoryAnalysis[] = [];
  
  for (const subcategory of subcategories) {
    console.log(`Analyzing: ${subcategory.slug}`);
    
    const topics = await fetchTopicsBySubcategory(subcategory.id);
    const topicIds = topics.map(t => t.id);
    
    const relationships = await fetchRelationshipsForTopics(topicIds);
    const articles = await fetchArticlesForTopics(topicIds);
    
    const analysis = analyzeSubcategory(subcategory, topics, relationships, articles, categoryMap);
    analyses.push(analysis);
    
    console.log(`  Topics: ${analysis.totalTopics}`);
    console.log(`  Relationships: ${analysis.totalRelationships}`);
    console.log(`  Topics with no links: ${analysis.topicsWithNoLinks}`);
    console.log(`  Can produce Previous/Next: ${analysis.canProducePreviousNext ? "Yes" : "No"}`);
    console.log(`  Can produce Continue Learning: ${analysis.canProduceContinueLearning ? "Yes" : "No"}`);
    console.log(`  Can produce Related Guides: ${analysis.canProduceRelatedGuides ? "Yes" : "No"}`);
    console.log(`  Can produce Knowledge Graph: ${analysis.canProduceKnowledgeGraph ? "Yes" : "No"}`);
    console.log();
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("GRAPH COVERAGE REPORT");
  console.log("=".repeat(60) + "\n");
  
  const insufficientTopics = analyses.filter(a => a.totalTopics < 8);
  const insufficientGraph = analyses.filter(a => !a.canProduceKnowledgeGraph);
  const insufficientNav = analyses.filter(a => !a.canProducePreviousNext);
  const insufficientLearning = analyses.filter(a => !a.canProduceContinueLearning);
  
  console.log(`Subcategories with insufficient topics (< 8): ${insufficientTopics.length}`);
  console.log(`Subcategories with insufficient graph density: ${insufficientGraph.length}`);
  console.log(`Subcategories that cannot produce Previous/Next: ${insufficientNav.length}`);
  console.log(`Subcategories that cannot produce Continue Learning: ${insufficientLearning.length}\n`);
  
  if (insufficientTopics.length > 0) {
    console.log("SUBCATEGORIES WITH INSUFFICIENT TOPICS (< 8):");
    console.log("-".repeat(60));
    for (const a of insufficientTopics) {
      console.log(`  ${a.subcategorySlug} (${a.categoryName}): ${a.totalTopics} topics`);
    }
    console.log();
  }
  
  if (insufficientGraph.length > 0) {
    console.log("SUBCATEGORIES THAT CANNOT PRODUCE KNOWLEDGE GRAPH:");
    console.log("-".repeat(60));
    for (const a of insufficientGraph) {
      console.log(`  ${a.subcategorySlug} (${a.categoryName}): ${a.totalTopics} topics, ${a.totalRelationships} relationships`);
      console.log(`    Topics with no links: ${a.topicsWithNoLinks}/${a.totalTopics}`);
    }
    console.log();
  }
  
  if (insufficientNav.length > 0) {
    console.log("SUBCATEGORIES THAT CANNOT PRODUCE PREVIOUS/NEXT:");
    console.log("-".repeat(60));
    for (const a of insufficientNav) {
      console.log(`  ${a.subcategorySlug} (${a.categoryName}): ${a.totalTopics} topics`);
    }
    console.log();
  }
  
  if (insufficientLearning.length > 0) {
    console.log("SUBCATEGORIES THAT CANNOT PRODUCE CONTINUE LEARNING:");
    console.log("-".repeat(60));
    for (const a of insufficientLearning) {
      console.log(`  ${a.subcategorySlug} (${a.categoryName}): ${a.totalTopics} topics, ${a.totalRelationships} relationships`);
    }
    console.log();
  }
  
  const fs = require("fs");
  fs.writeFileSync("graph-density-analysis.json", JSON.stringify(analyses, null, 2));
  console.log("Detailed report saved to: graph-density-analysis.json");
}

runAnalysis().catch(console.error);
