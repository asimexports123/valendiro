/**
 * Check Production Topics
 *
 * Checks the current state of the three production topics:
 * - nodejs-cluster
 * - family-vacations
 * - vendor-management
 */

import { createAdminClient } from "../lib/supabase/admin";

const PRODUCTION_TOPICS = ["nodejs-cluster", "family-vacations", "vendor-management"];

async function checkProductionTopics() {
  console.log("Checking Production Topics");
  console.log("==========================\n");

  const supabase = createAdminClient();

  for (const slug of PRODUCTION_TOPICS) {
    console.log(`\n--- ${slug} ---`);

    // Get topic
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("*")
      .eq("slug", slug)
      .single();

    if (topicError || !topic) {
      console.log(`❌ Topic not found: ${topicError?.message || "Not found"}`);
      continue;
    }

    console.log(`✅ Topic: ID=${topic.id}, status=${topic.status}`);

    // Get knowledge package
    const { data: pkg, error: pkgError } = await supabase
      .from("knowledge_packages")
      .select("*")
      .eq("topic_id", topic.id)
      .single();

    if (pkgError || !pkg) {
      console.log(`❌ Knowledge package not found: ${pkgError?.message || "Not found"}`);
      continue;
    }

    console.log(`✅ Knowledge Package: ID=${pkg.id}, status=${pkg.status}, fact_count=${pkg.fact_count}`);

    // Get facts
    const { count: factCount } = await supabase
      .from("knowledge_facts")
      .select("*", { count: "exact", head: true })
      .eq("package_id", pkg.id);

    console.log(`✅ Facts: ${factCount}`);

    // Get citations
    const { count: citationCount } = await supabase
      .from("knowledge_citations")
      .select("*", { count: "exact", head: true })
      .eq("package_id", pkg.id);

    console.log(`✅ Citations: ${citationCount}`);

    // Get relationships
    const { count: relationshipCount } = await supabase
      .from("knowledge_relationships")
      .select("*", { count: "exact", head: true })
      .eq("source_id", pkg.id)
      .eq("source_level", "package");

    console.log(`✅ Relationships: ${relationshipCount}`);

    // Get queue entry
    const { data: queueEntry } = await supabase
      .from("update_queue")
      .select("*")
      .eq("object_id", topic.id)
      .eq("object_type", "topic")
      .eq("job_type", "content_refresh")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queueEntry) {
      console.log(`✅ Queue Entry: ID=${queueEntry.id}, status=${queueEntry.status}`);
    } else {
      console.log(`⚠️  No queue entry found`);
    }

    // Get rendered output
    const { data: renderedOutput } = await supabase
      .from("rendered_outputs")
      .select("*")
      .eq("topic_id", topic.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (renderedOutput) {
      console.log(`✅ Rendered Output: ID=${renderedOutput.id}, status=${renderedOutput.status}`);
    } else {
      console.log(`⚠️  No rendered output found`);
    }
  }
}

checkProductionTopics().catch(console.error);
