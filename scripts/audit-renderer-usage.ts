/**
 * Audit which renderer strategy is used for each topic
 */

import { createAdminClient } from "../lib/supabase/admin";

const TOPICS = ["nodejs-cluster", "vendor-management", "family-vacations"];

async function auditRendererUsage() {
  console.log("Renderer Strategy Audit");
  console.log("======================\n");

  const supabase = createAdminClient();

  for (const slug of TOPICS) {
    console.log(`\n--- ${slug} ---`);

    // Get topic and package
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log(`❌ Topic not found`);
      continue;
    }

    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id, slug")
      .eq("topic_id", topic.id)
      .single();

    if (!pkg) {
      console.log(`❌ Knowledge package not found`);
      continue;
    }

    // Get rendered output
    const { data: rendered } = await supabase
      .from("rendered_outputs")
      .select("renderer_id, renderer_version, diagnostics")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!rendered) {
      console.log(`❌ No rendered output found`);
      continue;
    }

    console.log(`Renderer ID: ${rendered.renderer_id}`);
    console.log(`Renderer Version: ${rendered.renderer_version}`);
    console.log(`Facts Total: ${rendered.diagnostics?.factsTotal || 'N/A'}`);
    console.log(`Facts Used: ${rendered.diagnostics?.factsUsed || 'N/A'}`);
    console.log(`Facts Skipped: ${rendered.diagnostics?.factsSkipped?.length || 0}`);
  }
}

auditRendererUsage().catch(console.error);
