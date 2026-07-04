import { readFileSync } from "fs";
import { resolve } from "path";

// Set ALLOW_RENDER before importing orchestrator
process.env.ALLOW_RENDER = "true";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    process.env[key] = values.join("=");
  }
});

const validationTopics = JSON.parse(readFileSync(resolve(__dirname, "phase20-validation-topics.json"), "utf-8"));

async function rerenderEnrichedPackages() {
  console.log("=== Phase 20: Re-rendering Enriched Packages ===\n");
  
  // Import orchestrator after setting ALLOW_RENDER
  const { render } = await import("../services/renderer/orchestrator");
  
  let successCount = 0;
  let failureCount = 0;
  const results: any[] = [];
  
  for (const topic of validationTopics.selectedTopics) {
    console.log(`Re-rendering: ${topic.slug}`);
    
    try {
      // Get package ID for this topic
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: packages } = await supabase
        .from("knowledge_packages")
        .select("id")
        .eq("topic_id", topic.id)
        .eq("status", "ready")
        .limit(1);
      
      if (!packages || packages.length === 0) {
        console.log(`  ✗ No package found`);
        failureCount++;
        continue;
      }
      
      const packageId = packages[0].id;
      
      const result = await render({
        packageId,
        format: "html",
        rendererId: "long-article",
        style: ["intermediate"],
        forceRerender: true,
      });
      
      console.log(`  ✓ Rendered - Output ID: ${result.outputId}, Quality Score: ${result.qualityScore.overall}, Status: ${result.status}`);
      successCount++;
      
      results.push({
        topic: topic.slug,
        outputId: result.outputId,
        qualityScore: result.qualityScore.overall,
        status: result.status,
        wordCount: result.qualityScore.wordCount,
        sectionCount: result.qualityScore.sectionCount,
      });
    } catch (error: any) {
      console.log(`  ✗ Error: ${error.message}`);
      failureCount++;
      results.push({
        topic: topic.slug,
        error: error.message,
      });
    }
    
    // Small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Successfully rendered: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-rerender-summary.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      successCount,
      failureCount,
      results,
    }, null, 2)
  );
}

rerenderEnrichedPackages().catch(console.error);
