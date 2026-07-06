/**
 * Check Test Topic Queue Entry
 *
 * Checks the queue entry for the test topic to understand why it's not being processed.
 */

import { createAdminClient } from "../lib/supabase/admin";

const TEST_SLUG = "test-react-hooks-v2-2026";

async function checkQueueEntry() {
  console.log("Checking Test Topic Queue Entry");
  console.log("==============================\n");

  const supabase = createAdminClient();

  // Get the topic
  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", TEST_SLUG)
    .single();

  if (!topic) {
    console.error("Topic not found");
    return;
  }

  console.log(`Topic ID: ${topic.id}`);
  console.log(`Topic Slug: ${topic.slug}\n`);

  // Get the queue entry
  const { data: queueEntry } = await supabase
    .from("update_queue")
    .select("*")
    .eq("object_id", topic.id)
    .eq("object_type", "topic")
    .eq("job_type", "content_refresh")
    .single();

  if (!queueEntry) {
    console.error("Queue entry not found");
    return;
  }

  console.log("Queue Entry Details:");
  console.log(`ID: ${queueEntry.id}`);
  console.log(`Status: ${queueEntry.status}`);
  console.log(`Priority: ${queueEntry.priority}`);
  console.log(`Scheduled At: ${queueEntry.scheduled_at}`);
  console.log(`Created At: ${queueEntry.created_at}\n`);

  // Get all pending jobs for comparison
  const { data: allPendingJobs } = await supabase
    .from("update_queue")
    .select("*")
    .eq("status", "pending")
    .eq("job_type", "content_refresh")
    .eq("object_type", "topic")
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(20);

  console.log("All Pending Knowledge Acquisition Jobs (Top 20):");
  console.log("================================================");
  for (const job of allPendingJobs || []) {
    const isTestJob = job.id === queueEntry.id;
    console.log(`${isTestJob ? ">>> " : "    "}ID: ${job.id}, Priority: ${job.priority}, Scheduled: ${job.scheduled_at}`);
  }
}

checkQueueEntry().catch(console.error);
