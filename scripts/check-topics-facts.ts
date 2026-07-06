/**
 * Check if topics have knowledge packages and facts
 */

import { createAdminClient } from "../lib/supabase/admin";

const TOPICS_TO_CHECK = [
  "nodejs-cluster",
  "family-vacations",
  "vendor-management",
];

async function checkTopics() {
  console.log("Checking Topics for Knowledge Packages and Facts");
  console.log("================================================\n");

  const supabase = createAdminClient();

  for (const slug of TOPICS_TO_CHECK) {
    console.log(`\n--- ${slug} ---`);

    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("id, slug, status")
      .eq("slug", slug)
      .maybeSingle();

    if (!topic) {
      console.log("   ❌ Topic not found");
      continue;
    }

    console.log(`   ✅ Topic found (id: ${topic.id}, status: ${topic.status})`);

    // Get knowledge package
    const { data: packageData } = await supabase
      .from("knowledge_packages")
      .select("id, slug")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (!packageData) {
      console.log("   ❌ Knowledge package not found");
      continue;
    }

    console.log(`   ✅ Knowledge package found (id: ${packageData.id}, slug: ${packageData.slug})`);

    // Count facts
    const { count: factCount } = await supabase
      .from("knowledge_facts")
      .select("*", { count: "exact", head: true })
      .eq("package_id", packageData.id);

    console.log(`   Facts count: ${factCount || 0}`);

    // Count citations
    const { count: citationCount } = await supabase
      .from("knowledge_citations")
      .select("*", { count: "exact", head: true })
      .eq("package_id", packageData.id);

    console.log(`   Citations count: ${citationCount || 0}`);

    // Count relationships
    const { count: relationshipCount } = await supabase
      .from("knowledge_relationships")
      .select("*", { count: "exact", head: true })
      .eq("package_id", packageData.id);

    console.log(`   Relationships count: ${relationshipCount || 0}`);
  }
}

checkTopics().catch(console.error);
