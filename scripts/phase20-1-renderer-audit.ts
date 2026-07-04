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

const validationTopics = JSON.parse(readFileSync(resolve(__dirname, "phase20-validation-topics.json"), "utf-8"));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditRenderer() {
  console.log("=== Phase 20.1: Renderer Audit ===");
  console.log("Verifying enrichment facts are expanded into meaningful content\n");
  
  const enrichedContent = {
    coreConcepts: ["core", "concept", "fundamental", "basic", "definition"],
    mentalModels: ["think of", "model", "mental model", "imagine", "framework"],
    analogies: ["like a", "similar to", "compared to", "analogous", "just as"],
    historicalContext: ["created", "developed", "history", "origin", "evolved"],
    applications: ["application", "use case", "used for", "applied", "practical"],
  };

  const factTypeToCategory: Record<string, string> = {
    "definition": "coreConcepts",
    "property": "applications",
    "historical": "historicalContext",
  };
  
  const auditResults: any[] = [];
  
  for (const topic of validationTopics.selectedTopics.slice(0, 5)) {
    console.log(`\n=== ${topic.slug} ===`);
    
    const { data: packages } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .eq("status", "ready")
      .limit(1);
    
    if (!packages || packages.length === 0) {
      console.log("No package found");
      continue;
    }
    
    const packageId = packages[0].id;
    
    const { data: allFacts } = await supabase
      .from("knowledge_facts")
      .select("id, statement, tags, fact_type")
      .eq("package_id", packageId);
    
    const facts = allFacts?.filter((f: any) => f.tags?.includes("enriched")) || [];
    
    const { data: outputs } = await supabase
      .from("rendered_outputs")
      .select("content")
      .eq("package_id", packageId)
      .eq("output_format", "html")
      .neq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (!outputs || outputs.length === 0) {
      console.log("No rendered output found");
      continue;
    }
    
    const renderedContent = outputs[0].content.toLowerCase();
    const wordCount = renderedContent.split(/\s+/).length;
    
    console.log(`Enrichment facts: ${facts?.length || 0}`);
    console.log(`Rendered word count: ${wordCount}`);
    
    const enrichmentPresence: any = {};
    
    for (const [type, keywords] of Object.entries(enrichedContent)) {
      const matchingFacts = facts?.filter((f: any) => {
        const category = factTypeToCategory[f.fact_type];
        return category === type;
      }) || [];
      
      console.log(`\n${type}: ${matchingFacts.length} facts`);
      
      if (matchingFacts.length === 0) {
        enrichmentPresence[type] = { facts: 0, present: false };
        continue;
      }
      
      let keywordMatches = 0;
      for (const keyword of keywords) {
        if (renderedContent.includes(keyword)) {
          keywordMatches++;
        }
      }
      
      const present = keywordMatches > 0;
      enrichmentPresence[type] = {
        facts: matchingFacts.length,
        keywordMatches,
        present,
      };
      
      if (matchingFacts.length > 0) {
        const sampleFact = matchingFacts[0].statement;
        const factPreview = sampleFact.length > 100 ? sampleFact.substring(0, 100) + "..." : sampleFact;
        console.log(`  Sample fact: "${factPreview}"`);
        console.log(`  Keywords in content: ${keywordMatches}/${keywords.length}`);
        console.log(`  Present: ${present ? "YES" : "NO"}`);
      }
    }
    
    const avgWordsPerFact = wordCount / (facts?.length || 1);
    const possiblySummarized = avgWordsPerFact < 15;
    
    console.log(`\nAverage words per fact: ${avgWordsPerFact.toFixed(1)}`);
    console.log(`Possibly summarized: ${possiblySummarized ? "YES" : "NO"}`);
    
    auditResults.push({
      topic: topic.slug,
      enrichmentFacts: facts?.length || 0,
      renderedWordCount: wordCount,
      avgWordsPerFact,
      possiblySummarized,
      enrichmentPresence,
    });
  }
  
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-1-renderer-audit.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      auditResults,
    }, null, 2)
  );
  
  console.log("\n=== SUMMARY ===");
  const summarizedCount = auditResults.filter(r => r.possiblySummarized).length;
  console.log(`Topics possibly summarized: ${summarizedCount}/${auditResults.length}`);
}

auditRenderer().catch(console.error);
