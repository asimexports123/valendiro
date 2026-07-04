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

async function rescoreWithRealData() {
  console.log("=== Phase 20.2: Re-scoring with Real Data ===\n");

  // Fetch rendered outputs with their knowledge packages to get facts
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

  console.log(`Found ${outputs?.length || 0} rendered outputs\n`);

  const { scoreQuality } = await import("../services/renderer/qualityScorer.ts");

  const results: any[] = [];

  for (const output of outputs || []) {
    console.log(`Processing ${output.knowledge_packages.slug}...`);

    const oldScore = output.quality_score?.overall || 0;
    const tree = output.document_tree || [];

    // Fetch facts for this package
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("id, statement, fact_type, confidence, scope, tags, domain")
      .eq("package_id", output.package_id);

    // Fetch citations for this package
    const { data: citations } = await supabase
      .from("citations")
      .select("id, source_name, source_url, adapter_name, source_authority, retrieved_at")
      .eq("package_id", output.package_id);

    // Create a mock RenderDecision
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

    // Calculate new score using actual quality scorer
    const newScore = scoreQuality(tree, facts || [], citations || [], decision);
    const newOverall = newScore.overall;

    const scoreChange = newOverall - oldScore;

    results.push({
      slug: output.knowledge_packages.slug,
      outputId: output.id,
      packageId: output.package_id,
      oldScore,
      newOverall,
      scoreChange,
      breakdown: newScore,
    });

    console.log(`  Old: ${oldScore} → New: ${newOverall} (${scoreChange >= 0 ? '+' : ''}${scoreChange})`);
  }

  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-2-rescore-real-data-results.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalProcessed: results.length,
      results,
    }, null, 2)
  );

  const avgChange = results.reduce((sum, r) => sum + r.scoreChange, 0) / results.length;
  const avgNewScore = results.reduce((sum, r) => sum + r.newOverall, 0) / results.length;

  console.log(`\n=== Summary ===`);
  console.log(`Total processed: ${results.length}`);
  console.log(`Average new score: ${avgNewScore.toFixed(2)}`);
  console.log(`Average score change: ${avgChange.toFixed(2)}`);

  const distribution = {
    excellent: results.filter(r => r.newOverall >= 90).length,
    good: results.filter(r => r.newOverall >= 80 && r.newOverall < 90).length,
    acceptable: results.filter(r => r.newOverall >= 70 && r.newOverall < 80).length,
    weak: results.filter(r => r.newOverall < 70).length,
  };

  console.log(`\nScore Distribution:`);
  console.log(`  Excellent (90+): ${distribution.excellent}`);
  console.log(`  Good (80-89): ${distribution.good}`);
  console.log(`  Acceptable (70-79): ${distribution.acceptable}`);
  console.log(`  Weak (<70): ${distribution.weak}`);
}

rescoreWithRealData().catch(console.error);
