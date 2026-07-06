/**
 * Check rendered headings for the three production topics
 */

import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const sb = createAdminClient();

  const topicSlugs = ["nodejs-cluster", "family-vacations", "vendor-management"];

  for (const slug of topicSlugs) {
    console.log(`\n=== ${slug} ===`);
    
    // Get topic
    const { data: topic } = await sb
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!topic) {
      console.log("Topic not found");
      continue;
    }

    // Get knowledge package
    const { data: pkg } = await sb
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (!pkg) {
      console.log("Knowledge package not found");
      continue;
    }

    // Get the rendered output by package_id
    const { data: rendered } = await sb
      .from("rendered_outputs")
      .select("content")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rendered?.content) {
      const html = rendered.content;
      // Extract h2 headings
      const h2Regex = /<h2[^>]*>(.*?)<\/h2>/g;
      const headings = [];
      let match;
      while ((match = h2Regex.exec(html)) !== null) {
        headings.push(match[1]);
      }
      console.log("Headings:", headings);
    } else {
      console.log("No rendered content found");
    }
  }
}

main().catch(console.error);
