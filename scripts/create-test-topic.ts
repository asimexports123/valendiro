/**
 * Create ONE Test Topic for Validation
 *
 * Creates a test topic with knowledge package and enqueues a knowledge acquisition job
 * to validate the unified queue architecture.
 */

import { createAdminClient } from "../lib/supabase/admin";

const TEST_SLUG = "test-react-hooks-v2-2026";

async function createTestTopic() {
  console.log("Creating Test Topic for Validation");
  console.log("===================================\n");

  const supabase = createAdminClient();

  // Step 1: Create a test topic
  console.log("Step 1: Creating test topic...");
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .insert({
      slug: TEST_SLUG,
      canonical_path: `/en/topics/${TEST_SLUG}`,
      category_id: null,
      subcategory_id: null,
      status: "published",
    })
    .select()
    .single();

  if (topicError) {
    console.error(`❌ Failed to create topic: ${topicError.message}`);
    return;
  }

  console.log(`✅ Topic created: ID=${topic.id}, slug=${topic.slug}\n`);

  // Step 2: Create knowledge package directly
  console.log("Step 2: Creating knowledge package...");
  const { data: pkg, error: pkgError } = await supabase
    .from("knowledge_packages")
    .insert({
      slug: TEST_SLUG,
      topic_id: topic.id,
      version: 1,
      knowledge_hash: "test-hash-123",
      source_count: 0,
      fact_count: 0,
      relationship_count: 0,
      status: "ready",
      discovery_run_ids: [],
    })
    .select()
    .single();

  if (pkgError) {
    console.error(`❌ Failed to create knowledge package: ${pkgError.message}`);
    return;
  }

  console.log(`✅ Knowledge package created: ID=${pkg.id}\n`);

  // Step 3: Enqueue job directly to update_queue
  console.log("Step 3: Enqueueing knowledge acquisition job...");
  const { data: queueEntry, error: queueError } = await supabase
    .from("update_queue")
    .insert({
      object_id: topic.id,
      object_type: "topic",
      job_type: "content_refresh",
      priority: 10,
      scheduled_at: new Date().toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (queueError) {
    console.error(`❌ Failed to enqueue job: ${queueError.message}`);
    return;
  }

  console.log(`✅ Queue entry created: ID=${queueEntry.id}, status=${queueEntry.status}\n`);

  console.log("Test topic creation complete!");
  console.log(`Topic ID: ${topic.id}`);
  console.log(`Package ID: ${pkg.id}`);
  console.log(`Queue Job ID: ${queueEntry.id}`);
  console.log(`Queue Job Status: ${queueEntry.status}`);
  console.log("\nNext step: Run the scheduler to process the job");
}

createTestTopic().catch(console.error);
