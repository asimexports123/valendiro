/**
 * Process Production Topics
 *
 * Processes the three production topics with the knowledge acquisition worker:
 * - nodejs-cluster
 * - family-vacations
 * - vendor-management
 */

import { createAdminClient } from "../lib/supabase/admin";
import { processKnowledgeAcquisitionJob } from "../jobs/workers/knowledgeAcquisitionWorker";

const PRODUCTION_TOPICS = ["nodejs-cluster", "family-vacations", "vendor-management"];

async function processProductionTopics() {
  console.log("Processing Production Topics");
  console.log("============================\n");

  const supabase = createAdminClient();

  for (const slug of PRODUCTION_TOPICS) {
    console.log(`\n--- ${slug} ---`);

    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log(`❌ Topic not found`);
      continue;
    }

    console.log(`Topic ID: ${topic.id}`);

    // Get queue entry
    const { data: queueEntry } = await supabase
      .from("update_queue")
      .select("*")
      .eq("object_id", topic.id)
      .eq("object_type", "topic")
      .eq("job_type", "content_refresh")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!queueEntry) {
      console.log(`❌ No queue entry found`);
      continue;
    }

    console.log(`Queue Job ID: ${queueEntry.id}, Status: ${queueEntry.status}`);

    // Mark in_progress
    await supabase
      .from("update_queue")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", queueEntry.id);

    console.log(`Marked job as in_progress`);

    // Process the job
    const result = await processKnowledgeAcquisitionJob(queueEntry, supabase);

    console.log(`Result: ${result.status} - ${result.message}`);

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
}

processProductionTopics().catch(console.error);
