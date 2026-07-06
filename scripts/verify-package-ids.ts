/**
 * Verify Package IDs from Earlier Check
 *
 * The earlier check-topics-facts.ts found these packages:
 * - nodejs-cluster: ea3f9ac1-b0fd-4ae7-8552-75245331ef9e
 * - family-vacations: 30a11d2a-0413-491f-ac1b-e6574fbabd69
 * - vendor-management: 0e9e7def-de47-45f3-a1e7-b3cfcffd0b85
 */

import { createAdminClient } from "../lib/supabase/admin";

const PACKAGE_IDS = [
  "ea3f9ac1-b0fd-4ae7-8552-75245331ef9e",
  "30a11d2a-0413-491f-ac1b-e6574fbabd69",
  "0e9e7def-de47-45f3-a1e7-b3cfcffd0b85",
];

async function main() {
  console.log("Verifying Package IDs");
  console.log("=====================\n");

  const supabase = createAdminClient();

  for (const packageId of PACKAGE_IDS) {
    console.log(`\n--- Package ID: ${packageId} ---`);

    // Get package details
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("*")
      .eq("id", packageId)
      .maybeSingle();

    if (!pkg) {
      console.log("❌ Package not found");
      continue;
    }

    console.log(`✅ Package found`);
    console.log(`   Slug: ${pkg.slug}`);
    console.log(`   Topic ID: ${pkg.topic_id}`);
    console.log(`   Status: ${pkg.status}`);
    console.log(`   Created: ${pkg.created_at}`);
    console.log(`   Updated: ${pkg.updated_at}`);

    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("id, slug")
      .eq("id", pkg.topic_id)
      .maybeSingle();

    console.log(`   Topic Slug: ${topic?.slug || 'NOT FOUND'}`);

    // Count facts
    const { count: factCount } = await supabase
      .from("knowledge_facts")
      .select("*", { count: "exact", head: true })
      .eq("package_id", packageId);

    console.log(`   Facts: ${factCount || 0}`);

    // Count citations
    const { count: citationCount } = await supabase
      .from("knowledge_citations")
      .select("*", { count: "exact", head: true })
      .eq("package_id", packageId);

    console.log(`   Citations: ${citationCount || 0}`);

    // Count relationships
    const { count: relationshipCount } = await supabase
      .from("knowledge_relationships")
      .select("*", { count: "exact", head: true })
      .eq("package_id", packageId);

    console.log(`   Relationships: ${relationshipCount || 0}`);
  }
}

main().catch(console.error);
