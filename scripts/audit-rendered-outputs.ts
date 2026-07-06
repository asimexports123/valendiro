/**
 * Check rendered_outputs table
 */

import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const sb = createAdminClient();

  console.log("=== CHECK rendered_outputs table ===");
  const { data: rendered, count } = await sb
    .from("rendered_outputs")
    .select("topic_slug, output_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  
  console.log("Total count:", count);
  console.table(rendered);

  console.log("\n=== CHECK production topics specifically ===");
  const topicSlugs = ["nodejs-cluster", "family-vacations", "vendor-management"];
  for (const slug of topicSlugs) {
    const { data: topicRendered } = await sb
      .from("rendered_outputs")
      .select("topic_slug, output_id, status, created_at")
      .eq("topic_slug", slug)
      .order("created_at", { ascending: false })
      .limit(5);
    console.log(`\n${slug}:`, topicRendered);
  }
}

main().catch(console.error);
