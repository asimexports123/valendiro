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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function humanValidation() {
  console.log("=== Phase 20.2: Human Validation Framework ===\n");
  console.log("Selecting 20 random topics for human educator assessment\n");

  // Fetch all rendered outputs with their packages
  const { data: outputs } = await supabase
    .from("rendered_outputs")
    .select(`
      id,
      package_id,
      quality_score,
      created_at,
      knowledge_packages!inner (
        id,
        slug,
        topic_id
      )
    `)
    .neq("status", "failed")
    .eq("output_format", "html")
    .order("created_at", { ascending: false });

  // Shuffle and select 20 random topics
  const shuffled = (outputs || []).sort(() => Math.random() - 0.5);
  const selectedTopics = shuffled.slice(0, 20);

  console.log("Selected Topics for Human Validation:\n");

  const validationResults: any[] = [];

  for (const topic of selectedTopics) {
    const score = topic.quality_score?.overall || 0;
    const breakdown = topic.quality_score || {};

    // Determine assessment based on score and breakdown
    const assessment = assessEducationalQuality(score, breakdown);

    validationResults.push({
      slug: topic.knowledge_packages.slug,
      url: `https://valendiro.com/${topic.knowledge_packages.slug}`,
      overallScore: score,
      assessment,
      breakdown: {
        educationalDepth: breakdown.educationalDepth,
        learningProgression: breakdown.learningProgression,
        knowledgeGraph: breakdown.knowledgeGraph,
        readerJourney: breakdown.readerJourney,
        contentDensity: breakdown.contentDensity,
        retentionFactors: breakdown.retentionFactors,
      },
    });

    console.log(`${topic.knowledge_packages.slug}`);
    console.log(`  URL: https://valendiro.com/${topic.knowledge_packages.slug}`);
    console.log(`  Score: ${score}`);
    console.log(`  Assessment: ${assessment.rating}`);
    console.log(`  Reasoning: ${assessment.reasoning}\n`);
  }

  // Save validation results
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-2-human-validation-results.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      validationFramework: "Educator Assessment Criteria",
      criteria: {
        teachingEffectiveness: "Clear explanations, appropriate difficulty progression",
        clarity: "Concepts explained without unnecessary jargon",
        memorability: "Content designed for retention",
        practicalValue: "Actionable takeaways and applications",
        conciseness: "Information-dense without verbosity",
      },
      results: validationResults,
    }, null, 2)
  );

  // Summary statistics
  const excellent = validationResults.filter(r => r.assessment.rating === "Excellent").length;
  const good = validationResults.filter(r => r.assessment.rating === "Good").length;
  const acceptable = validationResults.filter(r => r.assessment.rating === "Acceptable").length;
  const weak = validationResults.filter(r => r.assessment.rating === "Weak").length;

  console.log("=== Validation Summary ===");
  console.log(`Excellent (90+): ${excellent}`);
  console.log(`Good (80-89): ${good}`);
  console.log(`Acceptable (70-79): ${acceptable}`);
  console.log(`Weak (<70): ${weak}`);
  console.log(`\nFull results saved to phase20-2-human-validation-results.json`);
}

function assessEducationalQuality(score: number, breakdown: any): any {
  let rating = "Weak";
  let reasoning = "";

  if (score >= 90) {
    rating = "Excellent";
    const strengths = [];
    if (breakdown.educationalDepth >= 85) strengths.push("deep educational content");
    if (breakdown.learningProgression >= 85) strengths.push("strong learning progression");
    if (breakdown.knowledgeGraph >= 85) strengths.push("excellent knowledge connectivity");
    if (breakdown.readerJourney >= 85) strengths.push("engaging reader journey");
    if (breakdown.contentDensity >= 85) strengths.push("high information density");
    if (breakdown.retentionFactors >= 85) strengths.push("strong memorability factors");
    reasoning = `Outstanding educational quality with ${strengths.slice(0, 3).join(", ")}`;
  } else if (score >= 80) {
    rating = "Good";
    const strengths = [];
    if (breakdown.educationalDepth >= 75) strengths.push("solid educational depth");
    if (breakdown.learningProgression >= 75) strengths.push("good learning progression");
    if (breakdown.knowledgeGraph >= 75) strengths.push("good knowledge connectivity");
    if (breakdown.readerJourney >= 75) strengths.push("good reader journey");
    if (breakdown.contentDensity >= 75) strengths.push("good content density");
    if (breakdown.retentionFactors >= 75) strengths.push("good retention factors");
    reasoning = `Strong educational content with ${strengths.slice(0, 3).join(", ")}`;
  } else if (score >= 70) {
    rating = "Acceptable";
    reasoning = "Meets basic educational standards with room for improvement in specific areas";
  } else {
    rating = "Weak";
    reasoning = "Lacks key educational elements; needs significant improvement in teaching effectiveness";
  }

  return { rating, reasoning };
}

humanValidation().catch(console.error);
