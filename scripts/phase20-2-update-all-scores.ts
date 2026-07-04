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

async function updateAllScores() {
  console.log("=== Phase 20.2: Update All Articles with New Scores ===\n");

  // Fetch all rendered outputs
  const { data: outputs } = await supabase
    .from("rendered_outputs")
    .select(`
      id,
      package_id,
      document_tree,
      knowledge_packages!inner (
        id,
        slug
      )
    `)
    .neq("status", "failed")
    .eq("output_format", "html");

  console.log(`Found ${outputs?.length || 0} rendered outputs to update\n`);

  const { scoreQuality } = await import("../services/renderer/qualityScorer.ts");

  let updated = 0;
  let failed = 0;

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

    // Update database
    const { error } = await supabase
      .from("rendered_outputs")
      .update({
        quality_score: newScore,
      })
      .eq("id", output.id);

    if (error) {
      console.error(`Failed to update ${output.knowledge_packages.slug}:`, error);
      failed++;
    } else {
      console.log(`Updated ${output.knowledge_packages.slug}: ${newScore.overall}`);
      updated++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
}

updateAllScores().catch(console.error);
