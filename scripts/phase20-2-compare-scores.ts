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

async function compareScores() {
  console.log("=== Phase 20.2: Old vs New Score Comparison ===\n");

  // Fetch rendered outputs with their knowledge packages
  const { data: outputs } = await supabase
    .from("rendered_outputs")
    .select(`
      id,
      package_id,
      document_tree,
      quality_score,
      created_at,
      knowledge_packages!inner (
        id,
        topic_id,
        slug
      )
    `)
    .neq("status", "failed")
    .eq("output_format", "html")
    .order("created_at", { ascending: false })
    .limit(20);

  const { scoreQuality } = await import("../services/renderer/qualityScorer.ts");

  const comparisons: any[] = [];

  for (const output of outputs || []) {
    const tree = output.document_tree || [];

    // Fetch facts
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("id, statement, fact_type, confidence, scope, tags, domain")
      .eq("package_id", output.package_id);

    // Fetch citations
    const { data: citations } = await supabase
      .from("citations")
      .select("id, source_name, source_url, adapter_name, source_authority, retrieved_at")
      .eq("package_id", output.package_id);

    const decision = {
      eligible: true,
      reason: null,
      policy: {
        id: "default",
        name: "default",
        categoryMatch: [],
        requiredFactTypes: ["definition"],
        preferredFormat: "long-article",
        preferredStyle: ["intermediate"],
        minFactCount: 5,
        minCitationCount: 1,
        sectionOverrides: [],
        commercialPlaceholders: false,
      },
      blockOrder: [],
      missingKnowledge: [],
      warnings: [],
    };

    // Calculate new score
    const newScore = scoreQuality(tree, facts || [], citations || [], decision);

    // Old score was using verbosity-based model
    const oldScore = output.quality_score?.overall || 0;

    const scoreChange = newScore.overall - oldScore;

    // Determine why the score changed
    const reason = explainScoreChange(oldScore, newScore.overall, newScore);

    comparisons.push({
      slug: output.knowledge_packages.slug,
      oldScore,
      newScore: newScore.overall,
      scoreChange,
      reason,
      breakdown: {
        educationalDepth: newScore.educationalDepth,
        learningProgression: newScore.learningProgression,
        knowledgeGraph: newScore.knowledgeGraph,
        readerJourney: newScore.readerJourney,
        contentDensity: newScore.contentDensity,
        retentionFactors: newScore.retentionFactors,
        citationCoverage: newScore.citationCoverage,
      },
    });
  }

  // Sort by score change
  comparisons.sort((a, b) => b.scoreChange - a.scoreChange);

  console.log("Top 10 Improvements:\n");
  comparisons.slice(0, 10).forEach((c, i) => {
    console.log(`${i + 1}. ${c.slug}`);
    console.log(`   Old: ${c.oldScore} → New: ${c.newScore} (${c.scoreChange >= 0 ? '+' : ''}${c.scoreChange})`);
    console.log(`   Reason: ${c.reason}\n`);
  });

  console.log("\nUnexpected Regressions (if any):\n");
  const regressions = comparisons.filter(c => c.scoreChange < 0);
  if (regressions.length === 0) {
    console.log("None - all scores improved or remained stable\n");
  } else {
    regressions.forEach((c, i) => {
      console.log(`${i + 1}. ${c.slug}`);
      console.log(`   Old: ${c.oldScore} → New: ${c.newScore} (${c.scoreChange})`);
      console.log(`   Reason: ${c.reason}\n`);
    });
  }

  // Save full comparison
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-2-score-comparison.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      comparisons,
    }, null, 2)
  );

  console.log(`\nFull comparison saved to phase20-2-score-comparison.json`);
}

function explainScoreChange(oldScore: number, newScore: number, breakdown: any): string {
  if (newScore > oldScore) {
    const improvements = [];
    if (breakdown.educationalDepth > 70) improvements.push("strong educational depth");
    if (breakdown.learningProgression > 70) improvements.push("good learning progression");
    if (breakdown.knowledgeGraph > 70) improvements.push("good knowledge graph");
    if (breakdown.readerJourney > 70) improvements.push("strong reader journey");
    if (breakdown.contentDensity > 70) improvements.push("good content density");
    if (breakdown.retentionFactors > 70) improvements.push("good retention factors");
    
    if (improvements.length > 0) {
      return `New model rewards ${improvements.slice(0, 3).join(", ")} instead of verbosity`;
    }
    return "New model prioritizes educational quality over article length";
  } else if (newScore < oldScore) {
    return "Article lacks educational depth features rewarded by new model";
  }
  return "Score stable - article has balanced educational and content characteristics";
}

compareScores().catch(console.error);
