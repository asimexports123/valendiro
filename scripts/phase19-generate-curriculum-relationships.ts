/**
 * Phase 19 Step 2: Generate curriculum-based relationships
 * Only creates meaningful educational relationships based on natural learning order
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
const gapAnalysis = JSON.parse(readFileSync(resolve(__dirname, "phase19-gap-analysis.json"), "utf-8"));

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Define curriculum-based learning paths
const curriculumPaths: Record<string, string[]> = {
  // Programming Path
  "python-programming-fundamentals": ["variables", "data-types", "operators", "control-flow"],
  "javascript-programming-fundamentals": ["variables", "functions", "arrays", "objects"],
  "sql-fundamentals": ["database-basics", "data-types", "queries", "joins"],
  
  // Machine Learning Path
  "statistics": ["probability", "data-analysis"],
  "linear-algebra": ["vectors", "matrices", "transformations"],
  "machine-learning-basics": ["python-programming-fundamentals", "statistics", "linear-algebra"],
  "machine-learning-fundamentals": ["machine-learning-basics", "pandas-data-analysis", "data-visualization"],
  "neural-networks": ["machine-learning-fundamentals", "deep-learning"],
  
  // Data Science Path
  "pandas-data-analysis": ["python-programming-fundamentals", "data-structures"],
  "data-visualization": ["pandas-data-analysis", "statistics"],
  "data-science-fundamentals": ["statistics", "programming-fundamentals", "data-analysis"],
  
  // Web Development Path
  "html-fundamentals": ["web-basics"],
  "css-fundamentals": ["html-fundamentals"],
  "javascript-programming-fundamentals": ["html-fundamentals", "css-fundamentals"],
  "react-fundamentals": ["javascript-programming-fundamentals", "html-fundamentals"],
  
  // Systems Path
  "computer-networks": ["operating-systems", "data-communication"],
  "operating-systems": ["computer-architecture", "software-basics"],
  "databases": ["data-structures", "storage-systems"],
  
  // Finance Path
  "personal-finance-fundamentals": ["budgeting", "saving", "investing"],
  "budgeting": ["income-management", "expense-tracking"],
  "investing": ["risk-management", "portfolio-theory"],
};

// Define application relationships (when a topic is applied in another domain)
const applicationMappings: Record<string, string[]> = {
  "python-programming-fundamentals": ["machine-learning", "data-science", "web-development", "automation"],
  "statistics": ["machine-learning", "data-science", "research", "finance"],
  "machine-learning": ["artificial-intelligence", "data-science", "robotics", "finance"],
  "sql-fundamentals": ["data-analysis", "web-development", "business-intelligence"],
  "data-visualization": ["data-science", "business-intelligence", "journalism", "research"],
};

const topicSlugToId = new Map();
for (const topic of topics) {
  topicSlugToId.set(topic.slug, topic.id);
}

async function generateCurriculumRelationships() {
  console.log("=== Phase 19: Generating Curriculum-Based Relationships ===\n");
  
  const newRelationships: any[] = [];
  const seen = new Set<string>();
  
  // 1. Generate prerequisite relationships based on curriculum paths
  console.log("Generating prerequisite relationships...");
  for (const [sourceSlug, requiredSlugs] of Object.entries(curriculumPaths)) {
    const sourceId = topicSlugToId.get(sourceSlug);
    if (!sourceId) continue;
    
    for (const reqSlug of requiredSlugs) {
      const targetId = topicSlugToId.get(reqSlug);
      if (!targetId) continue;
      
      const key = `${sourceId}-${targetId}-requires`;
      if (seen.has(key)) continue;
      seen.add(key);
      
      newRelationships.push({
        source_id: sourceId,
        target_id: targetId,
        source_level: "topic",
        target_level: "topic",
        relationship_type: "requires",
        strength: "strong",
        bidirectional: false,
        explanation: `Curriculum prerequisite: ${reqSlug} should be learned before ${sourceSlug}`,
      });
    }
  }
  
  // 2. Generate next topic relationships (reverse of prerequisites)
  console.log("Generating next topic relationships...");
  for (const [sourceSlug, nextSlugs] of Object.entries(curriculumPaths)) {
    const sourceId = topicSlugToId.get(sourceSlug);
    if (!sourceId) continue;
    
    for (const nextSlug of nextSlugs) {
      const targetId = topicSlugToId.get(nextSlug);
      if (!targetId) continue;
      
      const key = `${targetId}-${sourceId}-precedes`;
      if (seen.has(key)) continue;
      seen.add(key);
      
      newRelationships.push({
        source_id: targetId,
        target_id: sourceId,
        source_level: "topic",
        target_level: "topic",
        relationship_type: "precedes",
        strength: "strong",
        bidirectional: false,
        explanation: `Curriculum sequence: ${nextSlug} should be learned before ${sourceSlug}`,
      });
    }
  }
  
  // 3. Generate application relationships
  console.log("Generating application relationships...");
  for (const [sourceSlug, applicationDomains] of Object.entries(applicationMappings)) {
    const sourceId = topicSlugToId.get(sourceSlug);
    if (!sourceId) continue;
    
    for (const domain of applicationDomains) {
      // Find topics in this domain (by name similarity)
      const relatedTopics = topics.filter(t => 
        t.slug.includes(domain) || t.slug.includes(domain.replace("-", ""))
      );
      
      for (const relatedTopic of relatedTopics) {
        if (relatedTopic.id === sourceId) continue;
        
        const key = `${sourceId}-${relatedTopic.id}-application`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        newRelationships.push({
          source_id: sourceId,
          target_id: relatedTopic.id,
          source_level: "topic",
          target_level: "topic",
          relationship_type: "related_to",
          strength: "moderate",
          bidirectional: false,
          explanation: `Application: ${sourceSlug} is applied in ${domain}`,
        });
      }
    }
  }
  
  // 4. Generate related topics within same subcategory
  console.log("Generating same-subcategory relationships...");
  const { data: topicDetails } = await supabase
    .from("topics")
    .select("id, subcategory_id")
    .eq("status", "published");
  
  const subcategoryGroups = new Map<string, string[]>();
  topicDetails?.forEach((t: any) => {
    if (!subcategoryGroups.has(t.subcategory_id)) {
      subcategoryGroups.set(t.subcategory_id, []);
    }
    subcategoryGroups.get(t.subcategory_id)!.push(t.id);
  });
  
  for (const [subcatId, topicIds] of subcategoryGroups.entries()) {
    if (topicIds.length < 2) continue;
    
    for (let i = 0; i < topicIds.length; i++) {
      for (let j = i + 1; j < topicIds.length; j++) {
        const key = `${topicIds[i]}-${topicIds[j]}-related`;
        const reverseKey = `${topicIds[j]}-${topicIds[i]}-related`;
        if (seen.has(key) || seen.has(reverseKey)) continue;
        
        seen.add(key);
        
        newRelationships.push({
          source_id: topicIds[i],
          target_id: topicIds[j],
          source_level: "topic",
          target_level: "topic",
          relationship_type: "related_to",
          strength: "weak",
          bidirectional: true,
          explanation: "Same subcategory",
        });
      }
    }
  }
  
  console.log(`\nGenerated ${newRelationships.length} new relationships`);
  console.log(`  Prerequisites: ${newRelationships.filter(r => r.relationship_type === "requires").length}`);
  console.log(`  Next topics: ${newRelationships.filter(r => r.relationship_type === "precedes").length}`);
  console.log(`  Applications: ${newRelationships.filter(r => r.explanation.includes("Application")).length}`);
  console.log(`  Related: ${newRelationships.filter(r => r.relationship_type === "related_to").length}`);
  
  // Insert relationships
  console.log("\nInserting relationships...");
  let successCount = 0;
  let duplicateCount = 0;
  
  for (const rel of newRelationships) {
    const { data, error } = await supabase
      .from("knowledge_relationships")
      .insert(rel)
      .select();
    
    if (error) {
      if (error.message.includes("duplicate")) {
        duplicateCount++;
      }
    } else {
      successCount++;
      if (successCount % 50 === 0) {
        console.log(`Progress: ${successCount}/${newRelationships.length}`);
      }
    }
  }
  
  console.log(`\n=== Insertion Results ===`);
  console.log(`Successfully inserted: ${successCount}`);
  console.log(`Duplicates skipped: ${duplicateCount}`);
  
  // Verify final state
  const { count: topicCount } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true })
    .eq("source_level", "topic")
    .eq("target_level", "topic");
  
  console.log(`Total topic-level relationships: ${topicCount}`);
}

generateCurriculumRelationships().catch(console.error);
