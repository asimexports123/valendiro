/**
 * Phase 29 - Full Content Migration to Knowledge Authoring V2
 * 
 * This script:
 * 1. Counts all published topics
 * 2. Triggers the full rerender using the existing production API
 * 3. Monitors results
 * 4. Reports statistics
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RENDER_SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function countPublishedTopics() {
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, status")
    .eq("status", "published");

  return topics || [];
}

async function triggerFullRerender() {
  const API_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const endpoint = `${API_URL}/api/admin/renderer-rerender`;

  console.log(`Triggering full rerender at: ${endpoint}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "full",
      secret: RENDER_SECRET,
    }),
  });

  const text = await response.text();
  console.log(`Response status: ${response.status}`);
  console.log(`Response body: ${text}`);

  if (!response.ok) {
    throw new Error(`Rerender failed: ${text}`);
  }

  return JSON.parse(text);
}

async function main() {
  console.log("=== Phase 29 - Full Content Migration ===\n");

  // Step 1: Count published topics
  console.log("Step 1: Counting published topics...");
  const publishedTopics = await countPublishedTopics();
  console.log(`Found ${publishedTopics.length} published topics`);

  // Step 2: Trigger full rerender
  console.log("\nStep 2: Triggering full rerender...");
  const result = await triggerFullRerender();
  
  console.log("\n=== Rerender Results ===");
  console.log(`Total articles: ${result.totalArticles}`);
  console.log(`Successful: ${result.successful}`);
  console.log(`Failed: ${result.failed}`);
  
  if (result.errors && result.errors.length > 0) {
    console.log("\nErrors:");
    result.errors.forEach((error: any) => {
      console.log(`  - ${error.slug}: ${error.error}`);
    });
  }

  console.log("\n=== Migration Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
