/**
 * Phase 33A: Environment Verification
 *
 * Verify execution environment, database connection, and data consistency
 */

import { createAdminClient, env } from "../lib/env";

async function verifyEnvironment() {
  console.log("Phase 33A: Environment Verification");
  console.log("=".repeat(60));

  // Environment Variables
  console.log("\n1. Environment Variables:");
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET"}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${env.SUPABASE_SERVICE_ROLE_KEY ? "SET (length: " + env.SUPABASE_SERVICE_ROLE_KEY.length + ")" : "NOT SET"}`);

  // Extract project ID from URL
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "";
  const projectIdMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  const projectId = projectIdMatch ? projectIdMatch[1] : "UNKNOWN";
  console.log(`   Project ID: ${projectId}`);

  // Database Connection
  console.log("\n2. Database Connection:");
  try {
    const sb = createAdminClient();
    console.log("   ✅ Connection successful");
  } catch (error: any) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return;
  }

  const sb = createAdminClient();

  // Topics Table Count
  console.log("\n3. Database Counts:");
  try {
    const { count: topicsCount } = await sb.from("topics").select("*", { count: "exact", head: true });
    console.log(`   Topics table: ${topicsCount || 0} rows`);
  } catch (error: any) {
    console.log(`   Topics table: ERROR - ${error.message}`);
  }

  // Published Topics Count
  try {
    const { count: publishedCount } = await sb.from("topics").select("*", { count: "exact", head: true }).eq("status", "published");
    console.log(`   Published topics: ${publishedCount || 0} rows`);
  } catch (error: any) {
    console.log(`   Published topics: ERROR - ${error.message}`);
  }

  // Knowledge Packages Count
  try {
    const { count: packagesCount } = await sb.from("knowledge_packages").select("*", { count: "exact", head: true });
    console.log(`   Knowledge packages: ${packagesCount || 0} rows`);
  } catch (error: any) {
    console.log(`   Knowledge packages: ERROR - ${error.message}`);
  }

  // Knowledge Facts Count
  try {
    const { count: factsCount } = await sb.from("knowledge_facts").select("*", { count: "exact", head: true });
    console.log(`   Knowledge facts: ${factsCount || 0} rows`);
  } catch (error: any) {
    console.log(`   Knowledge facts: ERROR - ${error.message}`);
  }

  // Sample Topics
  console.log("\n4. Sample Topics (first 5):");
  try {
    const { data: topics } = await sb.from("topics").select("slug, status, package_id").limit(5);
    if (topics && topics.length > 0) {
      topics.forEach((t: any) => {
        console.log(`   - ${t.slug} (status: ${t.status}, package_id: ${t.package_id})`);
      });
    } else {
      console.log("   No topics found");
    }
  } catch (error: any) {
    console.log(`   ERROR: ${error.message}`);
  }

  // Sample Knowledge Packages
  console.log("\n5. Sample Knowledge Packages (first 5):");
  try {
    const { data: packages } = await sb.from("knowledge_packages").select("id, slug, topic_id").limit(5);
    if (packages && packages.length > 0) {
      packages.forEach((p: any) => {
        console.log(`   - ${p.slug} (id: ${p.id}, topic_id: ${p.topic_id})`);
      });
    } else {
      console.log("   No knowledge packages found");
    }
  } catch (error: any) {
    console.log(`   ERROR: ${error.message}`);
  }

  // Check for pilot topics
  console.log("\n6. Pilot Topics Check:");
  const pilotTopics = [
    "python-programming-fundamentals",
    "git-version-control",
    "data-structures",
    "investing-basics",
    "cybersecurity-fundamentals",
    "nutrition-fundamentals",
    "diabetes",
    "travel-planning-fundamentals",
    "home-maintenance-basics",
    "leadership-fundamentals",
  ];

  for (const slug of pilotTopics) {
    const { data } = await sb.from("topics").select("slug").eq("slug", slug).maybeSingle();
    console.log(`   ${slug}: ${data ? "✅ FOUND" : "❌ NOT FOUND"}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Verification Complete");
}

verifyEnvironment()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
