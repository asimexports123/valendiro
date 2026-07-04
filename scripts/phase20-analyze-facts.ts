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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function analyzeKnowledgeFacts() {
  console.log("=== Phase 20: Analyzing Knowledge Facts Content ===\n");
  
  const { data: facts, error } = await supabase
    .from("knowledge_facts")
    .select("*")
    .limit(5);
  
  if (error) {
    console.error("Error fetching knowledge facts:", error);
    return;
  }
  
  console.log(`Fetched ${facts.length} sample knowledge facts\n`);
  
  const structureAnalysis = {
    totalSampled: facts.length,
    fields: [],
    contentLengths: [],
    hasCoreConcepts: 0,
    hasMentalModels: 0,
    hasAnalogies: 0,
    hasComparisons: 0,
    hasMisconceptions: 0,
    hasCaseStudies: 0,
    hasHistoricalContext: 0,
    hasApplications: 0,
    hasDecisionFrameworks: 0,
    hasBestPractices: 0,
    hasCommonMistakes: 0,
    hasFAQs: 0,
    hasGlossary: 0,
    hasNextLearning: 0,
  };
  
  facts.forEach((fact: any) => {
    const keys = Object.keys(fact);
    structureAnalysis.fields.push(...keys);
    
    const content = fact.content || fact.description || fact.body || "";
    structureAnalysis.contentLengths.push(content.length);
    
    const contentLower = content.toLowerCase();
    if (contentLower.includes("core concept") || contentLower.includes("key concept")) structureAnalysis.hasCoreConcepts++;
    if (contentLower.includes("mental model") || contentLower.includes("thinking")) structureAnalysis.hasMentalModels++;
    if (contentLower.includes("analogy") || contentLower.includes("like a")) structureAnalysis.hasAnalogies++;
    if (contentLower.includes("comparison") || contentLower.includes("vs")) structureAnalysis.hasComparisons++;
    if (contentLower.includes("misconception") || contentLower.includes("common mistake")) structureAnalysis.hasMisconceptions++;
    if (contentLower.includes("case study") || contentLower.includes("example")) structureAnalysis.hasCaseStudies++;
    if (contentLower.includes("historical") || contentLower.includes("history")) structureAnalysis.hasHistoricalContext++;
    if (contentLower.includes("application") || contentLower.includes("used in")) structureAnalysis.hasApplications++;
    if (contentLower.includes("decision") || contentLower.includes("framework")) structureAnalysis.hasDecisionFrameworks++;
    if (contentLower.includes("best practice") || contentLower.includes("standard")) structureAnalysis.hasBestPractices++;
    if (contentLower.includes("faq") || contentLower.includes("question")) structureAnalysis.hasFAQs++;
    if (contentLower.includes("glossary") || contentLower.includes("term")) structureAnalysis.hasGlossary++;
    if (contentLower.includes("next") || contentLower.includes("learn more")) structureAnalysis.hasNextLearning++;
  });
  
  const uniqueFields = [...new Set(structureAnalysis.fields)];
  const avgContentLength = structureAnalysis.contentLengths.reduce((a, b) => a + b, 0) / structureAnalysis.contentLengths.length;
  
  console.log("=== STRUCTURE ANALYSIS ===");
  console.log("Available fields:", uniqueFields.join(", "));
  console.log("Average content length:", avgContentLength.toFixed(0), "characters");
  console.log("");
  
  console.log("=== ENRICHMENT COMPONENTS PRESENT ===");
  console.log("Core Concepts:", structureAnalysis.hasCoreConcepts, "/", facts.length);
  console.log("Mental Models:", structureAnalysis.hasMentalModels, "/", facts.length);
  console.log("Analogies:", structureAnalysis.hasAnalogies, "/", facts.length);
  console.log("Comparisons:", structureAnalysis.hasComparisons, "/", facts.length);
  console.log("Common Misconceptions:", structureAnalysis.hasMisconceptions, "/", facts.length);
  console.log("Real Case Studies:", structureAnalysis.hasCaseStudies, "/", facts.length);
  console.log("Historical Context:", structureAnalysis.hasHistoricalContext, "/", facts.length);
  console.log("Practical Applications:", structureAnalysis.hasApplications, "/", facts.length);
  console.log("Decision Frameworks:", structureAnalysis.hasDecisionFrameworks, "/", facts.length);
  console.log("Best Practices:", structureAnalysis.hasBestPractices, "/", facts.length);
  console.log("Common Mistakes:", structureAnalysis.hasCommonMistakes, "/", facts.length);
  console.log("FAQs:", structureAnalysis.hasFAQs, "/", facts.length);
  console.log("Glossary:", structureAnalysis.hasGlossary, "/", facts.length);
  console.log("Next Learning Objectives:", structureAnalysis.hasNextLearning, "/", facts.length);
  
  console.log("\n=== SAMPLE FACT CONTENT ===");
  facts.forEach((fact: any, i: number) => {
    console.log(`\n--- Fact ${i + 1} ---`);
    console.log("Type:", fact.type || "N/A");
    console.log("Content preview:", (fact.content || "").substring(0, 200) + "...");
  });
  
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-fact-analysis.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      structureAnalysis,
      uniqueFields,
      avgContentLength,
      sampleFacts: facts,
    }, null, 2)
  );
  
  console.log("\nAnalysis saved to: phase20-fact-analysis.json");
}

analyzeKnowledgeFacts().catch(console.error);
