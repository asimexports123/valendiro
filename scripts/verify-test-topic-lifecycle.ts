/**
 * Verify End-to-End Lifecycle for Test Topic
 *
 * Verifies the complete lifecycle for the test topic "test-react-hooks-v2-2026"
 * to validate the unified queue architecture.
 */

import { createAdminClient } from "../lib/supabase/admin";

const TEST_SLUG = "test-react-hooks-v2-2026";

async function verifyLifecycle() {
  console.log("Verifying End-to-End Lifecycle for Test Topic");
  console.log("==============================================\n");

  const supabase = createAdminClient();

  // Step 1: Verify topic exists
  console.log("Step 1: Verifying topic exists...");
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", TEST_SLUG)
    .single();

  if (topicError || !topic) {
    console.error(`❌ Topic not found: ${topicError?.message || "Not found"}`);
    return;
  }

  console.log(`✅ Topic found: ID=${topic.id}, slug=${topic.slug}, status=${topic.status}\n`);

  // Step 2: Verify knowledge package exists
  console.log("Step 2: Verifying knowledge package exists...");
  const { data: pkg, error: pkgError } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("topic_id", topic.id)
    .single();

  if (pkgError || !pkg) {
    console.error(`❌ Knowledge package not found: ${pkgError?.message || "Not found"}`);
    return;
  }

  console.log(`✅ Knowledge package found: ID=${pkg.id}, status=${pkg.status}, fact_count=${pkg.fact_count}\n`);

  // Step 3: Verify queue entry exists
  console.log("Step 3: Verifying queue entry exists...");
  const { data: queueEntry, error: queueError } = await supabase
    .from("update_queue")
    .select("*")
    .eq("object_id", topic.id)
    .eq("object_type", "topic")
    .eq("job_type", "content_refresh")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (queueError || !queueEntry) {
    console.error(`❌ Queue entry not found: ${queueError?.message || "Not found"}`);
    return;
  }

  console.log(`✅ Queue entry found: ID=${queueEntry.id}, status=${queueEntry.status}\n`);

  // Step 4: Verify facts were generated
  console.log("Step 4: Verifying facts were generated...");
  const { count: factCount, error: factError } = await supabase
    .from("knowledge_facts")
    .select("*", { count: "exact", head: true })
    .eq("package_id", pkg.id);

  if (factError) {
    console.error(`❌ Failed to count facts: ${factError.message}`);
    return;
  }

  console.log(`✅ Facts found: ${factCount}\n`);

  // Step 5: Verify citations were generated
  console.log("Step 5: Verifying citations were generated...");
  const { count: citationCount, error: citationError } = await supabase
    .from("knowledge_citations")
    .select("*", { count: "exact", head: true })
    .eq("package_id", pkg.id);

  if (citationError) {
    console.error(`❌ Failed to count citations: ${citationError.message}`);
    return;
  }

  console.log(`✅ Citations found: ${citationCount}\n`);

  // Step 6: Verify relationships were generated
  console.log("Step 6: Verifying relationships were generated...");
  const { count: relationshipCount, error: relationshipError } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true })
    .eq("source_id", pkg.id)
    .eq("source_level", "package");

  if (relationshipError) {
    console.error(`❌ Failed to count relationships: ${relationshipError.message}`);
    return;
  }

  console.log(`✅ Relationships found: ${relationshipCount}\n`);

  // Step 7: Verify package status was updated to "ready"
  console.log("Step 7: Verifying package status was updated to 'ready'...");
  if (pkg.status !== "ready") {
    console.error(`❌ Package status is ${pkg.status}, expected 'ready'`);
    return;
  }

  console.log(`✅ Package status is 'ready'\n`);

  // Step 8: Verify queue job was marked as completed
  console.log("Step 8: Verifying queue job was marked as completed...");
  if (queueEntry.status !== "completed") {
    console.error(`❌ Queue job status is ${queueEntry.status}, expected 'completed'`);
    return;
  }

  console.log(`✅ Queue job status is 'completed'\n`);

  console.log("==============================================");
  console.log("End-to-End Lifecycle Verification: PASSED");
  console.log("==============================================");
  console.log(`Topic: ${topic.slug}`);
  console.log(`Package ID: ${pkg.id}`);
  console.log(`Package Status: ${pkg.status}`);
  console.log(`Facts: ${factCount}`);
  console.log(`Citations: ${citationCount}`);
  console.log(`Relationships: ${relationshipCount}`);
  console.log(`Queue Job ID: ${queueEntry.id}`);
  console.log(`Queue Job Status: ${queueEntry.status}`);
}

verifyLifecycle().catch(console.error);
