/**
 * Trace Knowledge Package Lifecycle
 *
 * Trace the COMPLETE lifecycle of nodejs-cluster Knowledge Package
 */

import { createAdminClient } from "../lib/supabase/admin";

const TOPIC_SLUG = "nodejs-cluster";

interface LifecycleStep {
  step: string;
  executed: boolean;
  evidence: string;
  timestamp: string | null;
}

async function traceLifecycle() {
  console.log("Tracing Knowledge Package Lifecycle");
  console.log("====================================\n");

  const supabase = createAdminClient();
  const steps: LifecycleStep[] = [];

  // Step 1: Topic Created
  console.log("1. Topic Created");
  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug, status, created_at, updated_at")
    .eq("slug", TOPIC_SLUG)
    .maybeSingle();

  if (topic) {
    console.log(`   ✅ YES`);
    console.log(`   Topic ID: ${topic.id}`);
    console.log(`   Created: ${topic.created_at}`);
    console.log(`   Status: ${topic.status}`);
    steps.push({
      step: "Topic Created",
      executed: true,
      evidence: `Topic exists with ID ${topic.id}`,
      timestamp: topic.created_at,
    });
  } else {
    console.log(`   ❌ NO`);
    steps.push({
      step: "Topic Created",
      executed: false,
      evidence: "Topic not found in database",
      timestamp: null,
    });
  }

  if (!topic) {
    console.log("\n⚠️ Lifecycle stopped at Step 1: Topic not created");
    return steps;
  }

  // Step 2: Queue Created
  console.log(`\n2. Queue Created`);
  const { data: queueEntries } = await supabase
    .from("update_queue")
    .select("*")
    .eq("topic_id", topic.id);

  if (queueEntries && queueEntries.length > 0) {
    console.log(`   ✅ YES`);
    console.log(`   Queue entries: ${queueEntries.length}`);
    queueEntries.forEach((entry: any) => {
      console.log(`   - ${entry.job_type}: ${entry.created_at}`);
    });
    steps.push({
      step: "Queue Created",
      executed: true,
      evidence: `${queueEntries.length} queue entries found`,
      timestamp: queueEntries[0].created_at,
    });
  } else {
    console.log(`   ❌ NO`);
    console.log(`   No queue entries found for topic_id ${topic.id}`);
    steps.push({
      step: "Queue Created",
      executed: false,
      evidence: "No queue entries in update_queue table",
      timestamp: null,
    });
  }

  // Step 3: Knowledge Package Created
  console.log(`\n3. Knowledge Package Created`);
  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("topic_id", topic.id);

  if (packages && packages.length > 0) {
    console.log(`   ✅ YES`);
    console.log(`   Packages: ${packages.length}`);
    packages.forEach((pkg: any) => {
      console.log(`   - Package ID: ${pkg.id}`);
      console.log(`     Slug: ${pkg.slug}`);
      console.log(`     Status: ${pkg.status}`);
      console.log(`     Created: ${pkg.created_at}`);
    });
    steps.push({
      step: "Knowledge Package Created",
      executed: true,
      evidence: `${packages.length} package(s) found`,
      timestamp: packages[0].created_at,
    });
  } else {
    console.log(`   ❌ NO`);
    console.log(`   No knowledge packages found for topic_id ${topic.id}`);
    steps.push({
      step: "Knowledge Package Created",
      executed: false,
      evidence: "No packages in knowledge_packages table",
      timestamp: null,
    });
    return steps;
  }

  const packageId = packages[0].id;

  // Step 4: Facts Generated
  console.log(`\n4. Facts Generated`);
  const { count: factCount } = await supabase
    .from("knowledge_facts")
    .select("*", { count: "exact", head: true })
    .eq("package_id", packageId);

  if (factCount && factCount > 0) {
    console.log(`   ✅ YES`);
    console.log(`   Facts: ${factCount}`);
    steps.push({
      step: "Facts Generated",
      executed: true,
      evidence: `${factCount} facts found`,
      timestamp: null,
    });
  } else {
    console.log(`   ❌ NO`);
    console.log(`   No facts found for package_id ${packageId}`);
    steps.push({
      step: "Facts Generated",
      executed: false,
      evidence: "0 facts in knowledge_facts table",
      timestamp: null,
    });
    return steps;
  }

  // Step 5: Citations Generated
  console.log(`\n5. Citations Generated`);
  const { count: citationCount } = await supabase
    .from("knowledge_citations")
    .select("*", { count: "exact", head: true })
    .eq("package_id", packageId);

  if (citationCount && citationCount > 0) {
    console.log(`   ✅ YES`);
    console.log(`   Citations: ${citationCount}`);
    steps.push({
      step: "Citations Generated",
      executed: true,
      evidence: `${citationCount} citations found`,
      timestamp: null,
    });
  } else {
    console.log(`   ❌ NO`);
    console.log(`   No citations found for package_id ${packageId}`);
    steps.push({
      step: "Citations Generated",
      executed: false,
      evidence: "0 citations in knowledge_citations table",
      timestamp: null,
    });
    return steps;
  }

  // Step 6: Relationships Generated
  console.log(`\n6. Relationships Generated`);
  const { count: relationshipCount } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true })
    .eq("package_id", packageId);

  if (relationshipCount && relationshipCount > 0) {
    console.log(`   ✅ YES`);
    console.log(`   Relationships: ${relationshipCount}`);
    steps.push({
      step: "Relationships Generated",
      executed: true,
      evidence: `${relationshipCount} relationships found`,
      timestamp: null,
    });
  } else {
    console.log(`   ❌ NO`);
    console.log(`   No relationships found for package_id ${packageId}`);
    steps.push({
      step: "Relationships Generated",
      executed: false,
      evidence: "0 relationships in knowledge_relationships table",
      timestamp: null,
    });
    return steps;
  }

  // Step 7: QA
  console.log(`\n7. QA`);
  const { data: qaLogs } = await supabase
    .from("publication_logs")
    .select("*")
    .eq("package_id", packageId);

  if (qaLogs && qaLogs.length > 0) {
    console.log(`   ✅ YES`);
    console.log(`   QA logs: ${qaLogs.length}`);
    steps.push({
      step: "QA",
      executed: true,
      evidence: `${qaLogs.length} QA log entries found`,
      timestamp: null,
    });
  } else {
    console.log(`   ❌ NO`);
    console.log(`   No QA logs found for package_id ${packageId}`);
    steps.push({
      step: "QA",
      executed: false,
      evidence: "No QA logs in publication_logs table",
      timestamp: null,
    });
  }

  // Step 8: Status Changed
  console.log(`\n8. Status Changed`);
  const currentStatus = packages[0].status;
  if (currentStatus === "published" || currentStatus === "ready") {
    console.log(`   ✅ YES`);
    console.log(`   Current status: ${currentStatus}`);
    steps.push({
      step: "Status Changed",
      executed: true,
      evidence: `Package status is ${currentStatus}`,
      timestamp: packages[0].updated_at,
    });
  } else {
    console.log(`   ❌ NO`);
    console.log(`   Current status: ${currentStatus}`);
    steps.push({
      step: "Status Changed",
      executed: false,
      evidence: `Package status is ${currentStatus} (not ready/published)`,
      timestamp: null,
    });
  }

  // Step 9: Published
  console.log(`\n9. Published`);
  const { data: renderedOutputs } = await supabase
    .from("rendered_outputs")
    .select("*")
    .eq("package_id", packageId)
    .eq("status", "published");

  if (renderedOutputs && renderedOutputs.length > 0) {
    console.log(`   ✅ YES`);
    console.log(`   Rendered outputs: ${renderedOutputs.length}`);
    steps.push({
      step: "Published",
      executed: true,
      evidence: `${renderedOutputs.length} published rendered outputs found`,
      timestamp: renderedOutputs[0].created_at,
    });
  } else {
    console.log(`   ❌ NO`);
    console.log(`   No published rendered outputs found for package_id ${packageId}`);
    steps.push({
      step: "Published",
      executed: false,
      evidence: "No published rendered_outputs records",
      timestamp: null,
    });
  }

  return steps;
}

async function main() {
  const steps = await traceLifecycle();

  console.log(`\n\n========================================`);
  console.log(`LIFECYCLE DIAGRAM`);
  console.log(`========================================`);

  for (const step of steps) {
    const status = step.executed ? "✅" : "❌";
    console.log(`${status} ${step.step}`);
    if (!step.executed) {
      console.log(`   Evidence: ${step.evidence}`);
    }
  }

  // Find first broken step
  const firstBroken = steps.find(s => !s.executed);

  if (firstBroken) {
    console.log(`\n\n========================================`);
    console.log(`FIRST BROKEN STEP`);
    console.log(`========================================`);
    console.log(`Step: ${firstBroken.step}`);
    console.log(`Evidence: ${firstBroken.evidence}`);
  }

  // Save results
  const fs = require("fs");
  fs.writeFileSync(
    "./lifecycle-trace.json",
    JSON.stringify(steps, null, 2)
  );
  console.log(`\n\nLifecycle trace saved to: lifecycle-trace.json`);
}

main().catch(console.error);
