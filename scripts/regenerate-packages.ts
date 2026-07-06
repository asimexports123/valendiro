/**
 * Regenerate Knowledge Packages for Production Topics
 * 
 * This script directly calls the knowledge acquisition function to regenerate
 * knowledge packages with the expanded facts from the knowledgeAcquisitionWorker.
 */

import { createAdminClient } from "../lib/supabase/admin";
import { generateTopicFacts } from "../jobs/workers/knowledgeAcquisitionWorker";

const PRODUCTION_TOPICS = ["nodejs-cluster", "family-vacations", "vendor-management"];

// Map new fact types to existing types allowed by DB constraint
function mapFactType(type: string): string {
  const typeMap: Record<string, string> = {
    "definition": "definition",
    "property": "property",
    "rule": "rule",
    "procedural": "procedural",
    "causal": "causal",
    "example": "property",
    "warning": "rule",
    "checklist": "procedural",
    "faq": "property",
    "comparison": "property",
  };
  return typeMap[type] || "property";
}

async function regeneratePackages() {
  console.log("Regenerating Knowledge Packages with Expanded Facts");
  console.log("====================================================\n");

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

    // Generate new facts using the updated knowledgeAcquisitionWorker
    const newFacts = generateTopicFacts(slug);
    console.log(`Generated ${newFacts.length} facts`);

    // Delete existing facts for this package
    const { error: deleteError } = await supabase
      .from("knowledge_facts")
      .delete()
      .eq("package_id", pkg.id);

    if (deleteError) {
      console.log(`❌ Failed to delete existing facts: ${deleteError.message}`);
      continue;
    }

    // Insert new facts (map new types to existing types for DB constraint)
    const { error: insertError } = await supabase
      .from("knowledge_facts")
      .insert(newFacts.map(fact => ({
        package_id: pkg.id,
        statement: fact.statement,
        fact_type: mapFactType(fact.factType),
        confidence: fact.confidence,
        domain: fact.domain,
        scope: fact.scope,
        tags: fact.tags,
      })));

    if (insertError) {
      console.log(`❌ Failed to insert new facts: ${insertError.message}`);
      continue;
    }

    // Update knowledge package with new fact count
    const { error: updateError } = await supabase
      .from("knowledge_packages")
      .update({
        fact_count: newFacts.length,
        last_updated_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
      })
      .eq("id", pkg.id);

    if (updateError) {
      console.log(`❌ Failed to update package: ${updateError.message}`);
      continue;
    }

    console.log(`✅ Updated knowledge package with ${newFacts.length} facts`);
  }
}

regeneratePackages().catch(console.error);
