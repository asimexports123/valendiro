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

async function analyzeKnowledgePackages() {
  console.log("=== Phase 20: Analyzing Current Knowledge Package Structure ===\n");
  
  // Fetch sample knowledge packages
  const { data: packages, error } = await supabase
    .from("knowledge_packages")
    .select("*")
    .limit(5);
  
  if (error) {
    console.error("Error fetching knowledge packages:", error);
    return;
  }
  
  console.log(`Fetched ${packages.length} sample knowledge packages\n`);
  
  // Analyze structure
  const structureAnalysis = {
    totalSampled: packages.length,
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
  
  packages.forEach((pkg: any) => {
    const keys = Object.keys(pkg);
    structureAnalysis.fields.push(...keys);
    
    // Check for content fields
    const content = pkg.content || pkg.description || pkg.body || "";
    structureAnalysis.contentLengths.push(content.length);
    
    // Check for enrichment components
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
  console.log("Core Concepts:", structureAnalysis.hasCoreConcepts, "/", packages.length);
  console.log("Mental Models:", structureAnalysis.hasMentalModels, "/", packages.length);
  console.log("Analogies:", structureAnalysis.hasAnalogies, "/", packages.length);
  console.log("Comparisons:", structureAnalysis.hasComparisons, "/", packages.length);
  console.log("Common Misconceptions:", structureAnalysis.hasMisconceptions, "/", packages.length);
  console.log("Real Case Studies:", structureAnalysis.hasCaseStudies, "/", packages.length);
  console.log("Historical Context:", structureAnalysis.hasHistoricalContext, "/", packages.length);
  console.log("Practical Applications:", structureAnalysis.hasApplications, "/", packages.length);
  console.log("Decision Frameworks:", structureAnalysis.hasDecisionFrameworks, "/", packages.length);
  console.log("Best Practices:", structureAnalysis.hasBestPractices, "/", packages.length);
  console.log("Common Mistakes:", structureAnalysis.hasCommonMistakes, "/", packages.length);
  console.log("FAQs:", structureAnalysis.hasFAQs, "/", packages.length);
  console.log("Glossary:", structureAnalysis.hasGlossary, "/", packages.length);
  console.log("Next Learning Objectives:", structureAnalysis.hasNextLearning, "/", packages.length);
  
  // Save analysis
  const analysis = {
    timestamp: new Date().toISOString(),
    structureAnalysis,
    uniqueFields,
    avgContentLength,
    samplePackages: packages,
  };
  
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-package-analysis.json"),
    JSON.stringify(analysis, null, 2)
  );
  
  console.log("\nAnalysis saved to: phase20-package-analysis.json");
}

analyzeKnowledgePackages().catch(console.error);
