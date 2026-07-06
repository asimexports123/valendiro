/**
 * Check what categories are stored for the three production topics
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
      .select("id, slug, category_id, subcategory_id")
      .eq("slug", slug)
      .single();
    
    console.log("Topic:", topic);
    
    if (topic?.category_id) {
      const { data: category } = await sb
        .from("categories")
        .select("id, slug, name")
        .eq("id", topic.category_id)
        .single();
      console.log("Category:", category);
    }
    
    if (topic?.subcategory_id) {
      const { data: subcategory } = await sb
        .from("subcategories")
        .select("id, slug, name, category_id")
        .eq("id", topic.subcategory_id)
        .single();
      console.log("Subcategory:", subcategory);
    }
    
    // Check topic_subcategories table
    if (topic?.id) {
      const { data: tsub } = await sb
        .from("topic_subcategories")
        .select("topic_id, subcategory_id")
        .eq("topic_id", topic.id)
        .maybeSingle();
      console.log("Topic subcategory mapping:", tsub);
    }
  }
}

main().catch(console.error);
