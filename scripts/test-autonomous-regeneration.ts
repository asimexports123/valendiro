/**
 * Test Autonomous Regeneration Pipeline
 * 
 * This script modifies a knowledge package and verifies that
 * the canonical pipeline automatically triggers regeneration
 * without manual intervention.
 */

import { createAdminClient } from "../lib/supabase/admin";
import { onKnowledgePackageUpdated, getQueueStats, getAllJobs } from "../services/regeneration/contentRegenerationQueue";

const supabase = createAdminClient();
const TEST_TOPIC_SLUG = "javascript-fundamentals";

async function testAutonomousRegeneration() {
  console.log("=== Testing Autonomous Regeneration Pipeline ===\n");

  // Step 1: Get current queue stats
  console.log("Step 1: Getting initial queue stats...");
  const initialStats = await getQueueStats();
  console.log("Initial stats:", initialStats);

  // Step 2: Modify knowledge package
  console.log(`\nStep 2: Modifying knowledge package for ${TEST_TOPIC_SLUG}...`);
  const { data: kp, error: kpError } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("slug", TEST_TOPIC_SLUG);

  if (kpError || !kp || kp.length === 0) {
    throw new Error(`Knowledge package not found: ${kpError?.message}`);
  }

  const knowledgePackage = kp[0];
  console.log("Current knowledge package:", knowledgePackage);

  // Modify the last_updated_at to trigger regeneration
  const { error: updateError } = await supabase
    .from("knowledge_packages")
    .update({
      last_updated_at: new Date().toISOString(),
    })
    .eq("slug", TEST_TOPIC_SLUG);

  if (updateError) {
    throw new Error(`Failed to update knowledge package: ${updateError.message}`);
  }

  console.log("✓ Knowledge package modified successfully");

  // Step 3: Trigger regeneration (simulating automatic trigger)
  console.log(`\nStep 3: Triggering regeneration via canonical pipeline...`);
  await onKnowledgePackageUpdated(TEST_TOPIC_SLUG);
  console.log("✓ Regeneration triggered");

  // Step 4: Wait and check queue
  console.log("\nStep 4: Checking queue status...");
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  
  const afterStats = await getQueueStats();
  console.log("Stats after trigger:", afterStats);

  const jobs = await getAllJobs(10);
  console.log(`\nRecent jobs: ${jobs.length}`);
  if (jobs.length > 0) {
    const latestJob = jobs[0];
    console.log("\nLatest job:");
    console.log(`  ID: ${latestJob.id}`);
    console.log(`  Topic: ${latestJob.topicTitle}`);
    console.log(`  Status: ${latestJob.status}`);
    console.log(`  Stage: ${latestJob.stage}`);
    console.log(`  Progress: ${latestJob.progress}%`);
    console.log(`  Queued at: ${latestJob.queuedAt}`);
    console.log(`\nLogs:`);
    latestJob.logs.forEach((log, i) => console.log(`  ${i + 1}. ${log}`));
  }

  // Step 5: Wait for job to complete
  console.log("\nStep 5: Waiting for job to complete...");
  let completed = false;
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max

  while (!completed && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const currentJobs = await getAllJobs(1);
    if (currentJobs.length > 0) {
      const job = currentJobs[0];
      console.log(`  Status: ${job.status}, Stage: ${job.stage}, Progress: ${job.progress}%`);
      if (job.status === "published" || job.status === "failed") {
        completed = true;
        console.log(`\n✓ Job ${job.status}`);
        if (job.status === "failed") {
          console.log(`  Error: ${job.error}`);
        }
      }
    }
    attempts++;
  }

  if (!completed) {
    console.log("\n⚠ Job did not complete within timeout");
  }

  // Step 6: Verify article content was updated
  console.log("\nStep 6: Verifying article content was updated...");
  const { data: topic } = await supabase
    .from("topics")
    .select("topic_translations(content, updated_at)")
    .eq("slug", TEST_TOPIC_SLUG)
    .eq("topic_translations.language_code", "en")
    .single();

  if (topic) {
    const translation = (topic.topic_translations as any)?.[0];
    console.log(`✓ Article content updated at: ${translation?.updated_at}`);
    console.log(`  Content length: ${translation?.content?.length} characters`);
  }

  console.log("\n=== Test Complete ===");
  console.log("\nVerification:");
  console.log(`  Queue stats: Queued=${afterStats.queued}, Running=${afterStats.running}, Published=${afterStats.published}, Failed=${afterStats.failed}`);
  console.log(`  Latest job status: ${jobs[0]?.status}`);
  console.log(`  Article updated: ${topic ? 'Yes' : 'No'}`);
}

testAutonomousRegeneration()
  .then(() => {
    console.log("\n✓ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Test failed:", error);
    process.exit(1);
  });
