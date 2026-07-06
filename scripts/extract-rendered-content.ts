/**
 * Extract Rendered Content
 *
 * Extracts the actual rendered HTML content for the three production topics.
 */

import { createAdminClient } from "../lib/supabase/admin";

const PRODUCTION_TOPICS = ["nodejs-cluster", "family-vacations", "vendor-management"];

async function extractRenderedContent() {
  console.log("Extracting Rendered Content");
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

    // Get rendered output
    const { data: renderedOutput } = await supabase
      .from("rendered_outputs")
      .select("*")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!renderedOutput) {
      console.log(`❌ No rendered output found`);
      continue;
    }

    console.log(`Content:\n${renderedOutput.content}\n`);
  }
}

extractRenderedContent().catch(console.error);
