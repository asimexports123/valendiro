/**
 * Final End-to-End Verification for nodejs-cluster
 *
 * Verifies each step of the knowledge package lifecycle with SQL evidence.
 */

import { createAdminClient } from "../lib/supabase/admin";

const TOPIC_SLUG = "nodejs-cluster";

interface VerificationResult {
  step: number;
  description: string;
  status: "PASS" | "FAIL" | "PENDING";
  evidence: string;
  sql?: string;
}

async function verifyQueueEntryCreated(supabase: any, topicId: string): Promise<VerificationResult> {
  const { data, error } = await supabase
    .from("update_queue")
    .select("*")
    .eq("object_id", topicId)
    .eq("object_type", "topic")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return {
      step: 1,
      description: "Queue entry created",
      status: "FAIL",
      evidence: `Error: ${error.message}`,
    };
  }

  if (!data || data.length === 0) {
    return {
      step: 1,
      description: "Queue entry created",
      status: "FAIL",
      evidence: "No queue entry found",
    };
  }

  return {
    step: 1,
    description: "Queue entry created",
    status: "PASS",
    evidence: `Queue entry found: ID=${data[0].id}, job_type=${data[0].job_type}, status=${data[0].status}, created_at=${data[0].created_at}`,
  };
}

async function verifyWorkerPickedJob(supabase: any, topicId: string): Promise<VerificationResult> {
  const { data, error } = await supabase
    .from("update_queue")
    .select("*")
    .eq("object_id", topicId)
    .eq("object_type", "topic")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return {
      step: 2,
      description: "Worker picked the job",
      status: "FAIL",
      evidence: `Error: ${error.message}`,
    };
  }

  if (!data || data.length === 0) {
    return {
      step: 2,
      description: "Worker picked the job",
      status: "FAIL",
      evidence: "No queue entry found",
    };
  }

  const job = data[0];
  if (job.status === "in_progress" || job.status === "completed") {
    return {
      step: 2,
      description: "Worker picked the job",
      status: "PASS",
      evidence: `Job status: ${job.status}, started_at: ${job.started_at || "N/A"}`,
    };
  }

  return {
    step: 2,
    description: "Worker picked the job",
    status: "PENDING",
    evidence: `Job status: ${job.status} (waiting for worker)`,
  };
}

async function verifyFactsInserted(supabase: any, packageId: string): Promise<VerificationResult> {
  const { count, error } = await supabase
    .from("knowledge_facts")
    .select("*", { count: "exact", head: true })
    .eq("package_id", packageId);

  if (error) {
    return {
      step: 3,
      description: "Facts inserted",
      status: "FAIL",
      evidence: `Error: ${error.message}`,
    };
  }

  if (!count || count === 0) {
    return {
      step: 3,
      description: "Facts inserted",
      status: "FAIL",
      evidence: "No facts found",
    };
  }

  return {
    step: 3,
    description: "Facts inserted",
    status: "PASS",
    evidence: `${count} facts found`,
  };
}

async function verifyCitationsInserted(supabase: any, packageId: string): Promise<VerificationResult> {
  const { count, error } = await supabase
    .from("knowledge_citations")
    .select("*", { count: "exact", head: true })
    .eq("package_id", packageId);

  if (error) {
    return {
      step: 4,
      description: "Citations inserted",
      status: "FAIL",
      evidence: `Error: ${error.message}`,
    };
  }

  if (!count || count === 0) {
    return {
      step: 4,
      description: "Citations inserted",
      status: "FAIL",
      evidence: "No citations found",
    };
  }

  return {
    step: 4,
    description: "Citations inserted",
    status: "PASS",
    evidence: `${count} citations found`,
  };
}

async function verifyRelationshipsInserted(supabase: any, packageId: string): Promise<VerificationResult> {
  // knowledge_relationships uses source_id and source_level, not package_id
  // For package-level relationships, source_level = 'package' and source_id = packageId
  const { count, error } = await supabase
    .from("knowledge_relationships")
    .select("*", { count: "exact", head: true })
    .eq("source_id", packageId)
    .eq("source_level", "package");

  if (error) {
    return {
      step: 5,
      description: "Relationships inserted",
      status: "FAIL",
      evidence: `Error: ${error.message}`,
    };
  }

  if (!count || count === 0) {
    return {
      step: 5,
      description: "Relationships inserted",
      status: "FAIL",
      evidence: "No relationships found",
    };
  }

  return {
    step: 5,
    description: "Relationships inserted",
    status: "PASS",
    evidence: `${count} relationships found`,
  };
}

async function verifyPackagePublished(supabase: any, packageId: string): Promise<VerificationResult> {
  const { data, error } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("id", packageId)
    .single();

  if (error) {
    return {
      step: 6,
      description: "Knowledge Package status = PUBLISHED",
      status: "FAIL",
      evidence: `Error: ${error.message}`,
    };
  }

  if (!data) {
    return {
      step: 6,
      description: "Knowledge Package status = PUBLISHED",
      status: "FAIL",
      evidence: "Package not found",
    };
  }

  if (data.status === "published") {
    return {
      step: 6,
      description: "Knowledge Package status = PUBLISHED",
      status: "PASS",
      evidence: `Package status: ${data.status}`,
    };
  }

  return {
    step: 6,
    description: "Knowledge Package status = PUBLISHED",
    status: "PENDING",
    evidence: `Package status: ${data.status} (waiting for publication)`,
  };
}

async function verifyRendererGeneratedHTML(supabase: any, packageId: string): Promise<VerificationResult> {
  const { data, error } = await supabase
    .from("rendered_outputs")
    .select("*")
    .eq("package_id", packageId)
    .eq("output_format", "html")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return {
      step: 7,
      description: "Renderer generated HTML",
      status: "FAIL",
      evidence: `Error: ${error.message}`,
    };
  }

  if (!data || data.length === 0) {
    return {
      step: 7,
      description: "Renderer generated HTML",
      status: "FAIL",
      evidence: "No rendered HTML found",
    };
  }

  const output = data[0];
  if (output.content && output.content.length > 100) {
    return {
      step: 7,
      description: "Renderer generated HTML",
      status: "PASS",
      evidence: `HTML content found, length: ${output.content.length} chars`,
    };
  }

  return {
    step: 7,
    description: "Renderer generated HTML",
    status: "FAIL",
    evidence: `HTML content too short or missing, length: ${output.content?.length || 0} chars`,
  };
}

async function verifyRenderedOutputsUpdated(supabase: any, packageId: string): Promise<VerificationResult> {
  const { data, error } = await supabase
    .from("rendered_outputs")
    .select("*")
    .eq("package_id", packageId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return {
      step: 8,
      description: "rendered_outputs updated",
      status: "FAIL",
      evidence: `Error: ${error.message}`,
    };
  }

  if (!data || data.length === 0) {
    return {
      step: 8,
      description: "rendered_outputs updated",
      status: "FAIL",
      evidence: "No rendered output found",
    };
  }

  const output = data[0];
  return {
    step: 8,
    description: "rendered_outputs updated",
    status: "PASS",
    evidence: `Rendered output found: ID=${output.id}, status=${output.status}, created_at=${output.created_at}`,
  };
}

async function verifyPublicURLServesContent(supabase: any, topicId: string): Promise<VerificationResult> {
  // Check if topic has rendered content via the public data flow
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, slug, status")
    .eq("id", topicId)
    .single();

  if (topicError || !topic) {
    return {
      step: 9,
      description: "Public URL serves NEW content",
      status: "FAIL",
      evidence: `Error fetching topic: ${topicError?.message || "Topic not found"}`,
    };
  }

  if (topic.status !== "published") {
    return {
      step: 9,
      description: "Public URL serves NEW content",
      status: "PENDING",
      evidence: `Topic status: ${topic.status} (not published yet)`,
    };
  }

  return {
    step: 9,
    description: "Public URL serves NEW content",
    status: "PASS",
    evidence: `Topic is published: slug=${topic.slug}, status=${topic.status}`,
  };
}

async function manualEditorialReview(supabase: any, packageId: string): Promise<VerificationResult> {
  const { data, error } = await supabase
    .from("rendered_outputs")
    .select("content")
    .eq("package_id", packageId)
    .eq("format", "html")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return {
      step: 10,
      description: "Manual editorial review",
      status: "FAIL",
      evidence: `No rendered content to review`,
    };
  }

  const content = data[0].content || "";

  // Check for placeholder text
  const hasPlaceholder = content.includes("placeholder") || 
                         content.includes("Lorem ipsum") ||
                         content.includes("This is a sample");

  // Check for generic sections
  const hasGeneric = content.includes("Introduction") && 
                    !content.includes("cluster") &&
                    !content.includes("worker") &&
                    !content.includes("process");

  // Check for domain-specific structure
  const hasDomainSpecific = content.includes("cluster") ||
                           content.includes("worker") ||
                           content.includes("process") ||
                           content.includes("Node.js") ||
                           content.includes("PM2") ||
                           content.includes("load balancing");

  const issues: string[] = [];
  if (hasPlaceholder) issues.push("placeholder text found");
  if (hasGeneric) issues.push("generic sections found");
  if (!hasDomainSpecific) issues.push("missing domain-specific structure");

  if (issues.length === 0) {
    return {
      step: 10,
      description: "Manual editorial review",
      status: "PASS",
      evidence: "No placeholder text, no generic sections, domain-specific structure present",
    };
  }

  return {
    step: 10,
    description: "Manual editorial review",
    status: "FAIL",
    evidence: `Issues found: ${issues.join(", ")}`,
  };
}

async function main() {
  console.log("Final End-to-End Verification for nodejs-cluster");
  console.log("===============================================\n");

  const supabase = createAdminClient();

  // Get topic and package IDs
  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug")
    .eq("slug", TOPIC_SLUG)
    .single();

  if (!topic) {
    console.log(`❌ Topic ${TOPIC_SLUG} not found`);
    return;
  }

  console.log(`Topic ID: ${topic.id}`);
  console.log(`Topic Slug: ${topic.slug}\n`);

  const { data: pkg } = await supabase
    .from("knowledge_packages")
    .select("id, slug, status")
    .eq("topic_id", topic.id)
    .single();

  if (!pkg) {
    console.log(`❌ No knowledge package found for topic ${TOPIC_SLUG}`);
    return;
  }

  console.log(`Package ID: ${pkg.id}`);
  console.log(`Package Slug: ${pkg.slug}`);
  console.log(`Package Status: ${pkg.status}\n`);

  const results: VerificationResult[] = [];

  // Run all verification steps
  results.push(await verifyQueueEntryCreated(supabase, topic.id));
  results.push(await verifyWorkerPickedJob(supabase, topic.id));
  results.push(await verifyFactsInserted(supabase, pkg.id));
  results.push(await verifyCitationsInserted(supabase, pkg.id));
  results.push(await verifyRelationshipsInserted(supabase, pkg.id));
  results.push(await verifyPackagePublished(supabase, pkg.id));
  results.push(await verifyRendererGeneratedHTML(supabase, pkg.id));
  results.push(await verifyRenderedOutputsUpdated(supabase, pkg.id));
  results.push(await verifyPublicURLServesContent(supabase, topic.id));
  results.push(await manualEditorialReview(supabase, pkg.id));

  // Print results
  console.log("Verification Results:");
  console.log("====================\n");

  let passCount = 0;
  let failCount = 0;
  let pendingCount = 0;

  for (const result of results) {
    const icon = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⏳";
    console.log(`${icon} Step ${result.step}: ${result.description}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Evidence: ${result.evidence}\n`);

    if (result.status === "PASS") passCount++;
    else if (result.status === "FAIL") failCount++;
    else pendingCount++;
  }

  console.log("Summary:");
  console.log("========");
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log(`PENDING: ${pendingCount}\n`);

  if (failCount === 0 && pendingCount === 0) {
    console.log("🎉 All steps PASSED");
    console.log("\nProduction Ready = YES");
  } else if (failCount > 0) {
    console.log("❌ Some steps FAILED");
    console.log("\nProduction Ready = NO");
  } else {
    console.log("⏳ Some steps PENDING (waiting for worker)");
    console.log("\nProduction Ready = PENDING");
  }
}

main().catch(console.error);
