/**
 * Re-process Production Topics with Fixed Worker
 *
 * Cleans up old facts/citations/relationships and re-processes the three production topics
 * with the fixed knowledge acquisition worker.
 */

import { createAdminClient } from "../lib/supabase/admin";
import { processKnowledgeAcquisitionJob } from "../jobs/workers/knowledgeAcquisitionWorker";

const PRODUCTION_TOPICS = ["nodejs-cluster", "family-vacations", "vendor-management"];

async function reprocessProductionTopics() {
  console.log("Re-processing Production Topics with Fixed Worker");
  console.log("====================================================\n");

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

    // Get knowledge package
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("*")
      .eq("topic_id", topic.id)
      .single();

    if (!pkg) {
      console.log(`❌ Knowledge package not found`);
      continue;
    }

    console.log(`Package ID: ${pkg.id}`);

    // Delete old facts
    const { error: factsDeleteError } = await supabase
      .from("knowledge_facts")
      .delete()
      .eq("package_id", pkg.id);

    if (factsDeleteError) {
      console.log(`❌ Failed to delete old facts: ${factsDeleteError.message}`);
      continue;
    }
    console.log(`✅ Deleted old facts`);

    // Delete old citations
    const { error: citationsDeleteError } = await supabase
      .from("knowledge_citations")
      .delete()
      .eq("package_id", pkg.id);

    if (citationsDeleteError) {
      console.log(`❌ Failed to delete old citations: ${citationsDeleteError.message}`);
      continue;
    }
    console.log(`✅ Deleted old citations`);

    // Delete old relationships
    const { error: relationshipsDeleteError } = await supabase
      .from("knowledge_relationships")
      .delete()
      .eq("source_id", pkg.id)
      .eq("source_level", "package");

    if (relationshipsDeleteError) {
      console.log(`❌ Failed to delete old relationships: ${relationshipsDeleteError.message}`);
      continue;
    }
    console.log(`✅ Deleted old relationships`);

    // Create new queue entry
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

    if (queueError || !queueEntry) {
      console.log(`❌ Failed to create queue entry: ${queueError?.message || "Unknown error"}`);
      continue;
    }

    console.log(`✅ Created queue entry: ${queueEntry.id}`);

    // Process the job
    const result = await processKnowledgeAcquisitionJob(queueEntry, supabase);

    console.log(`Result: ${result.status} - ${result.message}`);

    // Mark completed
    await supabase
      .from("update_queue")
      .update({
        status: result.status === "success" ? "completed" : "failed",
        completed_at: new Date().toISOString(),
        error_message: result.status === "failed" ? result.message : null,
      })
      .eq("id", queueEntry.id);

    console.log(`✅ Marked job as ${result.status === "success" ? "completed" : "failed"}`);
  }
}

reprocessProductionTopics().catch(console.error);
