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
const rerenderSummary = JSON.parse(readFileSync(resolve(__dirname, "phase20-rerender-summary.json"), "utf-8"));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function compareQuality() {
  console.log("=== Phase 20: Before/After Quality Comparison ===\n");
  
  const comparison: any[] = [];
  
  for (const topic of validationTopics.selectedTopics) {
    const rerenderResult = rerenderSummary.results.find((r: any) => r.topic === topic.slug);
    
    if (!rerenderResult || rerenderResult.error) {
      console.log(`${topic.slug}: No re-render data`);
      continue;
    }
    
    // Get package ID
    const { data: packages } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .eq("status", "ready")
      .limit(1);
    
    if (!packages || packages.length === 0) {
      console.log(`${topic.slug}: No package found`);
      continue;
    }
    
    const packageId = packages[0].id;
    
    // Get previous rendered output (before enrichment)
    const { data: previousOutputs } = await supabase
      .from("rendered_outputs")
      .select("id, quality_score, word_count, section_count, created_at")
      .eq("package_id", packageId)
      .eq("output_format", "html")
      .order("created_at", { ascending: false })
      .limit(2);
    
    if (!previousOutputs || previousOutputs.length < 2) {
      console.log(`${topic.slug}: Not enough historical data for comparison`);
      comparison.push({
        topic: topic.slug,
        afterQuality: rerenderResult.qualityScore,
        afterWordCount: rerenderResult.wordCount,
        afterSectionCount: rerenderResult.sectionCount,
        beforeQuality: null,
        beforeWordCount: null,
        beforeSectionCount: null,
        qualityChange: null,
      });
      continue;
    }
    
    const after = previousOutputs[0];
    const before = previousOutputs[1];
    
    const qualityChange = after.quality_score.overall - before.quality_score.overall;
    const wordCountChange = after.word_count - before.word_count;
    const sectionCountChange = after.section_count - before.section_count;
    
    console.log(`${topic.slug}:`);
    console.log(`  Before: Q=${before.quality_score.overall}, Words=${before.word_count}, Sections=${before.section_count}`);
    console.log(`  After:  Q=${after.quality_score.overall}, Words=${after.word_count}, Sections=${after.section_count}`);
    console.log(`  Change: Q${qualityChange >= 0 ? '+' : ''}${qualityChange}, Words${wordCountChange >= 0 ? '+' : ''}${wordCountChange}, Sections${sectionCountChange >= 0 ? '+' : ''}${sectionCountChange}`);
    
    comparison.push({
      topic: topic.slug,
      beforeQuality: before.quality_score.overall,
      beforeWordCount: before.word_count,
      beforeSectionCount: before.section_count,
      afterQuality: after.quality_score.overall,
      afterWordCount: after.word_count,
      afterSectionCount: after.section_count,
      qualityChange,
      wordCountChange,
      sectionCountChange,
    });
  }
  
  // Calculate averages
  const validComparisons = comparison.filter(c => c.beforeQuality !== null);
  const avgQualityChange = validComparisons.reduce((sum, c) => sum + c.qualityChange, 0) / validComparisons.length;
  const avgWordCountChange = validComparisons.reduce((sum, c) => sum + c.wordCountChange, 0) / validComparisons.length;
  const avgSectionCountChange = validComparisons.reduce((sum, c) => sum + c.sectionCountChange, 0) / validComparisons.length;
  
  console.log(`\n=== AVERAGE CHANGES ===`);
  console.log(`Quality Score: ${avgQualityChange.toFixed(2)}`);
  console.log(`Word Count: ${avgWordCountChange.toFixed(0)}`);
  console.log(`Section Count: ${avgSectionCountChange.toFixed(2)}`);
  
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-quality-comparison.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      comparison,
      averages: {
        qualityChange: avgQualityChange,
        wordCountChange: avgWordCountChange,
        sectionCountChange: avgSectionCountChange,
      },
    }, null, 2)
  );
}

compareQuality().catch(console.error);
