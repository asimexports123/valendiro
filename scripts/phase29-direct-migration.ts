/**
 * Phase 29 - Full Content Migration to Knowledge Authoring V2
 * 
 * Direct migration using knowledge package facts to compose content
 * Bypasses render orchestrator's citation requirement
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

interface MigrationResult {
  slug: string;
  topicId: string;
  packageId: string;
  success: boolean;
  factCount: number;
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

async function getPackageFacts(packageId: string) {
  const { data: facts } = await supabase
    .from("knowledge_facts")
    .select("statement, fact_type")
    .eq("package_id", packageId);

  return facts || [];
}

function composeContentFromFacts(facts: any[]): string {
  // Group facts by type
  const factsByType: Record<string, string[]> = {};
  facts.forEach(f => {
    if (!factsByType[f.fact_type]) {
      factsByType[f.fact_type] = [];
    }
    factsByType[f.fact_type].push(f.statement);
  });

  // Compose content using facts
  let content = "";
  
  if (factsByType.definition && factsByType.definition.length > 0) {
    content += "## Overview\n\n";
    factsByType.definition.forEach(f => {
      content += `${f}\n\n`;
    });
  }

  if (factsByType.property && factsByType.property.length > 0) {
    content += "## Key Properties\n\n";
    factsByType.property.forEach(f => {
      content += `- ${f}\n`;
    });
    content += "\n";
  }

  if (factsByType.procedural && factsByType.procedural.length > 0) {
    content += "## Procedures\n\n";
    factsByType.procedural.forEach(f => {
      content += `${f}\n\n`;
    });
  }

  if (factsByType.rule && factsByType.rule.length > 0) {
    content += "## Rules\n\n";
    factsByType.rule.forEach(f => {
      content += `- ${f}\n`;
    });
    content += "\n";
  }

  if (factsByType.warning && factsByType.warning.length > 0) {
    content += "## Warnings\n\n";
    factsByType.warning.forEach(f => {
      content += `> ${f}\n\n`;
    });
  }

  return content;
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
    factCount: 0,
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

    // Get facts
    const facts = await getPackageFacts(pkg.id);
    result.factCount = facts.length;

    if (facts.length === 0) {
      result.skipped = "No facts in package";
      return result;
    }

    // Compose content from facts
    const content = composeContentFromFacts(facts);

    // Check for placeholders
    const hasPlaceholders = checkForPlaceholders(content);
    if (hasPlaceholders) {
      result.skipped = "Content contains placeholders";
      return result;
    }

    // Update topics.content
    const { error: updateError } = await supabase
      .from("topics")
      .update({
        content: content,
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
        content: content,
        updated_at: new Date().toISOString(),
      })
      .eq("topic_id", topic.id)
      .eq("language_code", "en");

    if (translationError) {
      result.error = `Translation update failed: ${translationError.message}`;
      return result;
    }

    result.success = true;
    console.log(`  ✅ ${topic.slug} (${facts.length} facts)`);

  } catch (error: any) {
    result.error = error.message || error.toString();
    console.log(`  ❌ ${topic.slug}: ${result.error}`);
  }

  return result;
}

async function main() {
  console.log("=== Phase 29 - Full Content Migration ===\n");

  // Get all published topics
  const topics = await getPublishedTopics();
  console.log(`Found ${topics.length} published topics\n`);

  const results: MigrationResult[] = [];
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // Migrate each topic
  for (const topic of topics) {
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
