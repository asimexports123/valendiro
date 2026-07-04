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

async function getDetailedBreakdown() {
  console.log("=== Detailed Quality Score Breakdown (10 Articles) ===\n");
  
  const topicsToAnalyze = validationTopics.selectedTopics.slice(0, 10);
  const breakdown: any[] = [];
  
  for (const topic of topicsToAnalyze) {
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
    
    // Get last 2 rendered outputs (before and after enrichment)
    const { data: outputs } = await supabase
      .from("rendered_outputs")
      .select()
      .eq("package_id", packageId)
      .eq("output_format", "html")
      .neq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(2);
    
    if (!outputs || outputs.length < 2) {
      console.log(`${topic.slug}: Not enough historical data`);
      continue;
    }
    
    const after = outputs[0];
    const before = outputs[1];
    
    const qsBefore = before.quality_score as any;
    const qsAfter = after.quality_score as any;
    
    const analysis = {
      topic: topic.slug,
      before: {
        overall: qsBefore?.overall || 0,
        factCoverage: qsBefore?.factCoverage || 0,
        citationCoverage: qsBefore?.citationCoverage || 0,
        sectionCompleteness: qsBefore?.sectionCompleteness || 0,
        readability: qsBefore?.readabilityEstimate || 0,
        readingFlow: qsBefore?.readingFlow?.overallFlowScore || 0,
        wordCount: before.word_count,
        sectionCount: before.section_count,
        citationCount: before.citation_count,
        internalLinkCount: qsBefore?.internalLinkCount || 0,
        missingKnowledge: qsBefore?.missingKnowledgeCount || 0,
      },
      after: {
        overall: qsAfter?.overall || 0,
        factCoverage: qsAfter?.factCoverage || 0,
        citationCoverage: qsAfter?.citationCoverage || 0,
        sectionCompleteness: qsAfter?.sectionCompleteness || 0,
        readability: qsAfter?.readabilityEstimate || 0,
        readingFlow: qsAfter?.readingFlow?.overallFlowScore || 0,
        wordCount: after.word_count,
        sectionCount: after.section_count,
        citationCount: after.citation_count,
        internalLinkCount: qsAfter?.internalLinkCount || 0,
        missingKnowledge: qsAfter?.missingKnowledgeCount || 0,
      },
      changes: {
        overall: (qsAfter?.overall || 0) - (qsBefore?.overall || 0),
        factCoverage: (qsAfter?.factCoverage || 0) - (qsBefore?.factCoverage || 0),
        citationCoverage: (qsAfter?.citationCoverage || 0) - (qsBefore?.citationCoverage || 0),
        sectionCompleteness: (qsAfter?.sectionCompleteness || 0) - (qsBefore?.sectionCompleteness || 0),
        readability: (qsAfter?.readabilityEstimate || 0) - (qsBefore?.readabilityEstimate || 0),
        readingFlow: (qsAfter?.readingFlow?.overallFlowScore || 0) - (qsBefore?.readingFlow?.overallFlowScore || 0),
        wordCount: after.word_count - before.word_count,
        sectionCount: after.section_count - before.section_count,
        citationCount: after.citation_count - before.citation_count,
        internalLinkCount: (qsAfter?.internalLinkCount || 0) - (qsBefore?.internalLinkCount || 0),
        missingKnowledge: (qsAfter?.missingKnowledgeCount || 0) - (qsBefore?.missingKnowledgeCount || 0),
      },
    };
    
    breakdown.push(analysis);
    
    console.log(`${topic.slug}:`);
    console.log(`  Overall: ${analysis.before.overall} → ${analysis.after.overall} (${analysis.changes.overall >= 0 ? '+' : ''}${analysis.changes.overall})`);
    console.log(`  Fact Coverage: ${analysis.before.factCoverage} → ${analysis.after.factCoverage} (${analysis.changes.factCoverage >= 0 ? '+' : ''}${analysis.changes.factCoverage})`);
    console.log(`  Word Count: ${analysis.before.wordCount} → ${analysis.after.wordCount} (${analysis.changes.wordCount >= 0 ? '+' : ''}${analysis.changes.wordCount})`);
    console.log(`  Section Count: ${analysis.before.sectionCount} → ${analysis.after.sectionCount} (${analysis.changes.sectionCount >= 0 ? '+' : ''}${analysis.changes.sectionCount})`);
    console.log(`  Readability: ${analysis.before.readability} → ${analysis.after.readability} (${analysis.changes.readability >= 0 ? '+' : ''}${analysis.changes.readability})`);
    console.log(`  Reading Flow: ${analysis.before.readingFlow} → ${analysis.after.readingFlow} (${analysis.changes.readingFlow >= 0 ? '+' : ''}${analysis.changes.readingFlow})`);
    console.log(`  Missing Knowledge: ${analysis.before.missingKnowledge} → ${analysis.after.missingKnowledge} (${analysis.changes.missingKnowledge >= 0 ? '+' : ''}${analysis.changes.missingKnowledge})`);
    console.log();
  }
  
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-1-score-breakdown.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      breakdown,
    }, null, 2)
  );
  
  console.log("Breakdown saved to phase20-1-score-breakdown.json");
}

getDetailedBreakdown().catch(console.error);
