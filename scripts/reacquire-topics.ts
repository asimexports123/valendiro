/**
 * Re-trigger Knowledge Acquisition for Production Topics
 * 
 * This script triggers knowledge acquisition for the three production topics
 * to regenerate their knowledge packages with the expanded facts.
 */

import { createAdminClient } from "../lib/supabase/admin";

const PRODUCTION_TOPICS = ["nodejs-cluster", "family-vacations", "vendor-management"];

async function reacquireTopics() {
  console.log("Re-triggering Knowledge Acquisition for Production Topics");
  console.log("======================================================\n");

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

    // Create knowledge acquisition job
    const { data: job, error } = await supabase
      .from("update_queue")
      .insert({
        job_type: "content_refresh",
        object_type: "topic",
        object_id: topic.id,
        status: "pending",
        priority: "high",
        metadata: {
          topic_slug: slug,
          package_id: pkg.id,
        },
      })
      .select()
      .single();

    if (error) {
      console.log(`❌ Failed to create job: ${error.message}`);
      continue;
    }

    console.log(`✅ Created knowledge acquisition job: ${job.id}`);
  }
}

reacquireTopics().catch(console.error);
