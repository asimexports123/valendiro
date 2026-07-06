/**
 * Process Test Topic Job Directly
 *
 * Directly processes the test topic's knowledge acquisition job
 * to verify the end-to-end lifecycle.
 */

import { createAdminClient } from "../lib/supabase/admin";
import { processKnowledgeAcquisitionJob } from "../jobs/workers/knowledgeAcquisitionWorker";

const TEST_SLUG = "test-react-hooks-v2-2026";

async function processTestTopicJob() {
  console.log("Processing Test Topic Job Directly");
  console.log("===================================\n");

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

  console.log(`Queue Job ID: ${queueEntry.id}`);
  console.log(`Queue Job Status: ${queueEntry.status}\n`);

  // Mark in_progress
  await supabase
    .from("update_queue")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", queueEntry.id);

  console.log("Marked job as in_progress\n");

  // Process the job
  const result = await processKnowledgeAcquisitionJob(queueEntry, supabase);

  console.log(`Job Result: ${result.status}`);
  console.log(`Job Message: ${result.message}\n`);

  // Mark completed or failed
  await supabase
    .from("update_queue")
    .update({
      status: result.status === "success" ? "completed" : "failed",
      completed_at: new Date().toISOString(),
      error_message: result.status === "failed" ? result.message : null,
    })
    .eq("id", queueEntry.id);

  console.log(`Marked job as ${result.status === "success" ? "completed" : "failed"}`);
}

processTestTopicJob().catch(console.error);
