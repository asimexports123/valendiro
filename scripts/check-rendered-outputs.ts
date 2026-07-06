/**
 * Check Rendered Outputs
 *
 * Checks the rendered outputs for the three production topics by package_id.
 */

import { createAdminClient } from "../lib/supabase/admin";

const PRODUCTION_TOPICS = ["nodejs-cluster", "family-vacations", "vendor-management"];

async function checkRenderedOutputs() {
  console.log("Checking Rendered Outputs");
  console.log("=========================\n");

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

    // Get rendered output by package_id
    const { data: renderedOutput } = await supabase
      .from("rendered_outputs")
      .select("*")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (renderedOutput) {
      console.log(`✅ Rendered Output: ID=${renderedOutput.id}, status=${renderedOutput.status}`);
      console.log(`   Format: ${renderedOutput.output_format}`);
      console.log(`   Word Count: ${renderedOutput.word_count}`);
      console.log(`   Section Count: ${renderedOutput.section_count}`);
      console.log(`   Quality Score: ${JSON.stringify(renderedOutput.quality_score)}`);
      console.log(`   Content Length: ${renderedOutput.content?.length || 0} chars`);
    } else {
      console.log(`❌ No rendered output found`);
    }
  }
}

checkRenderedOutputs().catch(console.error);
