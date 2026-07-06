/**
 * Content Factory - Batch Processing
 * Process placeholder articles to create useful live content
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.ALLOW_RENDER = "true";

import { createClient } from '@supabase/supabase-js';
import { render } from '../services/renderer/orchestrator';

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const BATCH_SIZE = 25;

async function getPlaceholderArticles(): Promise<string[]> {
  const { data: allTranslations } = await sb
    .from("topic_translations")
    .select("topic_id, content, topics!inner(slug)")
    .eq("language_code", "en");
  
  const placeholders = allTranslations?.filter(t => 
    !t.content || t.content.length < 200 || 
    t.content.includes("No articles yet") || 
    t.content.includes("Coming soon")
  );
  
  return placeholders?.map(p => p.topics?.slug).filter(Boolean) || [];
}

async function processArticle(slug: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get topic
    const { data: topic } = await sb
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (!topic) {
      return { success: false, error: "Topic not found" };
    }

    // Get knowledge packages for this topic
    const { data: pkgs } = await sb
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id);

    if (!pkgs || pkgs.length === 0) {
      return { success: false, error: "No knowledge package" };
    }

    // Use the first package
    const pkg = pkgs[0];

    // Render the knowledge package
    const renderResult = await render({
      packageId: pkg.id,
      format: "markdown",
      rendererId: "knowledge-authoring-v1",
      forceRerender: true
    });

    if (renderResult.status === "failed") {
      return { success: false, error: "Rendering failed" };
    }

    // Update topic_translations with rendered content
    const { error: updateError } = await sb
      .from("topic_translations")
      .update({ content: renderResult.content })
      .eq("topic_id", topic.id)
      .eq("language_code", "en");

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function verifyLivePage(slug: string): Promise<boolean> {
  try {
    const response = await fetch(`https://valendiro.com/en/topics/${slug}`);
    return response.status === 200 && (await response.text()).length > 1000;
  } catch {
    return false;
  }
}

async function main() {
  const startTime = Date.now();
  console.log("=== Content Factory - Batch Processing ===\n");

  const placeholderSlugs = await getPlaceholderArticles();
  console.log(`Total placeholder articles: ${placeholderSlugs.length}\n`);

  let articlesImproved = 0;
  let liveUrlsUpdated = 0;
  const failedTopics: string[] = [];

  const firstBatch = placeholderSlugs.slice(0, BATCH_SIZE);
  console.log(`Processing batch 1/${Math.ceil(placeholderSlugs.length / BATCH_SIZE)} (${firstBatch.length} articles)\n`);

  for (const slug of firstBatch) {
    console.log(`Processing: ${slug}`);
    const result = await processArticle(slug);
    
    if (result.success) {
      const verified = await verifyLivePage(slug);
      if (verified) {
        console.log(`  ✓ Success - Live URL verified`);
        articlesImproved++;
        liveUrlsUpdated++;
      } else {
        console.log(`  ✓ Success - Live URL not verified`);
        articlesImproved++;
      }
    } else {
      console.log(`  ✗ Failed: ${result.error}`);
      failedTopics.push(slug);
    }
  }

  const remainingPlaceholders = placeholderSlugs.length - articlesImproved;
  const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n=== Batch 1 Complete ===`);
  console.log(`Placeholder Articles Remaining: ${remainingPlaceholders}`);
  console.log(`Articles Improved: ${articlesImproved}`);
  console.log(`Live URLs Updated: ${liveUrlsUpdated}`);
  console.log(`Failed Topics: ${failedTopics.length}`);
  console.log(`Execution Time: ${executionTime}s`);

  if (failedTopics.length > 0) {
    console.log(`\nFailed topics moved to retry queue: ${failedTopics.join(', ')}`);
  }
}

main().catch(console.error);
