/**
 * Render Production Topics
 *
 * Triggers the renderer for the three production topics:
 * - nodejs-cluster
 * - family-vacations
 * - vendor-management
 */

import { createAdminClient } from "../lib/supabase/admin";

const PRODUCTION_TOPICS = ["nodejs-cluster", "family-vacations", "vendor-management"];

async function renderProductionTopics() {
  console.log("Rendering Production Topics");
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

    console.log(`Package ID: ${pkg.id}, Status: ${pkg.status}`);

    // Trigger rendering by calling the render orchestrator directly
    try {
      const { render } = await import("../services/renderer/orchestrator");
      const result = await render({
        packageId: pkg.id,
        format: "html",
        rendererId: "long-article",
        style: ["intermediate"],
        forceRerender: true,
      });

      console.log(`✅ Render Result: status=${result.status}, outputId=${result.outputId}`);
      console.log(`   Quality Score: ${result.qualityScore}`);
    } catch (error: any) {
      console.log(`❌ Render failed: ${error.message}`);
    }
  }
}

renderProductionTopics().catch(console.error);
