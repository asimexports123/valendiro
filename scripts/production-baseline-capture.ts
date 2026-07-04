/**
 * Production Baseline Capture
 * 
 * Captures current production pages for the 5 validation topics.
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local from project root
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";

const topics = [
  "Python Programming Fundamentals",
  "Investing Basics",
  "Nutrition Fundamentals",
  "Travel Planning Fundamentals",
  "Marketing Fundamentals",
];

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  PRODUCTION BASELINE CAPTURE                                 ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const supabase = createAdminClient();

  for (const topic of topics) {
    console.log(`\n[${topic}]`);
    console.log("─".repeat(70));

    // Query topics table (articles are linked to topics)
    const { data: topicData, error: topicError } = await supabase
      .from("topics")
      .select("*")
      .ilike("slug", `%${topic.toLowerCase().replace(/\s+/g, "-")}%`)
      .maybeSingle();

    if (topicError) {
      console.error(`  Error querying topics: ${topicError.message}`);
      continue;
    }

    if (!topicData) {
      console.log(`  ⚠ No existing topic found for: ${topic}`);
      console.log(`  This topic needs to be created first.`);
      continue;
    }

    console.log(`  ✓ Topic ID: ${topicData.id}`);
    console.log(`  ✓ Slug: ${topicData.slug}`);
    console.log(`  ✓ Status: ${topicData.status}`);
    console.log(`  ✓ Created: ${topicData.created_at}`);
    console.log(`  ✓ Updated: ${topicData.updated_at}`);

    // Query articles linked to this topic
    const { data: articles, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("topic_id", topicData.id)
      .maybeSingle();

    if (!articleError && articles) {
      console.log(`  ✓ Article ID: ${articles.id}`);
      console.log(`  ✓ Article Status: ${articles.status}`);
      console.log(`  ✓ Article Created: ${articles.created_at}`);
    } else {
      console.log(`  ⚠ No article linked to this topic`);
    }

    // Query knowledge packages
    const { data: packages, error: pkgError } = await supabase
      .from("knowledge_packages")
      .select("*")
      .eq("topic_id", topicData.id)
      .order("version", { ascending: false })
      .limit(1);

    if (!pkgError && packages && packages.length > 0) {
      const pkg = packages[0];
      console.log(`  ✓ Knowledge Package ID: ${pkg.id}`);
      console.log(`  ✓ Package Version: ${pkg.version}`);
      console.log(`  ✓ Fact Count: ${pkg.fact_count}`);
      console.log(`  ✓ Status: ${pkg.status}`);
    } else {
      console.log(`  ⚠ No knowledge package found`);
    }

    // Store baseline data
    const baseline = {
      topic,
      topicId: topicData?.id,
      topicSlug: topicData?.slug,
      topicStatus: topicData?.status,
      articleId: articles?.id,
      articleStatus: articles?.status,
      knowledgePackage: packages?.[0] || null,
      capturedAt: new Date().toISOString(),
    };

    console.log(`  ✓ Baseline captured`);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("BASELINE CAPTURE COMPLETE");
  console.log(`${"=".repeat(70)}`);
}

main().catch(console.error);
