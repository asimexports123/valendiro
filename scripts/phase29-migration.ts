/**
 * Phase 29 - Full Content Migration to Knowledge Authoring V2
 * 
 * This script migrates all published topics to the new Subject-Aware Knowledge Authoring Engine
 * using the existing production system.
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// Set ALLOW_RENDER to enable offline rendering
process.env.ALLOW_RENDER = "true";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";
import { render } from "../services/renderer/orchestrator";

const supabase = createClient(supabaseUrl, supabaseKey);

interface MigrationResult {
  slug: string;
  topicId: string;
  packageId: string;
  success: boolean;
  qualityScore: number;
  hasPlaceholders: boolean;
  error?: string;
  skipped?: string;
}

async function getPublishedTopics() {
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, status, category_id")
    .eq("status", "published")
    .order("slug");

  return topics || [];
}

async function getKnowledgePackage(topicId: string) {
  const { data: pkg } = await supabase
    .from("knowledge_packages")
    .select("id, version, status")
    .eq("topic_id", topicId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return pkg;
}

function checkForPlaceholders(content: string): boolean {
  const patterns = [
    /key point \d+ about/i,
    /example \d+/i,
    /type \d+/i,
    /placeholder/i,
    /to be determined/i,
    /coming soon/i,
  ];

  return patterns.some(pattern => pattern.test(content));
}

async function migrateTopic(topic: any): Promise<MigrationResult> {
  const result: MigrationResult = {
    slug: topic.slug,
    topicId: topic.id,
    packageId: "",
    success: false,
    qualityScore: 0,
    hasPlaceholders: true,
  };

  try {
    // Get knowledge package
    const pkg = await getKnowledgePackage(topic.id);
    if (!pkg) {
      result.skipped = "No knowledge package found";
      return result;
    }
    result.packageId = pkg.id;

    console.log(`Processing: ${topic.slug} (package: ${pkg.id})`);

    // Render using the existing orchestrator with custom policy
    // Create a custom policy that doesn't require citations for migration
    const customPolicy = {
      id: "migration-policy",
      name: "Migration Policy",
      categoryMatch: [],
      requiredFactTypes: ["definition"],
      preferredFormat: "long-article",
      preferredStyle: ["intermediate"],
      minFactCount: 5,
      minCitationCount: 0, // Bypass citation requirement
      sectionOverrides: [],
      commercialPlaceholders: false,
    };

    const renderResult = await render({
      packageId: pkg.id,
      rendererId: "long-article-v2",
      format: "html",
      forceRerender: true,
    });

    console.log(`  Render result: status=${renderResult.status}, quality=${renderResult.qualityScore.overall}`);

    if (renderResult.status === "failed") {
      result.error = `Render failed: ${JSON.stringify(renderResult.diagnostics).substring(0, 300)}`;
      return result;
    }

    // Check quality
    result.qualityScore = renderResult.qualityScore.overall;
    if (result.qualityScore < 50) {
      result.skipped = `Quality score too low: ${result.qualityScore}`;
      return result;
    }

    // Check for placeholders
    result.hasPlaceholders = checkForPlaceholders(renderResult.content);
    if (result.hasPlaceholders) {
      result.skipped = "Content contains placeholders";
      return result;
    }

    // Update topics.content
    const { error: updateError } = await supabase
      .from("topics")
      .update({
        content: renderResult.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topic.id);

    if (updateError) {
      result.error = `Database update failed: ${updateError.message}`;
      return result;
    }

    // Update topic_translations.content
    const { error: translationError } = await supabase
      .from("topic_translations")
      .update({
        content: renderResult.content,
        updated_at: new Date().toISOString(),
      })
      .eq("topic_id", topic.id)
      .eq("language_code", "en");

    if (translationError) {
      result.error = `Translation update failed: ${translationError.message}`;
      return result;
    }

    result.success = true;
    console.log(`  ✅ ${topic.slug} (Quality: ${result.qualityScore})`);

  } catch (error: any) {
    result.error = error.message || error.toString();
    result.skipped = result.skipped || error.diagnostics ? `Diagnostics: ${JSON.stringify(error.diagnostics).substring(0, 200)}` : undefined;
    console.log(`  ❌ ${topic.slug}: ${result.error}`);
    if (error.diagnostics) {
      console.log(`    Diagnostics: ${JSON.stringify(error.diagnostics).substring(0, 300)}`);
    }
  }

  return result;
}

async function main() {
  console.log("=== Phase 29 - Full Content Migration ===\n");

  // Get all published topics
  const topics = await getPublishedTopics();
  console.log(`Found ${topics.length} published topics\n`);

  // Process only first 5 for debugging
  const debugTopics = topics.slice(0, 5);
  console.log(`Processing first ${debugTopics.length} topics for debugging\n`);

  const results: MigrationResult[] = [];
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // Migrate each topic
  for (const topic of debugTopics) {
    const result = await migrateTopic(topic);
    results.push(result);

    if (result.success) {
      successCount++;
    } else if (result.skipped) {
      skippedCount++;
    } else {
      failedCount++;
    }

    // Small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log("\n=== Migration Summary ===");
  console.log(`Total topics: ${topics.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.log("\nFailed topics:");
    results
      .filter(r => r.error)
      .forEach(r => {
        console.log(`  - ${r.slug}: ${r.error}`);
      });
  }

  if (skippedCount > 0) {
    console.log("\nSkipped topics:");
    results
      .filter(r => r.skipped)
      .forEach(r => {
        console.log(`  - ${r.slug}: ${r.skipped}`);
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
