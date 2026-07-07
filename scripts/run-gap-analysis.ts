/**
 * Run gap analysis to trigger regeneration
 */

import { createAdminClient } from "../lib/supabase/admin";
import { analyzeAllTopicGaps } from "../services/discovery/gapAnalysisService";
import { processRegenerationQueue } from "../services/regeneration/contentRegenerationQueue";

const supabase = createAdminClient();

async function runGapAnalysisAndRegeneration() {
  console.log("=" + "=".repeat(79));
  console.log("STEP 1: GAP ANALYSIS");
  console.log("=".repeat(80));

  const gapResult = await analyzeAllTopicGaps();
  console.log(`✓ Analyzed ${gapResult.analyzed} topics for gaps`);
  console.log(`✓ Queued ${gapResult.regenerationQueued} regenerations`);

  // Check gap analysis results
  const { data: gapResults } = await supabase
    .from("gap_analysis_results")
    .select("*")
    .order("analyzed_at", { ascending: false })
    .limit(5);

  if (gapResults && gapResults.length > 0) {
    console.log(`\nRecent Gap Analysis Results:`);
    gapResults.forEach(result => {
      console.log(`  - Severity: ${result.severity}, Missing Sections: ${result.missing_sections?.length}, Action Required: ${result.action_required}`);
    });
  }

  console.log("\n" + "=".repeat(80));
  console.log("STEP 2: REGENERATION QUEUE");
  console.log("=".repeat(80));

  // Check regeneration queue
  const { data: queueJobs } = await supabase
    .from("content_regeneration_queue")
    .select("*")
    .in("status", ["queued", "running"])
    .order("queued_at", { ascending: false })
    .limit(5);

  if (queueJobs && queueJobs.length > 0) {
    console.log(`\nRegeneration Queue Jobs:`);
    queueJobs.forEach(job => {
      console.log(`  - ID: ${job.id}, Topic Slug: ${(job as any).topic_slug}, Status: ${job.status}, Stage: ${(job as any).stage}`);
    });
  } else {
    console.log("\nNo regeneration jobs queued");
  }

  console.log("\n" + "=".repeat(80));
  console.log("STEP 3: PROCESS REGENERATION QUEUE");
  console.log("=".repeat(80));

  await processRegenerationQueue();

  console.log("\n✓ Regeneration queue processed");

  // Check final regeneration queue status
  const { count: queuedCount } = await supabase
    .from("content_regeneration_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "queued");

  const { count: runningCount } = await supabase
    .from("content_regeneration_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "running");

  const { count: publishedCount } = await supabase
    .from("content_regeneration_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  console.log(`\nFinal Queue Status:`);
  console.log(`  - Queued: ${queuedCount || 0}`);
  console.log(`  - Running: ${runningCount || 0}`);
  console.log(`  - Published: ${publishedCount || 0}`);
}

runGapAnalysisAndRegeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
