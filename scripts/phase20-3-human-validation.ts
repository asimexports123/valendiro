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
  console.log("=== Phase 20.3: Intent-Aware Human Validation ===\n");
  console.log("Testing 5 pages per category: Technology, Business, Travel, Home, Finance\n");

  // Fetch rendered outputs
  const { data: outputs } = await supabase
    .from("rendered_outputs")
    .select("id, package_id, document_tree, quality_score, created_at")
    .neq("status", "failed")
    .eq("output_format", "html")
    .order("created_at", { ascending: false });

  // Fetch knowledge packages separately
  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("id, slug, subcategory_slug");

  // Create a map of package_id to package data
  const packageMap = new Map();
  (packages || []).forEach((p: any) => {
    packageMap.set(p.id, p);
  });

  const { scoreIntentAwareQuality } = await import("../services/renderer/intentAwareQualityScorer.ts");
  const { classifyIntent } = await import("../services/renderer/intentClassifier.ts");

  // Group by category using intent classifier
  const categoryGroups: Record<string, any[]> = {
    technology: [],
    business: [],
    travel: [],
    home: [],
    finance: [],
    health: [],
    education: [],
  };

  for (const output of outputs || []) {
    const pkg = packageMap.get(output.package_id);
    if (!pkg) continue;
    
    const classification = classifyIntent(pkg.slug, pkg.subcategory_slug);
    
    if (categoryGroups[classification.category]) {
      categoryGroups[classification.category].push({ ...output, package_data: pkg });
    }
  }

  // Select 5 from each category
  const validationResults: any[] = [];

  for (const [category, items] of Object.entries(categoryGroups)) {
    console.log(`\n=== ${category.toUpperCase()} ===`);
    const selected = items.slice(0, 5);

    for (const output of selected) {
      const pkg = output.package_data;
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

      // Calculate new score with intent-aware engine
      const newScore = scoreIntentAwareQuality(
        tree, 
        facts || [], 
        citations || [], 
        decision, 
        pkg.slug, 
        pkg.subcategory_slug
      );

      const oldScore = output.quality_score?.overall || 0;
      const scoreChange = newScore.overall - oldScore;

      console.log(`  ${pkg.slug}`);
      console.log(`    Intent: ${newScore.intent}`);
      console.log(`    Category: ${newScore.category}`);
      console.log(`    Old: ${oldScore} → New: ${newScore.overall} (${scoreChange >= 0 ? '+' : ''}${scoreChange})`);
      console.log(`    URL: https://valendiro.com/${pkg.slug}`);

      validationResults.push({
        slug: pkg.slug,
        category,
        intent: newScore.intent,
        oldScore,
        newScore: newScore.overall,
        scoreChange,
        url: `https://valendiro.com/${pkg.slug}`,
        metrics: newScore.metrics,
        universalMetrics: newScore.universalMetrics,
      });
    }
  }

  // Save results
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-3-human-validation-results.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      validationResults,
    }, null, 2)
  );

  // Summary
  console.log(`\n=== Summary ===`);
  console.log(`Total validated: ${validationResults.length}`);
  
  const avgChange = validationResults.reduce((sum, r) => sum + r.scoreChange, 0) / validationResults.length;
  const avgNewScore = validationResults.reduce((sum, r) => sum + r.newScore, 0) / validationResults.length;
  
  console.log(`Average new score: ${avgNewScore.toFixed(2)}`);
  console.log(`Average score change: ${avgChange.toFixed(2)}`);

  const categoryBreakdown: Record<string, { count: number; avgScore: number }> = {};
  for (const result of validationResults) {
    if (!categoryBreakdown[result.category]) {
      categoryBreakdown[result.category] = { count: 0, avgScore: 0 };
    }
    categoryBreakdown[result.category].count++;
    categoryBreakdown[result.category].avgScore += result.newScore;
  }

  console.log(`\nCategory Breakdown:`);
  for (const [cat, data] of Object.entries(categoryBreakdown)) {
    data.avgScore = data.avgScore / data.count;
    console.log(`  ${cat}: ${data.count} pages, avg score ${data.avgScore.toFixed(2)}`);
  }

  console.log(`\nFull results saved to phase20-3-human-validation-results.json`);
  console.log(`\nHuman Assessment Criteria:`);
  console.log(`- Technology: Does it help understand concepts, implement solutions, solve problems?`);
  console.log(`- Business: Does it support decisions, provide frameworks, offer strategies?`);
  console.log(`- Travel: Is it inspiring, practical, helpful for planning?`);
  console.log(`- Home: Is it practically useful, step-by-step, actionable?`);
  console.log(`- Finance: Does it support decisions, explain risks, help planning?`);
}

humanValidation().catch(console.error);
