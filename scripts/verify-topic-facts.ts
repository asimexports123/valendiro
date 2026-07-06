/**
 * Verify Topic Facts
 *
 * Verifies the facts for the three production topics are now topic-specific
 * and contain no React Hooks content.
 */

import { createAdminClient } from "../lib/supabase/admin";

const PRODUCTION_TOPICS = ["nodejs-cluster", "family-vacations", "vendor-management"];

async function verifyTopicFacts() {
  console.log("Verifying Topic Facts");
  console.log("====================\n");

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

    // Get facts
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("*")
      .eq("package_id", pkg.id);

    console.log(`Facts Count: ${facts?.length || 0}`);

    if (facts && facts.length > 0) {
      console.log(`Facts:`);
      for (const fact of facts) {
        console.log(`  - ${fact.statement}`);
        console.log(`    Domain: ${fact.domain}, Tags: ${fact.tags.join(", ")}`);
      }

      // Check for React Hooks content
      const hasReactHooks = facts.some(fact => 
        fact.statement.toLowerCase().includes("react") || 
        fact.statement.toLowerCase().includes("hooks") ||
        fact.domain.toLowerCase().includes("react") ||
        fact.tags.some(tag => tag.toLowerCase().includes("react") || tag.toLowerCase().includes("hooks"))
      );

      if (hasReactHooks) {
        console.log(`❌ CONTAINS REACT HOOKS`);
      } else {
        console.log(`✅ NO REACT HOOKS`);
      }
    }
  }
}

verifyTopicFacts().catch(console.error);
